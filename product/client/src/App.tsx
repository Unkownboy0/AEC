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
import { MobileDebugOverlay } from './components/mobile/MobileDebugOverlay';
import { useEffect } from 'react';
import { CapacitorNativeService } from './lib/capacitor-native';

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
    // Only native UI init here — push is handled by NotificationProvider
    CapacitorNativeService.initNativeAppUI();
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DeviceProvider>
          <BrowserRouter>
            <AuthProvider>
              <DelegationProvider>
                <RBACProvider>
                  <ProfileDrawerProvider>
                    <NotificationProvider>
                      <AppInit />
                      <AppBootstrap>
                        <AppRouter />
                        {import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOBILE_DEBUG === 'true' && (
                          <MobileDebugOverlay />
                        )}
                      </AppBootstrap>
                      {/* Global toast notifications */}
                      <Toaster />
                    </NotificationProvider>
                  </ProfileDrawerProvider>
                </RBACProvider>
              </DelegationProvider>
            </AuthProvider>
          </BrowserRouter>
        </DeviceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
