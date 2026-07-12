import { ColorModeProvider } from '@/context/ColorModeContext';
import { AuthProvider } from '@/hooks/useAuth';
import AppRoutes from '@/routes';

function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ColorModeProvider>
  );
}

export default App;
