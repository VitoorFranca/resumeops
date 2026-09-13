const APP_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function getClerkToken(): Promise<string | null> {
  const cookie = await chrome.cookies.get({ url: APP_URL, name: '__session' }).catch(() => null);
  const token = cookie?.value;
  if (!token) return null;

  // Decode the JWT payload and check expiry — avoids treating stale cookies as valid
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  } catch {
    return null;
  }

  return token;
}

export async function isSignedIn(): Promise<boolean> {
  return (await getClerkToken()) !== null;
}
