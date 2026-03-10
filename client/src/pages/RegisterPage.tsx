import { Navigate } from 'react-router-dom';

// Registration is now handled by the unified email code flow on /login
export default function RegisterPage() {
  return <Navigate to="/login" replace />;
}
