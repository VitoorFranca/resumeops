import { Header } from '../App';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export function AuthView() {
  function openSignIn() {
    chrome.tabs.create({ url: `${BASE_URL}/sign-in` });
  }

  return (
    <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <Header />

      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb', padding: '24px 20px',
        width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Sign in to ResumeOps
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
          Open ResumeOps and sign in. The extension will automatically detect your session.
        </div>

        <button
          onClick={openSignIn}
          style={{
            width: '100%', padding: '11px 16px',
            background: '#111827', color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Open ResumeOps →
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
        After signing in, click the extension icon again to continue.
      </p>
    </div>
  );
}
