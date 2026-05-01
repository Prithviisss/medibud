import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('token');

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
