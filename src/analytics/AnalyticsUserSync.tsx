import { useEffect } from 'react';

import { syncAnalyticsUserProfile } from '@/analytics/analytics.service';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function AnalyticsUserSync() {
  const { user, onboardingCompleted } = useAuth();
  const { preference } = useTheme();

  useEffect(() => {
    void syncAnalyticsUserProfile({
      userId: user?.id ?? null,
      onboardingCompleted: user ? onboardingCompleted : undefined,
      themePreference: user ? preference : undefined,
    });
  }, [user?.id, onboardingCompleted, preference, user]);

  return null;
}
