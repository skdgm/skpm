import React, { useState, useEffect, useMemo } from 'react';
import { Phone } from './types';
import { fetchPhoneData } from './services/googleSheetService';
import { authenticateUser, AuthResult } from './services/authService';
import PriceCard from './components/PriceCard';

const WIDE_LOGO_URL = "https://skmobile.in/wp-content/uploads/2024/01/skweblogo.webp";

/* =========================
   Safe Storage (iOS Safari)
========================= */
const safeStorage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  clear() {
    try {
      window.localStorage.clear();
    } catch {}
  }
};

const getCategoryEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('mobile') || n.includes('phone')) return '📱';
  if (n.includes('tab')) return '💻';
  if (n.includes('watch') || n.includes('wearable')) return '⌚';
  if (n.includes('buds') || n.includes('audio')) return '🎧';
  if (n.includes('ring')) return '💍';
  return '📦';
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    safeStorage.get('is_logged_in') === 'true'
  );

  const [userEmail, setUserEmail] = useState<string>(() =>
    safeStorage.get('user_email') || ''
  );

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [allPhones, setAllPhones] = useState<Phone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() =>
    safeStorage.get('last_synced_time')
  );

  const [connectionStatus, setConnectionStatus] =
    useState<'online' | 'offline' | 'syncing' | 'error' | 'checking'>('online');

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const displayName = useMemo(() => {
    if (!userEmail) return '';
    const name = userEmail.split('@')[0].split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [userEmail]);

  const loadData = async () => {
    setLoading(true);
    setConnectionStatus('syncing');

    try {
      const data = await fetchPhoneData();
      if (!Array.isArray(data)) throw new Error('Invalid data');

      setAllPhones(data);

      const now = new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });

      setLastSynced(now);
      safeStorage.set('last_synced_time', now);
      setConnectionStatus('online');
    } catch {
      setAllPhones([]);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;

    setAuthError('');
    setIsAuthenticating(true);
    setConnectionStatus('checking');

    try {
      const result: AuthResult = await authenticateUser(loginEmail, loginPass);

      if (result.success) {
        safeStorage.set('is_logged_in', 'true');
        safeStorage.set('user_email', loginEmail.toLowerCase().trim());
        setUserEmail(loginEmail.toLowerCase().trim());
        setIsLoggedIn(true);
        setConnectionStatus('online');
      } else {
        setAuthError(result.error || 'Invalid credentials');
        setConnectionStatus('error');
      }
    } catch {
      setAuthError('Network error');
      setConnectionStatus('error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const filteredPhones = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (q.length > 0) {
      return allPhones.filter(p =>
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    return allPhones.filter(p => {
      const brandOk = activeBrand === 'All' || p.brand === activeBrand;
      const catOk = activeCategory === 'All' || p.category === activeCategory;
      return brandOk && catOk;
    });
  }, [allPhones, searchQuery, activeBrand, activeCategory]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(allPhones.map(p => p.category))).sort()],
    [allPhones]
  );

  const brands = useMemo(() => {
    const base =
      activeCategory === 'All'
        ? allPhones
        : allPhones.filter(p => p.category === activeCategory);

    return ['All', ...Array.from(new Set(base.map(p => p.brand))).sort()];
  }, [allPhones, activeCategory]);

  const getBrandButtonStyles = (brand: string, isActive: boolean) => {
    if (!isActive) return 'bg-white text-slate-400 border border-slate-100';

    const b = brand.toLowerCase();
    if (b.includes('infinix')) return 'bg-[#CCFF00] text-black shadow-lg font-black';
    if (b.includes('samsung')) return 'bg-[#034EA2] text-white shadow-lg';
    if (b.includes('oppo')) return 'bg-[#008A45] text-white shadow-lg';
    if (b.includes('vivo')) return 'bg-[#008CFF] text-white shadow-lg';
    if (b.includes('realme')) return 'bg-[#FFC915] text-black shadow-lg font-black';
    if (b.includes('mi') || b.includes('xiaomi')) return 'bg-[#FF6700] text-white shadow-lg';
    if (b.includes('apple') || b.includes('google')) return 'bg-black text-white shadow-lg';
    if (b.includes('motorola') || b.includes('moto')) return 'bg-[#212121] text-white shadow-lg';
    if (b.includes('oneplus')) return 'bg-[#B20D0D] text-white shadow-lg';
    if (b.includes('nothing')) return 'bg-white text-black border-black shadow-lg';

    return 'bg-slate-900 text-white shadow-lg';
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-10 rounded-3xl shadow-xl">
          <img src={WIDE_LOGO_URL} className="h-10 mx-auto mb-6" />
          <input
            type="email"
            required
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-100"
            placeholder="Email"
          />
          <input
            type="password"
            required
            value={loginPass}
            onChange={e => setLoginPass(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-100"
            placeholder="Password"
          />
          {authError && (
            <p className="text-red-600 text-xs text-center mb-3">{authError}</p>
          )}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-[#B20D0D] text-white py-3 rounded-xl font-bold"
          >
            {isAuthenticating ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <img src={WIDE_LOGO_URL} className="h-5" />
        <button
          onClick={() => {
            safeStorage.clear();
            setIsLoggedIn(false);
          }}
          className="text-xs font-bold text-slate-500"
        >
          Logout
        </button>
      </header>

      <main className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhones.length > 0 ? (
          filteredPhones.map(p => <PriceCard key={p.id} phone={p} />)
        ) : (
          <p className="text-center text-slate-400 col-span-full">
            No matching items
          </p>
        )}
      </main>

      <button
        onClick={loadData}
        disabled={loading}
        className="fixed bottom-6 right-6 bg-[#B20D0D] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
      >
        <svg
          className={loading ? 'animate-spin' : ''}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path d="M4 4v5h.582M20 11a8 8 0 00-15.418-2M20 20v-5h-.581A8 8 0 014.581 15" />
        </svg>
      </button>
    </div>
  );
};

export default App;
