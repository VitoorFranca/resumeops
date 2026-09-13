import { Header } from '../App';

const STEPS = [
  'Saving job…',
  'AI is analyzing your profile fit…',
  'Building your report…',
];

interface Props {
  step?: 0 | 1 | 2;
  message?: string;
}

export function LoadingView({ step = 0, message }: Props) {
  const text = message ?? STEPS[step];

  return (
    <div style={{
      padding: '32px 24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 24, minHeight: 280,
    }}>
      <Header />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {/* Spinner */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#14b8a6',
          animation: 'spin 0.8s linear infinite',
        }} />

        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
          {text}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i <= step ? '#14b8a6' : '#e5e7eb',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
