
import React, { useState, useEffect, useMemo } from 'react';
import { Phone } from './types';
import { fetchPhoneData } from './services/googleSheetService';
import { authenticateUser } from './services/authService';
import PriceCard from './components/PriceCard';

const WIDE_LOGO_URL = "https://skmobile.in/wp-content/uploads/2024/01/skweblogo.webp";

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
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing' | 'error' | 'unknown'>('online');

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

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allPhones.map(p => p.category))).sort();
    return ['All', ...unique];
  }, [allPhones]);

  const brands = useMemo(() => {
    const filteredByCategory = activeCategory === 'All' ? allPhones : allPhones.filter(p => p.category === activeCategory);
    const unique = Array.from(new Set(filteredByCategory.map(p => p.brand))).sort();
    return ['All', ...unique];
  }, [allPhones, activeCategory]);

  const filteredPhones = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const globalMatches = allPhones.filter(phone => 
      phone.model.toLowerCase().includes(query) || 
      phone.brand.toLowerCase().includes(query)
    );

    const results = allPhones.filter(phone => {
      const matchesSearch = phone.model.toLowerCase().includes(query) || 
                           phone.brand.toLowerCase().includes(query);
      const matchesBrand = activeBrand === 'All' || phone.brand === activeBrand;
      const matchesCategory = activeCategory === 'All' || phone.category === activeCategory;
      return matchesSearch && matchesBrand && matchesCategory;
    });

    if (query !== '' && results.length === 0 && globalMatches.length > 0) {
      return globalMatches;
    }
    return results;
  }, [allPhones, searchQuery, activeBrand, activeCategory]);

  const getBrandColors = (brand: string) => {
    const b = brand.toLowerCase().trim();
    if (b === 'oneplus' || b.includes('one plus')) return 'bg-[#B20D0D] text-white';
    if (b.includes('apple') || b.includes('google') || b.includes('infinix')) return 'bg-black text-white';
    if (b.includes('samsung')) return 'bg-[#034EA2] text-white';
    if (b.includes('oppo')) return 'bg-[#008A45] text-white';
    if (b.includes('vivo')) return 'bg-[#008CFF] text-white';
    if (b.includes('realme')) return 'bg-[#FFC915] text-black';
    if (b.includes('mi') || b.includes('xiaomi')) return 'bg-[#FF6700] text-white';
    if (b.includes('nothing')) return 'bg-slate-200 text-slate-800';
    return 'bg-slate-900 text-white';
  };

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('ring')) return '💍';
    if (c.includes('watch')) return '⌚';
    if (c.includes('tablet') || c.includes('pad')) return '📟';
    if (c.includes('mobile') || c.includes('phone')) return '📱';
    if (c.includes('bud') || c.includes('audio')) return '🎧';
    if (c.includes('bird')) return '🐦';
    return '📦';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setConnectionStatus('syncing');
    const success = await authenticateUser(loginEmail, loginPass);
    if (success) {
      localStorage.setItem('is_logged_in', 'true');
      localStorage.setItem('user_email', loginEmail);
      setUserEmail(loginEmail);
      setIsLoggedIn(true);
      setConnectionStatus('online');
    } else {
      setAuthError('Access Denied: Invalid Credentials');
      setConnectionStatus('error');
    }
    setIsAuthenticating(false);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[3rem] p-10 shadow-xl border border-white">
        <div className="text-center mb-10">
          <img src={WIDE_LOGO_URL} alt="SK Logo" className="h-10 mx-auto mb-6 object-contain" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Price Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email" required 
            value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
            className="w-full px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200 outline-none focus:border-red-500 font-bold text-black placeholder:text-slate-400"
          />
          <input 
            type="password" placeholder="Password" required 
            value={loginPass} onChange={e => setLoginPass(e.target.value)}
            className="w-full px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200 outline-none focus:border-red-500 font-bold text-black placeholder:text-slate-400"
          />
          {authError && <p className="text-red-600 text-[10px] font-black text-center uppercase tracking-wider">{authError}</p>}
          <button className="w-full py-5 bg-[#B20D0D] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            {isAuthenticating ? 'Verifying...' : 'Sign In'}
          </button>
          
          <div className="flex items-center justify-center gap-2 mt-6 pt-4">
            <div className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
              connectionStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 
              connectionStatus === 'error' ? 'bg-red-500' : 
              'bg-black'
            }`}></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {connectionStatus === 'online' ? 'Connected' : 
               connectionStatus === 'syncing' ? 'Connecting...' : 
               connectionStatus === 'error' ? 'Server Error' : 
               'Unknown Status'}
            </p>
          </div>
        </form>
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
            <button onClick={() => {localStorage.clear(); setIsLoggedIn(false);}} className="p-2 bg-slate-100 rounded-lg text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </header>
        
        <div className="px-6 pb-3 max-w-7xl mx-auto space-y-3">
          <input 
            type="text" placeholder="Search across all brands & models..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-red-500/20 font-bold text-sm text-black"
          />
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => {setActiveCategory(cat); setActiveBrand('All');}}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all ${activeCategory === cat ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  <span>{cat === 'All' ? '🏠' : getCategoryIcon(cat)}</span>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {brands.map(brand => (
                <button 
                  key={brand} 
                  onClick={() => setActiveBrand(brand)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeBrand === brand ? getBrandColors(brand) + ' shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}
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
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">No results found</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass border border-slate-200 shadow-2xl rounded-[2rem] p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 px-3">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-orange-400 animate-pulse'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-800 leading-none uppercase">
              {connectionStatus === 'online' ? 'online' : connectionStatus === 'error' ? 'error' : 'syncing'}
            </p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">Synced: {lastSynced || 'Never'}</p>
          </div>
        </div>
        <button onClick={loadData} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default App;
