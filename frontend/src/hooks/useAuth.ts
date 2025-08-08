import { useAuthStore } from '../lib/store/auth';

export function useAuth() {
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
    initAuth,
    checkSubscription
  } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
    initAuth,
    checkSubscription,
    // Additional helper methods
    isPremium: user && (user.subscription_status === 'active' || user.subscription_status === 'trial'),
    isInTrial: user && user.subscription_status === 'trial',
    hasActiveSubscription: user && user.subscription_status === 'active'
  };
}
