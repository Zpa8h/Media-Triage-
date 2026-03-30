import path from 'path';
import { stat } from 'fs/promises';
import fg from 'fast-glob';
import { v4 as uuidv4 } from 'uuid';

const MEDIA_EXTENSIONS = [
  'epub', 'cbz', 'cbr', 'pdf',
  'mp3', 'm4b', 'm4a', 'flac', 'ogg', 'wav',
  'mkv', 'mp4', 'avi', 'mov', 'wmv',
  'mobi', 'azw', 'azw3', 'djvu',
];

/**
 * Build a map of { dirPath -> Set<subdirName> } for every directory in the tree.
 *
 * IMPORTANT: only SUBDIRECTORY children are counted — not files.
 * This matches the spec: the split point is where the directory tree BRANCHES,
 * not where individual files live. A directory that contains only files (no
 * subdirectories) is treated as a leaf cluster and does not create a split.
 *
 * How we know if a path component is a directory vs. a file: it's a directory
 * if it appears as a non-terminal component in at least one file path.
 *
 * @param {string[]} filePaths - Absolute POSIX paths
 * @returns {Map<string, Set<string>>}
 */
export function buildChildrenMap(filePaths) {
  const map = new Map();

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    // parts[0] === '' (leading slash), parts[last] === filename (a file, not a dir)
    // We register each directory → its direct subdirectory children.
    // A component at index i is a SUBDIRECTORY if i < parts.length - 1
    //   (i.e. it is NOT the final filename component).
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(0, i).join('/') || '/';
      const child = parts[i]; // this child is always a directory (not the leaf file)

      if (!map.has(parent)) map.set(parent, new Set());
      map.get(parent).add(child);
    }
  }

  return map;
}

/**
 * Compute the split point and bold segment for a single file path,
 * given a pre-built subdirectory-children map (from ALL files in the scan).
 *
 * Walk upward from the file's direct parent toward root.
 * The split point is the first ancestor directory that has MORE THAN ONE
 * subdirectory child — meaning the tree genuinely branches here.
 * The bold segment is everything from that branch point down to the filename.
 *
 * Fallback: if no ancestor has >1 subdir child, the entire path from root
 * is the bold segment (split point = '/').
 *
 * @param {string} filePath  - Absolute POSIX path
 * @param {Map<string, Set<string>>} childrenMap - subdir-only children map
 * @returns {{ splitPoint: string, boldSegment: string }}
 */
export function computeSplitPoint(filePath, childrenMap) {
  const parts = filePath.split('/');
  // Walk ancestors from direct parent (i = parts.length-2) up to root's child (i = 1)

  for (let i = parts.length - 2; i >= 1; i--) {
    const ancestor = parts.slice(0, i + 1).join('/') || '/';
    const subdirs = childrenMap.get(ancestor);

    if (subdirs && subdirs.size > 1) {
      const splitPoint = ancestor + '/';
      const boldSegment = parts.slice(i + 1).join('/');
      return { splitPoint, boldSegment };
    }
  }

  // Fallback: split at the filesystem root
  return {
    splitPoint: '/',
    boldSegment: parts.slice(1).join('/'),
  };
}

/**
 * Walk a directory asynchronously and return triage cards.
 *
 * @param {string} sourceDir - Absolute path to scan
 * @returns {Promise<object[]>}
 */
export async function scanDirectory(sourceDir) {
  const normalizedDir = path.resolve(sourceDir);

  const dirStat = await stat(normalizedDir);
  if (!dirStat.isDirectory()) {
    throw new Error(`Not a directory: ${normalizedDir}`);
  }

  const pattern = `**/*.{${MEDIA_EXTENSIONS.join(',')}}`;

  // Pass 1: collect all matching file paths
  const relativePaths = await fg(pattern, {
    cwd: normalizedDir,
    onlyFiles: true,
    dot: false,
    caseSensitiveMatch: false,
  });

  if (relativePaths.length === 0) return [];

  // Build absolute POSIX paths
  const normalizedPosix = normalizedDir.replace(/\\/g, '/');
  const absolutePaths = relativePaths.map(rel =>
    normalizedPosix + '/' + rel.replace(/\\/g, '/')
  );

  // Pass 2: build subdirectory children map from ALL paths
  const childrenMap = buildChildrenMap(absolutePaths);

  // Pass 3: stat each file and build cards
  const cards = await Promise.all(
    absolutePaths.map(async (fullPath) => {
      const { splitPoint, boldSegment } = computeSplitPoint(fullPath, childrenMap);
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).slice(1).toLowerCase();

      let sizeBytes = 0;
      try {
        const fileStat = await stat(fullPath);
        sizeBytes = fileStat.size;
      } catch {
        // File disappeared between glob and stat — skip gracefully
      }

      return {
        id: uuidv4(),
        filename,
        fullPath,
        splitPoint,
        boldSegment,
        format: ext,
        sizeBytes,
        decision: null,
        notes: '',
        decidedAt: null,
      };
    })
  );

  cards.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

  return cards;
}
