import React, { useState, useEffect, useMemo } from 'react';
import { Phone } from './types';
import { fetchPhoneData } from './services/googleSheetService';
import { authenticateUser, AuthResult } from './services/authService';
import PriceCard from './components/PriceCard';

const WIDE_LOGO_URL = "https://skmobile.in/wp-content/uploads/2024/01/skweblogo.webp";

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('is_logged_in') === 'true');
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('user_email') || '');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [allPhones, setAllPhones] = useState<Phone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(localStorage.getItem('last_synced_time'));
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing' | 'error' | 'checking'>('online');

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const displayName = useMemo(() => {
    if (!userEmail) return '';
    const namePart = userEmail.split('@')[0];
    const primaryName = namePart.split('.')[0]; 
    return primaryName.charAt(0).toUpperCase() + primaryName.slice(1);
  }, [userEmail]);

  const loadData = async () => {
    setLoading(true);
    setConnectionStatus('syncing');
    try {
      const data = await fetchPhoneData();
      setAllPhones(data);
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('last_synced_time', now);
      setConnectionStatus('online');
    } catch (err) {
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
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_email', loginEmail.toLowerCase().trim());
        setUserEmail(loginEmail.toLowerCase().trim());
        setIsLoggedIn(true);
        setConnectionStatus('online');
      } else {
        setAuthError(result.error || 'Invalid Credentials');
        setConnectionStatus('error');
      }
    } catch (err) {
      setAuthError('Network Error');
      setConnectionStatus('error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const filteredPhones = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // If there's a search query, ignore category/brand filters to prevent user confusion
    if (query.length > 0) {
      return allPhones.filter(phone => 
        phone.model.toLowerCase().includes(query) || 
        phone.brand.toLowerCase().includes(query)
      );
    }

    // Otherwise, apply standard filters
    return allPhones.filter(phone => {
      const matchesBrand = activeBrand === 'All' || phone.brand === activeBrand;
      const matchesCategory = activeCategory === 'All' || phone.category === activeCategory;
      return matchesBrand && matchesCategory;
    });
  }, [allPhones, searchQuery, activeBrand, activeCategory]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(allPhones.map(p => p.category))).sort()], [allPhones]);
  
  const brands = useMemo(() => {
    const filteredByCat = activeCategory === 'All' 
      ? allPhones 
      : allPhones.filter(p => p.category === activeCategory);
    return ['All', ...Array.from(new Set(filteredByCat.map(p => p.brand))).sort()];
  }, [allPhones, activeCategory]);

  const getBrandButtonStyles = (brand: string, isActive: boolean) => {
    if (!isActive) return 'bg-white text-slate-400 border border-slate-100';
    const b = brand.toLowerCase().trim();
    if (b.includes('infinix')) return 'bg-[#CCFF00] text-black shadow-lg font-black';
    if (b.includes('samsung')) return 'bg-[#034EA2] text-white shadow-lg';
    if (b.includes('oppo')) return 'bg-[#008A45] text-white shadow-lg';
    if (b.includes('vivo')) return 'bg-[#008CFF] text-white shadow-lg';
    if (b.includes('realme')) return 'bg-[#FFC915] text-black shadow-lg font-black';
    if (b.includes('mi') || b.includes('xiaomi')) return 'bg-[#FF6700] text-white shadow-lg';
    if (b.includes('apple') || b.includes('google')) return 'bg-black text-white shadow-lg';
    if (b.includes('motorola') || b.includes('moto')) return 'bg-[#212121] text-white shadow-lg';
    if (b.includes('oneplus') || b.includes('one plus')) return 'bg-[#B20D0D] text-white shadow-lg';
    if (b.includes('nothing')) return 'bg-white text-black border-black shadow-lg';
    return 'bg-slate-900 text-white shadow-lg';
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[3rem] p-10 shadow-xl border border-white relative overflow-hidden">
        {isAuthenticating && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#B20D0D] animate-[loading_1.5s_infinite]"></div>
          </div>
        )}
        <div className="text-center mb-10">
          <img src={WIDE_LOGO_URL} alt="SK Logo" className="h-10 mx-auto mb-6 object-contain" />
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">PRICE PORTAL</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
            <input 
              type="email" 
              placeholder="name@skpvtltd@gmail.com" 
              required 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200 outline-none focus:border-red-500 font-bold text-black appearance-none text-base"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={loginPass} 
              onChange={e => setLoginPass(e.target.value)}
              className="w-full px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200 outline-none focus:border-red-500 font-bold text-black appearance-none text-base"
            />
          </div>
          {authError && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 animate-shake">
               <p className="text-red-600 text-[10px] font-black text-center uppercase tracking-wider">{authError}</p>
            </div>
          )}
          <button type="submit" disabled={isAuthenticating} className="w-full py-5 bg-[#B20D0D] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50">
            {isAuthenticating ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-slate-100 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-orange-400 animate-pulse'}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {connectionStatus === 'online' ? 'CONNECTED' : connectionStatus === 'checking' ? 'CONNECTING...' : 'DISCONNECTED'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="sticky top-0 z-50 glass border-b border-slate-200">
        <header className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={WIDE_LOGO_URL} alt="Logo" className="h-5 w-auto" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900 leading-none">{displayName}</p>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">User</p>
            </div>
            <button onClick={() => {localStorage.clear(); setIsLoggedIn(false);}} className="p-2 bg-slate-100 rounded-lg text-slate-400 active:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </header>
        
        <div className="px-6 pb-4 max-w-7xl mx-auto space-y-4 mt-2">
          <input 
            type="text" 
            placeholder="Search by model or brand..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-red-500/20 font-bold text-sm text-black"
          />
          
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => {setActiveCategory(cat); setActiveBrand('All');}}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  <span className="text-sm">{getCategoryEmoji(cat)}</span>
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {brands.map(brand => (
                <button 
                  key={brand} 
                  onClick={() => setActiveBrand(brand)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${getBrandButtonStyles(brand, activeBrand === brand)}`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
        {filteredPhones.length > 0 ? (
          filteredPhones.map(phone => <PriceCard key={phone.id} phone={phone} />)
        ) : (
          <div className="col-span-full py-20 text-center">
             <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No matching items found</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass border border-slate-200 shadow-2xl rounded-full p-2 pr-2 flex items-center justify-between">
        <div className="flex items-center gap-3 px-4">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-orange-400 animate-pulse'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-800 leading-none uppercase">CONNECTED</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">Last: {lastSynced || '--:--'}</p>
          </div>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading} 
          className="bg-[#B20D0D] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
          aria-label="Refresh data"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;