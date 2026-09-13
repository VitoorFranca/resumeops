import { Header } from '../App';
import { ExtensionApiError } from '../../lib/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface Props {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorView({ error, onRetry }: Props) {
  const { icon, title, message, action } = resolveError(error, onRetry);

  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <Header />

      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        padding: '20px', width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 16 }}>{message}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{action}</div>
      </div>
    </div>
  );
}

function resolveError(error: unknown, onRetry?: () => void) {
  if (error instanceof ExtensionApiError) {
    if (error.status === 401) {
      return {
        icon: '🔒',
        title: 'Session Expired',
        message: 'Your session expired. Refresh the ResumeOps tab or sign in again.',
        action: (
          <button
            onClick={() => chrome.tabs.create({ url: `${BASE_URL}/sign-in` })}
            style={btn('#111827', '#fff')}
          >
            Sign In →
          </button>
        ),
      };
    }

    if (error.status === 402) {
      return {
        icon: '📊',
        title: 'Evaluation Limit Reached',
        message: "You've used your 3 free evaluations this month. Upgrade to PRO for unlimited access.",
        action: (
          <button
            onClick={() => chrome.tabs.create({ url: `${BASE_URL}/settings` })}
            style={btn('#111827', '#fff')}
          >
            Upgrade to PRO →
          </button>
        ),
      };
    }

    const body = error.body as { error?: string };
    if (body.error === 'profile_not_found') {
      return {
        icon: '👤',
        title: 'Profile Incomplete',
        message: 'Complete your ResumeOps profile first so the AI can evaluate your fit.',
        action: (
          <button
            onClick={() => chrome.tabs.create({ url: `${BASE_URL}/profile` })}
            style={btn('#111827', '#fff')}
          >
            Complete Profile →
          </button>
        ),
      };
    }
  }

  return {
    icon: '⚡',
    title: 'Something Went Wrong',
    message: 'The analysis failed. Check your connection and try again.',
    action: onRetry ? (
      <button onClick={onRetry} style={btn('#111827', '#fff')}>Retry</button>
    ) : null,
  };
}

function btn(bg: string, color: string): React.CSSProperties {
  return {
    width: '100%', padding: '10px 16px',
    background: bg, color,
    border: 'none', borderRadius: 12,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
