import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ShoppingCart, Home, LogOut, LogIn, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import MenuPage      from './pages/MenuPage';
import TonightPage   from './pages/TonightPage';
import FeedPage      from './pages/FeedPage';
import LoginModal    from './pages/LoginPage';
import HouseholdPage from './pages/HouseholdPage';
import InfoPage      from './pages/InfoPage';

function Spinner() {
  const { T } = useLanguage();
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center text-gray-400">
      {T.loading}
    </div>
  );
}

/** Requires auth; shows login modal overlay on current page instead of redirecting */
function AuthedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <>{children}<LoginModal /></>;
  return <>{children}</>;
}

/** Global login modal for unauthenticated users — skipped on /info */
function GlobalLoginModal() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  if (isLoading || user || pathname === '/info' || pathname === '/') return null;
  return <LoginModal />;
}

function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-amber-700 border border-gray-200 hover:border-amber-300 rounded-lg transition-colors min-w-[34px] text-center"
      title={lang === 'en' ? 'Switch to Chinese' : '切换为英文'}
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, household, logout, isLoading } = useAuth();
  const { T } = useLanguage();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
    }`;

  return (
    <div className="min-h-screen bg-amber-50 overflow-x-hidden">
      <header className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          {/* Top row: logo + auth */}
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 text-amber-700 font-bold text-lg shrink-0">
              <UtensilsCrossed size={22} />
              Dinnerly
            </Link>

            <div className="flex items-center gap-1.5">
              <LangToggle />
              {!isLoading && (
                <>
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
                        <span className="hidden sm:block">{household?.name ?? T.household}</span>
                      </NavLink>
                      <span className="text-sm text-gray-400 hidden md:block">{user.name}</span>
                      <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={T.signOut}
                      >
                        <LogOut size={15} />
                        <span className="hidden sm:block">{T.signOut}</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/"
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium"
                    >
                      <LogIn size={15} />
                      <span className="hidden sm:block">{T.signIn}</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom row: nav links — scrollable on mobile */}
          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-px scrollbar-hide">
            <NavLink to="/" end className={navLinkClass}>
              <BookOpen size={14} />{T.menu}
            </NavLink>
            <NavLink to="/tonight" className={navLinkClass}>
              <ShoppingCart size={14} />{T.tonight}
            </NavLink>
            <NavLink to="/feed" className={navLinkClass}>
              <Sparkles size={14} />{T.community}
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
        <Route path="/login"    element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        <Route path="/household" element={
          <AuthedRoute><Layout><HouseholdPage /></Layout></AuthedRoute>
        } />

        <Route path="/info" element={<InfoPage />} />

        {/* Public — login modal overlays if not authenticated */}
        <Route path="/"        element={<Layout><MenuPage /></Layout>} />
        <Route path="/tonight" element={<Layout><TonightPage /></Layout>} />
        <Route path="/feed"    element={<Layout><FeedPage /></Layout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalLoginModal />
    </BrowserRouter>
  );
}
