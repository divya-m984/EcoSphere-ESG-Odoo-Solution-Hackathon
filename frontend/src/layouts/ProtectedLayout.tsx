import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ROUTES } from '@/utils/constants';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen message="Loading EcoSphere..." />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
}
