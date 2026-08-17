import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { RBACProvider } from './context/RBACContext';
import { ProfileDrawerProvider } from './context/ProfileDrawerContext';
import { DelegationProvider } from './modules/delegation/context/DelegationContext';
import { NotificationProvider } from './notifications/NotificationProvider';
import { Toaster } from './components/ui/Toast';
import { AppRouter } from './routes/Router';
import { AppBootstrap } from './app/bootstrap/AppBootstrap';
import { BiometricLockGate } from './components/shared/BiometricLockGate';
import { MobileDebugOverlay } from './components/mobile/MobileDebugOverlay';
import { useEffect } from 'react';
import { CapacitorNativeService } from './lib/capacitor-native';
import { InstitutionProvider } from './context/InstitutionContext';
import { KeyboardProvider } from './context/KeyboardContext';

/*
  App root.
  
  Provider order (outermost → innermost):
  1. QueryClient — data fetching
  2. ThemeProvider — CSS token updates + Capacitor status bar
  3. DeviceProvider — platform detection
  4. BrowserRouter — routing (required by useNavigate in NotificationProvider)
  5. AuthProvider — user session
  6. DelegationProvider — principal / VP delegation state
  7. RBACProvider — role-based access control
  8. ProfileDrawerProvider — profile sheet
  9. NotificationProvider — push registration + notification state
  
  Push notification registration is now managed entirely by NotificationProvider.
  CapacitorNativeService only handles status bar and splash screen here.
*/

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache staleTime for instant page navigation
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    },
  },
});

function AppInit() {
  useEffect(() => {
    // Native UI init (hide splash screen after bridge is ready)
    CapacitorNativeService.initNativeAppUI();

    // Mobile & web sensitive screen protection — deferred slightly to not block first paint
    const t = window.setTimeout(() => {
      import('./platform/screen-security').then(({ ScreenSecurityService }) => {
        ScreenSecurityService.init();
      });
    }, 500);

    // Device capability policy sync is intentionally NOT done here.
    // It requires authentication and a network call — doing it pre-auth causes:
    //   (a) Mixed Content warnings before scheme is negotiated
    //   (b) Unauthenticated 401 errors on /api/settings/device-capabilities
    //   (c) Main-thread blocking contributing to startup frame skip (497 frames)
    // It is deferred to post-auth in AppBootstrap.

    return () => window.clearTimeout(t);
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DeviceProvider>
          <KeyboardProvider>
            <InstitutionProvider>
              <BrowserRouter>
                <AuthProvider>
                  <DelegationProvider>
                    <RBACProvider>
                      <ProfileDrawerProvider>
                        <NotificationProvider>
                        <AppInit />
                        <AppBootstrap>
                          <BiometricLockGate>
                            <AppRouter />
                            {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOBILE_DEBUG === 'true' && (
                              <MobileDebugOverlay />
                            )}
                          </BiometricLockGate>
                        </AppBootstrap>
                        {/* Global toast notifications */}
                        <Toaster />
                        </NotificationProvider>
                      </ProfileDrawerProvider>
                    </RBACProvider>
                  </DelegationProvider>
                </AuthProvider>
              </BrowserRouter>
            </InstitutionProvider>
          </KeyboardProvider>
        </DeviceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
