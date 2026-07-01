import { useEffect, useRef, useState } from 'react';
import { Search, Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { searchApi } from '../../api/misc.js';
import { notificationApi } from '../../api/misc.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import NotificationPanel from './NotificationPanel.jsx';
import SearchResultsPanel from './SearchResultsPanel.jsx';

export default function Topbar({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const canSearch = user?.role === 'hod' || user?.role === 'faculty';

  useEffect(() => {
    if (!canSearch || debouncedQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    let active = true;
    searchApi.global(debouncedQuery).then(({ data }) => {
      if (active) setSearchResults(data.data);
    });
    return () => {
      active = false;
    };
  }, [debouncedQuery, canSearch]);

  useEffect(() => {
    async function loadUnread() {
      try {
        const { data } = await notificationApi.list({ limit: 1 });
        setUnreadCount(data.data.unreadCount);
      } catch {
        // non-critical
      }
    }
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center gap-4 border-b border-ink/8 bg-paper/80 px-4 py-3 backdrop-blur-xl lg:px-8">
      <button
        onClick={onOpenMobileNav}
        className="rounded-lg p-2 text-ink/70 hover:bg-ink/5 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {canSearch ? (
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search students, faculty, subjects..."
            className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-slate/70 focus:border-ink/30 focus:outline-none"
          />
          {searchOpen && query.trim().length >= 2 && (
            <SearchResultsPanel results={searchResults} onClose={() => setSearchOpen(false)} />
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className="relative rounded-xl p-2.5 text-ink/70 hover:bg-ink/5"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <NotificationPanel
            onCountChange={setUnreadCount}
            onClose={() => setNotifOpen(false)}
          />
        )}
      </div>

      <div className="flex items-center gap-3 border-l border-ink/10 pl-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink">{user?.name}</p>
          <p className="text-xs capitalize leading-tight text-slate">{user?.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-light/50 font-display text-sm font-semibold text-ink">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl p-2.5 text-ink/60 hover:bg-clay-light hover:text-clay"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
