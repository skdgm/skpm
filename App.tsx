
import React, { useState, useEffect, useMemo } from 'react';
import { Phone } from './types';
import { fetchPhoneData } from './services/googleSheetService';
import { authenticateUser, AuthResult } from './services/authService';
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
    
    const cleanEmail = loginEmail.toLowerCase().trim();
    const cleanPass = loginPass.trim();
    
    try {
      const result: AuthResult = await authenticateUser(cleanEmail, cleanPass);
      
      if (result.success) {
        localStorage.setItem('is_logged_in', 'true');
        localStorage.setItem('user_email', cleanEmail);
        setUserEmail(cleanEmail);
        setIsLoggedIn(true);
        setConnectionStatus('online');
      } else {
        setAuthError(result.error || 'Access Denied');
        setConnectionStatus('error');
      }
    } catch (err) {
      setAuthError('Connection Failed');
      setConnectionStatus('error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const filteredPhones = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allPhones.filter(phone => {
      const matchesSearch = phone.model.toLowerCase().includes(query) || 
                           phone.brand.toLowerCase().includes(query);
      const matchesBrand = activeBrand === 'All' || phone.brand === activeBrand;
      const matchesCategory = activeCategory === 'All' || phone.category === activeCategory;
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [allPhones, searchQuery, activeBrand, activeCategory]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(allPhones.map(p => p.category))).sort()], [allPhones]);

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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Manager Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
            <input 
              type="email" 
              placeholder="manager@skmobile.in" 
              required 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
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
          <button 
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-5 bg-[#B20D0D] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 touch-manipulation"
          >
            {isAuthenticating ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/50 rounded-full border border-white shadow-sm">
        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-orange-400 animate-pulse'}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {connectionStatus === 'online' ? 'Server Connected' : connectionStatus === 'checking' ? 'Connecting to Server...' : 'Connection Error'}
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
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Pricing Access</p>
            </div>
            <button onClick={() => {localStorage.clear(); setIsLoggedIn(false);}} className="p-2 bg-slate-100 rounded-lg text-slate-400 active:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </header>
        
        <div className="px-6 pb-3 max-w-7xl mx-auto space-y-3">
          <input 
            type="text" 
            placeholder="Search by model or brand..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-red-500/20 font-bold text-sm text-black appearance-none"
          />
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => {setActiveCategory(cat); setActiveBrand('All');}}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
        {filteredPhones.map(phone => <PriceCard key={phone.id} phone={phone} />)}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass border border-slate-200 shadow-2xl rounded-[2rem] p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 px-3">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-orange-400 animate-pulse'}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-800 leading-none uppercase">
              {connectionStatus === 'online' ? 'Live Data' : 'Offline'}
            </p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">Synced: {lastSynced || 'Never'}</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
          {loading ? '...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default App;
