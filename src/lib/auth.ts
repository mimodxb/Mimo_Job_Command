/**
 * auth.ts — OAuth Popup Helper
 */

export async function initiateOAuth(provider: 'google' | 'linkedin') {
  try {
    const origin = window.location.origin;
    const response = await fetch(`/api/auth/${provider}/url?origin=${encodeURIComponent(origin)}`);
    if (!response.ok) throw new Error(`Failed to get ${provider} auth URL`);
    
    const { url, error } = await response.json() as { url?: string; error?: string };
    if (error) throw new Error(error);
    if (!url) throw new Error('No auth URL returned');
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    const popup = window.open(
      url,
      `${provider}_oauth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === provider) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          resolve(true);
        }
      };

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          reject(new Error('Authentication window was closed before completion.'));
        }
      }, 1000);

      window.addEventListener('message', handleMessage);
    });
  } catch (error) {
    console.error(`${provider} OAuth Error:`, error);
    throw error;
  }
}
