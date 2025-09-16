/**
 * Utility functions for handling authentication errors and cleanup
 */

export function clearAuthData() {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear Supabase auth tokens
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-auth-token');
    
    // Clear any session storage
    sessionStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('sb-auth-token');
    
    // Clear cart data as well since user is signing out
    localStorage.removeItem('cart');
    
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

export function isAuthSessionError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || error.toString();
  return (
    message.includes('Auth session missing') ||
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('JWT expired') ||
    message.includes('refresh_token_not_found')
  );
}

export function handleAuthError(error: any) {
  console.error('Auth error detected:', error);
  
  if (isAuthSessionError(error)) {
    console.log('Clearing corrupted auth data...');
    clearAuthData();
    
    // Optionally reload the page to reset the app state
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
}