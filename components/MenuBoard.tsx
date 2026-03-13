
import React, { useState, useEffect } from 'react';
import { MenuItem, Promotion, ProductCategory, MenuBoardConfig, MenuSchedule } from '../types';
import { ApiService } from '../services/api';
import { Sparkles, Flame, Clock } from 'lucide-react';

export const MenuBoard: React.FC = () => {
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState<MenuBoardConfig | undefined>(undefined);
  const [activeSchedule, setActiveSchedule] = useState<MenuSchedule | null>(null);
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [schedules, setSchedules] = useState<MenuSchedule[]>([]);

  useEffect(() => {
    const load = async () => {
        const [settings, m, p, sch] = await Promise.all([
            ApiService.getSettings(),
            ApiService.getMenu(),
            ApiService.getPromotions(),
            ApiService.getMenuSchedules()
        ]);
        setConfig(settings.menuBoard);
        setAllMenu(m.filter(i => i.active));
        setPromos(p.filter(pr => pr.active));
        setSchedules(sch);
    };
    load();
  }, []);

  useEffect(() => {
    const updateMenuBasedOnTime = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2,'0')}:${currentMinute.toString().padStart(2,'0')}`;
        
        let categoriesToShow = config?.visibleCategories || Object.values(ProductCategory);
        let foundSchedule = null;

        if (config?.useSchedule) {
            foundSchedule = schedules.find(s => {
                return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
            });
            if (foundSchedule) {
                categoriesToShow = foundSchedule.categories;
            }
        }
        
        setActiveSchedule(foundSchedule || null);
        setMenuItems(allMenu.filter(i => categoriesToShow.includes(i.category)));
    };

    updateMenuBasedOnTime();
    
    // Clock & Schedule Check
    const timer = setInterval(() => {
        setTime(new Date());
        updateMenuBasedOnTime();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [config, allMenu, schedules]);

  // Determine active categories dynamically
  const availableCategories = Array.from(new Set(menuItems.map(i => i.category)));

  // Carousel Rotation
  useEffect(() => {
      if(availableCategories.length === 0) return;
      const interval = setInterval(() => {
          setActiveCategoryIdx(prev => (prev + 1) % availableCategories.length);
      }, (config?.rotationSeconds || 10) * 1000);
      return () => clearInterval(interval);
  }, [availableCategories.length, config?.rotationSeconds]);

  const currentCategory = availableCategories[activeCategoryIdx];
  const itemsToShow = menuItems.filter(i => i.category === currentCategory);
  
  const activePromo = promos.find(p => {
      const nowH = new Date().getHours();
      return (p.startHour === undefined || nowH >= p.startHour) && (p.endHour === undefined || nowH < p.endHour);
  });

  const getThemeColors = () => {
      if (config?.theme === 'light') return { bg: 'bg-slate-50', text: 'text-slate-900', card: 'bg-white border-slate-200', highlight: 'text-amber-600', sidebar: 'bg-white border-r border-slate-200' };
      if (config?.theme === 'midnight') return { bg: 'bg-indigo-950', text: 'text-white', card: 'bg-indigo-900/50 border-indigo-800', highlight: 'text-pink-400', sidebar: 'bg-indigo-900 border-r border-indigo-800' };
      return { bg: 'bg-slate-950', text: 'text-white', card: 'bg-slate-900/80 border-slate-800', highlight: 'text-amber-500', sidebar: 'bg-slate-900 border-r border-slate-800' };
  };

  const theme = getThemeColors();

  return (
    <div className={`h-screen w-full ${theme.bg} ${theme.text} overflow-hidden flex flex-col relative font-sans transition-colors duration-500`}>
        {/* Header */}
        <div className={`p-8 flex justify-between items-center backdrop-blur-md border-b z-10 ${config?.theme === 'light' ? 'bg-white/50 border-slate-200' : 'bg-slate-900/50 border-white/10'}`}>
            <div>
                <h1 className={`text-4xl font-black tracking-widest uppercase ${theme.highlight}`}>HorecaAI Bistro</h1>
                {activeSchedule ? (
                    <p className="opacity-80 text-lg tracking-wide uppercase font-bold flex items-center gap-2">
                        <Clock size={20}/> {activeSchedule.name} Menu
                    </p>
                ) : (
                    <p className="opacity-60 text-lg tracking-wide uppercase">Taste the Future</p>
                )}
            </div>
            <div className="text-right">
                <div className="text-5xl font-mono font-bold">{time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                <div className="opacity-60 uppercase font-bold">{time.toLocaleDateString()}</div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex relative">
            {/* Sidebar Categories */}
            <div className={`w-64 flex flex-col justify-center gap-2 p-4 z-10 ${theme.sidebar}`}>
                {availableCategories.map((cat, idx) => (
                    <div 
                        key={cat}
                        className={`p-4 rounded-xl text-xl font-bold uppercase transition-all duration-500 flex items-center justify-between ${
                            idx === activeCategoryIdx 
                            ? `bg-gradient-to-r ${config?.theme === 'midnight' ? 'from-pink-600 to-purple-600 text-white' : config?.theme === 'light' ? 'from-amber-500 to-orange-500 text-white' : 'from-amber-500 to-orange-600 text-slate-900'} scale-105 shadow-lg` 
                            : 'opacity-50'
                        }`}
                    >
                        {cat}
                        {idx === activeCategoryIdx && <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 p-12 grid grid-cols-3 gap-8 content-start relative z-10 overflow-hidden">
                {/* Interstitial Promo Banner */}
                {config?.promoImageUrl && itemsToShow.length > 0 && Math.random() > 0.8 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in zoom-in duration-500">
                        <img src={config.promoImageUrl} className="max-w-[80%] max-h-[80%] rounded-3xl shadow-2xl border-4 border-white" alt="Promo"/>
                    </div>
                )}

                {itemsToShow.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center h-full opacity-50">
                        <Flame size={120}/>
                        <h2 className="text-4xl font-bold mt-4">Coming Soon</h2>
                    </div>
                ) : (
                    itemsToShow.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className={`${theme.card} border rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-700 slide-in-from-bottom-10`}
                            style={{animationDelay: `${idx * 100}ms`}}
                        >
                            <div className="h-64 relative overflow-hidden bg-black/10">
                                {item.image ? (
                                    <img src={item.image} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-[10s]" alt={item.name}/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-30"><Sparkles size={48}/></div>
                                )}
                                {item.isVegetarian && (
                                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full font-bold text-xs uppercase shadow-lg">Veg</div>
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 leading-tight">{item.name}</h3>
                                    <p className="opacity-60 text-sm line-clamp-2">{item.description}</p>
                                </div>
                                <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/10">
                                    <div className={`${theme.highlight} font-bold text-4xl`}>{item.price} <span className="text-lg opacity-60">RON</span></div>
                                    {item.calories && <div className="opacity-60 text-xs font-bold">{item.calories} kcal</div>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Background Ambient */}
            {config?.theme === 'midnight' ? (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] -z-10 animate-pulse"></div>
                </>
            ) : config?.theme === 'light' ? (
                <div className="absolute inset-0 bg-slate-50 -z-10"></div>
            ) : (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -z-10"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                </>
            )}
        </div>

        {/* Promo Ticker */}
        {config?.showPromo && activePromo ? (
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 shadow-[0_-10px_40px_rgba(220,38,38,0.5)] z-20 relative overflow-hidden text-white">
                <div className="flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-widest animate-pulse">
                    <Clock size={32} className="animate-spin-slow"/>
                    {activePromo.name}: -{activePromo.discountPercent}% la toate produsele!
                    <span className="text-sm bg-white text-red-600 px-2 py-1 rounded ml-4 font-bold">Pana la {activePromo.endHour}:00</span>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            </div>
        ) : config?.tickerMessage ? (
            <div className={`${config.theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-slate-500'} border-t border-white/10 p-3 text-center text-sm font-bold uppercase tracking-widest`}>
                {config.tickerMessage}
            </div>
        ) : null}
    </div>
  );
};
