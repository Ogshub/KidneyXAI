import { useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BookOpen, ChartNoAxesCombined, ClipboardList, FileText, HeartPulse, LayoutDashboard, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './workspace.css';

const links = [
  ['Overview', '/dashboard', LayoutDashboard],
  ['Assessment', '/assessment', HeartPulse],
  ['Medical Records', '/reports', FileText],
  ['Health Trends', '/lab-history', ChartNoAxesCombined],
  ['Daily Tracker', '/tracker', Activity],
  ['Recommendations', '/recommendations', BookOpen],
  ['Health Profile', '/profile', UserRound],
  ['Settings', '/settings', Settings],
];

function WorkspaceNav({ onNavigate }) {
  return <>
    <nav className="workspace-nav" aria-label="Health workspace">{links.map(([label, path, Icon]) =>
      <NavLink key={path} to={path} onClick={onNavigate}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}</nav>
    <nav className="workspace-nav workspace-research" aria-label="Research">
      <NavLink to="/analytics" onClick={onNavigate}><ChartNoAxesCombined size={18} aria-hidden="true" />Research Analytics</NavLink>
      <NavLink to="/research-survey" onClick={onNavigate}><ClipboardList size={18} aria-hidden="true" />Research Survey</NavLink>
    </nav>
  </>;
}

export function WorkspaceShell() {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mobileMenu = useRef(null);
  const account = useRef(null);
  const page = links.find(([, path]) => pathname === path || pathname.startsWith(`${path}/`))?.[0]
    || { '/analytics': 'Research Analytics', '/research-survey': 'Research Survey', '/report-comparison': 'Compare Reports', '/history': 'Assessment History' }[pathname];

  const closeMenu = () => { if (mobileMenu.current) mobileMenu.current.open = false; };
  const closeAccount = () => { if (account.current) account.current.open = false; };

  return <div className="workspace">
    <a className="sr-only focus:not-sr-only workspace-skip" href="#workspace-main">Skip to content</a>
    <aside className="workspace-sidebar">
      <Link className="workspace-brand" to="/dashboard"><HeartPulse size={22} aria-hidden="true" />KidneyCare<span>XAI</span></Link>
      <WorkspaceNav />
    </aside>
    <div className="workspace-body">
      <header className="workspace-header">
        <details ref={mobileMenu} className="workspace-mobile" onKeyDown={(event) => {
          if (event.key === 'Escape') { closeMenu(); mobileMenu.current?.querySelector('summary')?.focus(); }
        }}>
          <summary aria-label="Workspace navigation"><Menu aria-hidden="true" size={22} /></summary>
          <div className="workspace-popover"><WorkspaceNav onNavigate={closeMenu} /></div>
        </details>
        <Link className="workspace-brand workspace-header-brand" to="/dashboard" onClick={closeMenu}>
          <HeartPulse size={20} aria-hidden="true" />KidneyCare<span>XAI</span>
        </Link>
        {page && <span className="workspace-page">{page}</span>}
        <div className="workspace-account">
          <button type="button" aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
            title={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'} onClick={toggleTheme}>
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
          <details ref={account} onKeyDown={(event) => {
            if (event.key === 'Escape') { closeAccount(); account.current?.querySelector('summary')?.focus(); }
          }}>
            <summary aria-label="Account menu"><UserRound size={19} aria-hidden="true" /><span>{user?.name?.split(' ')[0] || 'Account'}</span></summary>
            <div className="workspace-popover workspace-account-menu">
              <Link to="/profile" onClick={closeAccount}>Health Profile</Link>
              <Link to="/settings" onClick={closeAccount}>Settings</Link>
              <button type="button" onClick={() => { closeAccount(); logout(); navigate('/'); }}>Sign out</button>
            </div>
          </details>
        </div>
      </header>
      <main id="workspace-main" tabIndex={-1} className="workspace-main"><Outlet /></main>
    </div>
  </div>;
}
