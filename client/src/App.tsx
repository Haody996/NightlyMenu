import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ShoppingCart, Home, LogOut, LogIn } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import MenuPage      from './pages/MenuPage';
import TonightPage   from './pages/TonightPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import HouseholdPage from './pages/HouseholdPage';

function Spinner() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );
}

/** Redirect logged-in users away from /login and /register */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, household, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (user && household) return <Navigate to="/" replace />;
  if (user && !household) return <Navigate to="/household" replace />;
  return <>{children}</>;
}

/** Requires auth, but passes through even without a household */
function AuthedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, household, logout, isLoading } = useAuth();

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
    }`;

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4 flex-wrap">
          <Link to="/" className="flex items-center gap-2 text-amber-700 font-bold text-xl">
            <UtensilsCrossed size={24} />
            Meal Planner
          </Link>

          {/* Nav links — always visible */}
          <nav className="flex gap-1">
            <NavLink to="/" end className={navLink}>Menu</NavLink>
            <NavLink
              to="/tonight"
              className={({ isActive }) => `${navLink({ isActive })} flex items-center gap-1.5`}
            >
              <ShoppingCart size={14} />Tonight
            </NavLink>
          </nav>

          {/* Right side: auth-dependent */}
          {!isLoading && (
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <NavLink
                    to="/household"
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'
                      }`
                    }
                  >
                    <Home size={14} />
                    <span className="hidden sm:block">{household?.name ?? 'Household'}</span>
                  </NavLink>
                  <span className="text-sm text-gray-400 hidden sm:block">{user.name}</span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:block">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium"
                  >
                    <LogIn size={14} />
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        <Route path="/household" element={
          <AuthedRoute><Layout><HouseholdPage /></Layout></AuthedRoute>
        } />

        {/* Public — no redirect, pages handle unauthenticated state themselves */}
        <Route path="/"        element={<Layout><MenuPage /></Layout>} />
        <Route path="/tonight" element={<Layout><TonightPage /></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
