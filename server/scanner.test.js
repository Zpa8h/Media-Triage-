import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChildrenMap, computeSplitPoint } from './scanner.js';

// -----------------------------------------------------------------------
// Fixture — the five files from the spec examples
// -----------------------------------------------------------------------
const SPEC_FILES = [
  '/Library/AuthorA/book1.epub',
  '/Library/AuthorA/book2.epub',
  '/Library/AuthorB/SeriesX/Book1/book1.epub',
  '/Library/AuthorB/SeriesX/Book2/book2.epub',
  '/Library/AuthorC/OnlyBook/onlybook.epub',
];

describe('buildChildrenMap', () => {
  it('only counts subdirectory children (not files)', () => {
    const map = buildChildrenMap(SPEC_FILES);

    // /Library has 3 subdir children: AuthorA, AuthorB, AuthorC
    assert.equal(map.get('/Library').size, 3);
    assert.ok(map.get('/Library').has('AuthorA'));
    assert.ok(map.get('/Library').has('AuthorB'));
    assert.ok(map.get('/Library').has('AuthorC'));

    // /Library/AuthorA has 0 subdir children (only files in it)
    assert.equal(map.get('/Library/AuthorA'), undefined);

    // /Library/AuthorB has 1 subdir child: SeriesX
    assert.equal(map.get('/Library/AuthorB').size, 1);
    assert.ok(map.get('/Library/AuthorB').has('SeriesX'));

    // /Library/AuthorB/SeriesX has 2 subdir children: Book1, Book2
    assert.equal(map.get('/Library/AuthorB/SeriesX').size, 2);
    assert.ok(map.get('/Library/AuthorB/SeriesX').has('Book1'));
    assert.ok(map.get('/Library/AuthorB/SeriesX').has('Book2'));

    // /Library/AuthorC has 1 subdir child: OnlyBook
    assert.equal(map.get('/Library/AuthorC').size, 1);

    // /Library/AuthorC/OnlyBook has 0 subdir children (only a file)
    assert.equal(map.get('/Library/AuthorC/OnlyBook'), undefined);
  });
});

describe('computeSplitPoint — spec examples', () => {
  const map = buildChildrenMap(SPEC_FILES);

  it('TC-1: /Library/AuthorA/book1.epub → split at /Library/', () => {
    const result = computeSplitPoint('/Library/AuthorA/book1.epub', map);
    assert.equal(result.splitPoint, '/Library/');
    assert.equal(result.boldSegment, 'AuthorA/book1.epub');
  });

  it('TC-2: /Library/AuthorA/book2.epub → split at /Library/', () => {
    const result = computeSplitPoint('/Library/AuthorA/book2.epub', map);
    assert.equal(result.splitPoint, '/Library/');
    assert.equal(result.boldSegment, 'AuthorA/book2.epub');
  });

  it('TC-3: /Library/AuthorB/SeriesX/Book1/book1.epub → split at /Library/AuthorB/SeriesX/', () => {
    const result = computeSplitPoint('/Library/AuthorB/SeriesX/Book1/book1.epub', map);
    assert.equal(result.splitPoint, '/Library/AuthorB/SeriesX/');
    assert.equal(result.boldSegment, 'Book1/book1.epub');
  });

  it('TC-4: /Library/AuthorB/SeriesX/Book2/book2.epub → split at /Library/AuthorB/SeriesX/', () => {
    const result = computeSplitPoint('/Library/AuthorB/SeriesX/Book2/book2.epub', map);
    assert.equal(result.splitPoint, '/Library/AuthorB/SeriesX/');
    assert.equal(result.boldSegment, 'Book2/book2.epub');
  });

  it('TC-5: /Library/AuthorC/OnlyBook/onlybook.epub → split at /Library/', () => {
    const result = computeSplitPoint('/Library/AuthorC/OnlyBook/onlybook.epub', map);
    assert.equal(result.splitPoint, '/Library/');
    assert.equal(result.boldSegment, 'AuthorC/OnlyBook/onlybook.epub');
  });
});

describe('computeSplitPoint — edge cases', () => {
  it('TC-6: single file in scan — no branches anywhere, fallback to root', () => {
    const files = ['/Docs/readme.pdf'];
    const map = buildChildrenMap(files);
    // /Docs has no subdir children (readme.pdf is a file)
    // / has 1 subdir child (Docs) — not enough to branch
    const result = computeSplitPoint('/Docs/readme.pdf', map);
    assert.equal(result.splitPoint, '/');
    assert.equal(result.boldSegment, 'Docs/readme.pdf');
  });

  it('TC-7: flat directory with multiple files — no subdirs, fallback to root', () => {
    // All files are directly under /Flat/ with no subdirectories.
    // /Flat/ has no subdir children → no split point found → fallback to root.
    const files = ['/Flat/a.mp3', '/Flat/b.mp3', '/Flat/c.mp3'];
    const map = buildChildrenMap(files);

    const r1 = computeSplitPoint('/Flat/a.mp3', map);
    assert.equal(r1.splitPoint, '/');
    assert.equal(r1.boldSegment, 'Flat/a.mp3');

    const r2 = computeSplitPoint('/Flat/b.mp3', map);
    assert.equal(r2.splitPoint, '/');
    assert.equal(r2.boldSegment, 'Flat/b.mp3');
  });

  it('TC-8: deeply nested single chain — no branches, fallback to root', () => {
    const files = ['/A/B/C/D/file.epub'];
    const map = buildChildrenMap(files);
    const result = computeSplitPoint('/A/B/C/D/file.epub', map);
    assert.equal(result.splitPoint, '/');
    assert.equal(result.boldSegment, 'A/B/C/D/file.epub');
  });

  it('TC-9: two sibling subdirs — both split at their common parent', () => {
    // /Root/DirA/fileA.epub and /Root/DirB/fileB.epub
    // /Root has 2 subdir children (DirA, DirB) → split here
    const files = ['/Root/DirA/fileA.epub', '/Root/DirB/fileB.epub'];
    const map = buildChildrenMap(files);

    const r1 = computeSplitPoint('/Root/DirA/fileA.epub', map);
    assert.equal(r1.splitPoint, '/Root/');
    assert.equal(r1.boldSegment, 'DirA/fileA.epub');

    const r2 = computeSplitPoint('/Root/DirB/fileB.epub', map);
    assert.equal(r2.splitPoint, '/Root/');
    assert.equal(r2.boldSegment, 'DirB/fileB.epub');
  });

  it('TC-10: empty file list — buildChildrenMap returns empty map', () => {
    const map = buildChildrenMap([]);
    assert.equal(map.size, 0);
  });
});
