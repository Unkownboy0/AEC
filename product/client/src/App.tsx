import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { RBACProvider } from './context/RBACContext';
import { Toaster } from './components/ui/Toast';
import { AppRouter } from './routes/Router';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DeviceProvider>
          <AuthProvider>
            <RBACProvider>
              <AppRouter />
              {/* Global Toast Notifications container */}
              <Toaster />
            </RBACProvider>
          </AuthProvider>
        </DeviceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

