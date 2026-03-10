import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { UtensilsCrossed, ShoppingCart, Home, LogOut, LogIn, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import MenuPage      from './pages/MenuPage';
import TonightPage   from './pages/TonightPage';
import FeedPage      from './pages/FeedPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import HouseholdPage from './pages/HouseholdPage';
import InfoPage      from './pages/InfoPage';

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
    }`;

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          {/* Top row: logo + auth */}
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 text-amber-700 font-bold text-lg shrink-0">
              <UtensilsCrossed size={22} />
              Dinnerly
            </Link>

            {!isLoading && (
              <div className="flex items-center gap-1.5">
                {user ? (
                  <>
                    <NavLink
                      to="/household"
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'
                        }`
                      }
                    >
                      <Home size={15} />
                      <span className="hidden sm:block">{household?.name ?? 'Household'}</span>
                    </NavLink>
                    <span className="text-sm text-gray-400 hidden md:block">{user.name}</span>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sign out"
                    >
                      <LogOut size={15} />
                      <span className="hidden sm:block">Sign out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium"
                    >
                      <LogIn size={15} />
                      <span className="hidden sm:block">Sign in</span>
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom row: nav links — scrollable on mobile */}
          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-px scrollbar-hide">
            <NavLink to="/" end className={navLinkClass}>
              <BookOpen size={14} />Menu
            </NavLink>
            <NavLink to="/tonight" className={navLinkClass}>
              <ShoppingCart size={14} />Tonight
            </NavLink>
            <NavLink to="/feed" className={navLinkClass}>
              <Sparkles size={14} />Community
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">{children}</main>
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

        <Route path="/info" element={<InfoPage />} />

        {/* Public — no redirect, pages handle unauthenticated state themselves */}
        <Route path="/"        element={<Layout><MenuPage /></Layout>} />
        <Route path="/tonight" element={<Layout><TonightPage /></Layout>} />
        <Route path="/feed"    element={<Layout><FeedPage /></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
