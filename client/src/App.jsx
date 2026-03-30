import React from 'react';
import PhaseBar from './components/PhaseBar.jsx';
import Scan from './phases/Scan.jsx';
import Configure from './phases/Configure.jsx';
import Triage from './phases/Triage.jsx';
import Export from './phases/Export.jsx';

const PHASES = ['scan', 'configure', 'triage', 'export'];

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    phase: p.get('phase') || 'scan',
    sessionId: p.get('session') || null,
  };
}

export function navigate(phase, sessionId) {
  const params = new URLSearchParams();
  params.set('phase', phase);
  if (sessionId) params.set('session', sessionId);
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('popstate'));
}

export default function App() {
  const [{ phase, sessionId }, setRoute] = React.useState(getParams);

  React.useEffect(() => {
    const onPop = () => setRoute(getParams());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const phaseIndex = PHASES.indexOf(phase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PhaseBar
        phases={PHASES}
        current={phaseIndex === -1 ? 0 : phaseIndex}
        sessionId={sessionId}
        onNavigate={(p) => navigate(PHASES[p], sessionId)}
      />
      <div style={{ flex: 1 }}>
        {phase === 'scan' && <Scan onSessionCreated={(id) => navigate('configure', id)} />}
        {phase === 'configure' && sessionId && (
          <Configure sessionId={sessionId} onDone={() => navigate('triage', sessionId)} />
        )}
        {phase === 'triage' && sessionId && (
          <Triage sessionId={sessionId} onExport={() => navigate('export', sessionId)} />
        )}
        {phase === 'export' && sessionId && (
          <Export sessionId={sessionId} onBack={() => navigate('triage', sessionId)} />
        )}
        {!sessionId && phase !== 'scan' && (
          <div className="page" style={{ paddingTop: 80, color: 'var(--text-dim)', textAlign: 'center' }}>
            No session selected. <a href="/">Go to Scan</a>
          </div>
        )}
      </div>
    </div>
  );
}
