import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '../../context/AuthContext';
import { GlobalAssistant } from '../assistant/GlobalAssistant';
import { WorkspaceShell } from './WorkspaceShell';

// Pages that manage their own full-screen backgrounds
const FULL_SCREEN_PAGES = ['/login', '/register'];

export const Layout = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isFullScreen = FULL_SCREEN_PAGES.includes(location.pathname);

  if (isFullScreen) {
    return <Outlet />;
  }

  if (isAuthenticated) return <GlobalAssistant key={user?.id ?? user?.email}><WorkspaceShell /></GlobalAssistant>;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
    >
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
