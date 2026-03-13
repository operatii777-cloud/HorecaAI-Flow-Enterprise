
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, ChefHat, BarChart3, Settings, 
  PackageOpen, Smartphone, MessageSquare, CalendarDays, 
  Truck, ScrollText, Layers, Tag, ShieldCheck, MonitorPlay, FileText, LogOut, Clock, Bike, Archive, Users, Landmark, ClipboardCheck, HelpCircle, Bell, Book, Tv, Megaphone, PartyPopper, Coffee, Globe, Trophy, Gift, Shirt, ExternalLink, Monitor, RefreshCw, Check, MousePointerClick, Smile, CalendarClock, GraduationCap, X, ShieldAlert, Activity, ChevronDown, ChevronRight, Briefcase, Search
} from 'lucide-react';
import { User, Role, OrderStatus } from '../types';
import { ApiService } from '../services/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  badges?: Record<string, number>;
  user: User | null;
  onLogout: () => void;
  onClockIn?: () => void;
  onClockOut?: () => void;
  onBroadcast?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, badges = {}, user, onLogout, onClockIn, onClockOut, onBroadcast }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
      'Operational': true,
      'Gestiune': true,
      'Administrare': true,
      'IT & Securitate': false,
      'Display': false,
      'Front Desk': true,
      'Suport': true
  });
  
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [shiftStats, setShiftStats] = useState({ sales: 0, tips: 0, hours: 0 });

  useEffect(() => {
      const handleStatus = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', handleStatus);
      window.addEventListener('offline', handleStatus);
      
      const handleSave = () => {
          setSaveStatus('saving');
          setTimeout(() => setSaveStatus('saved'), 800);
      };
      window.addEventListener('db-change', handleSave);

      return () => {
          window.removeEventListener('online', handleStatus);
          window.removeEventListener('offline', handleStatus);
          window.removeEventListener('db-change', handleSave);
      };
  }, [user]);

  const toggleGroup = (title: string) => {
      setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleBreakToggle = () => {
      setIsOnBreak(!isOnBreak);
      alert(isOnBreak ? 'Bine ai revenit din pauza!' : 'Ai intrat in pauza.');
  };

  const handleClockOutRequest = async () => {
      if(user?.currentShiftId) {
          const allOrders = await ApiService.getOrders();
          const archived = await ApiService.getArchivedOrders();
          const combined = [...allOrders, ...archived];
          
          const myOrders = combined.filter(o => o.waiterId === user.id && o.status === OrderStatus.PAID);
          
          const mySales = myOrders.reduce((acc, o) => acc + o.total, 0);
          const myTips = myOrders.reduce((acc, o) => acc + (o.tip || 0), 0);
          
          const duration = 8; // Mock, backend handles real logic

          setShiftStats({ sales: mySales, tips: myTips, hours: duration });
          setShowShiftSummary(true);
      } else {
          onClockOut && onClockOut();
      }
  };

  const confirmClockOut = () => {
      onClockOut && onClockOut();
      setShowShiftSummary(false);
  };

  const menuGroups = [
    {
      title: "Operational",
      items: [
        { id: 'pos', label: 'POS Vanzare', icon: LayoutGrid, allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER, Role.BARTENDER] },
        { id: 'operations', label: 'KDS & Bar', icon: ChefHat, badgeId: 'operations', allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.BARTENDER] },
        { id: 'scoreboard', label: 'Scoreboard Bucatarie', icon: Trophy, allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF] },
        { id: 'expeditor', label: 'Expeditie (Pass)', icon: Megaphone, allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF] },
        { id: 'delivery', label: 'Dispecerat Livrari', icon: Bike, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'driver', label: 'Mod Curier', icon: Bike, allowed: [Role.DRIVER, Role.ADMIN] },
      ]
    },
    {
      title: "Front Desk",
      items: [
        { id: 'reservations', label: 'Rezervari', icon: CalendarDays, allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER] },
        { id: 'hostess', label: 'Hostess Map', icon: CalendarClock, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'coatcheck', label: 'Garderoba & Valet', icon: Briefcase, allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER] },
        { id: 'lostfound', label: 'Lost & Found', icon: Search, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'events', label: 'Evenimente (BEO)', icon: PartyPopper, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'queue', label: 'Monitor Clienti', icon: MonitorPlay, allowed: [Role.ADMIN, Role.MANAGER] },
      ]
    },
    {
      title: "Gestiune",
      items: [
        { id: 'catalog', label: 'Catalog Produse', icon: Layers, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'recipes', label: 'Retetar & Fise', icon: ScrollText, allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF] },
        { id: 'inventory', label: 'Stocuri & NIR', icon: PackageOpen, badgeId: 'inventory', allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF] },
        { id: 'laundry', label: 'Gestiune Textile', icon: Shirt, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'suppliers', label: 'Furnizori', icon: Truck, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'invoices', label: 'Facturare B2B', icon: FileText, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'compliance', label: 'HACCP & Igenizare', icon: ClipboardCheck, allowed: [Role.ADMIN, Role.MANAGER, Role.CHEF] },
      ]
    },
    {
      title: "Administrare",
      items: [
        { id: 'hq', label: 'HQ Dashboard', icon: Globe, allowed: [Role.ADMIN] }, 
        { id: 'reports', label: 'Rapoarte Z/X', icon: BarChart3, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'financials', label: 'Financiar & P&L', icon: Landmark, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'giftcards', label: 'Gift Cards', icon: Gift, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'logbook', label: 'Jurnal Tura', icon: Book, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'archive', label: 'Arhiva', icon: Archive, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'crm', label: 'Clienti / CRM', icon: Users, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'marketing', label: 'Marketing & Promo', icon: Tag, allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'training', label: 'Staff Academy', icon: GraduationCap, allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER, Role.CHEF] },
        { id: 'settings', label: 'Setari & Staff', icon: Settings, allowed: [Role.ADMIN] },
        { id: 'notifications', label: 'Centru Alerte', icon: Bell, badgeId: 'alerts', allowed: [Role.ADMIN, Role.MANAGER] },
        { id: 'chat', label: 'Comunicare', icon: MessageSquare, badgeId: 'chat', allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER, Role.CHEF, Role.BARTENDER] },
      ]
    },
    {
      title: "IT & Securitate",
      items: [
         { id: 'security', label: 'Loss Prevention', icon: ShieldAlert, allowed: [Role.ADMIN] },
         { id: 'network', label: 'Network Health', icon: Activity, allowed: [Role.ADMIN] },
         { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, allowed: [Role.ADMIN] },
      ]
    },
    {
      title: "Display",
      items: [
         { id: 'kiosk', label: 'Self-Service Kiosk', icon: MousePointerClick, allowed: [Role.ADMIN, Role.MANAGER] },
         { id: 'feedback_kiosk', label: 'Feedback Terminal', icon: Smile, allowed: [Role.ADMIN, Role.MANAGER] },
         { id: 'client', label: 'Meniu QR (Mobile)', icon: Smartphone, allowed: [Role.ADMIN, Role.MANAGER] },
         { id: 'cds', label: 'Display Client (CDS)', icon: Monitor, allowed: [Role.ADMIN, Role.MANAGER] },
         { id: 'menuboard', label: 'TV Meniu Digital', icon: Tv, allowed: [Role.ADMIN, Role.MANAGER] },
         { id: 'widget', label: 'Widget Site', icon: ExternalLink, allowed: [Role.ADMIN, Role.MANAGER] }, 
      ]
    },
    {
      title: "Suport",
      items: [
         { id: 'help', label: 'Manual Utilizare', icon: HelpCircle, allowed: [Role.ADMIN, Role.MANAGER, Role.WAITER, Role.CHEF, Role.BARTENDER] },
      ]
    }
  ];

  return (
    <div className="w-full bg-slate-900 text-white flex flex-col h-full shadow-xl overflow-hidden no-print sidebar border-r border-slate-800 relative">
      <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-center md:justify-start">
        <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            HorecaAI
            </h1>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Enterprise</p>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => !user || item.allowed.includes(user.role));
          if (visibleItems.length === 0) return null;
          const isExpanded = expandedGroups[group.title];

          return (
            <div key={idx} className="mb-2">
              <button 
                onClick={() => toggleGroup(group.title)}
                className="w-full px-4 py-2 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
              >
                  {group.title}
                  {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              </button>
              
              {isExpanded && (
                  <div className="space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const badgeCount = item.badgeId ? badges[item.badgeId] : 0;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative ${
                            isActive 
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="font-medium text-sm">{item.label}</span>
                          {badgeCount > 0 ? (
                            <span className="absolute right-2 top-2.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                              {badgeCount}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-2 pt-2 border-t border-slate-800">
         {user?.role === Role.ADMIN && (
             <button 
                onClick={onBroadcast}
                className="w-full mb-2 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900 text-xs font-bold rounded flex items-center justify-center gap-2"
             >
                 <Megaphone size={14}/> SYSTEM BROADCAST
             </button>
         )}

         {user?.currentShiftId ? (
             <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3">
                 <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase mb-2">
                     <Clock size={12} className="animate-pulse"/> Tura Activa
                 </div>
                 <div className="flex gap-2 mb-2">
                     <button 
                        onClick={handleBreakToggle}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors border flex items-center justify-center gap-1 ${isOnBreak ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-800 text-orange-400 border-slate-700 hover:bg-slate-700'}`}
                     >
                         <Coffee size={12}/> {isOnBreak ? 'In Pauza' : 'Pauza'}
                     </button>
                 </div>
                 <button 
                    onClick={handleClockOutRequest}
                    className="w-full py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900 text-xs font-bold rounded transition-colors"
                 >
                     Incheie Tura
                 </button>
             </div>
         ) : (
             <button 
                onClick={onClockIn}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
             >
                 <Clock size={14}/> Start Pontaj
             </button>
         )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-2 text-xs font-bold ${saveStatus === 'saving' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {saveStatus === 'saving' ? (
                    <RefreshCw size={14} className="animate-spin"/>
                ) : (
                    <Check size={14}/>
                )}
                {saveStatus === 'saving' ? 'Saving...' : 'Cloud Synced'}
            </div>
            {isOnline && <span className="text-[10px] text-slate-600 font-mono">v4.1.0</span>}
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.slice(0, 2) || 'GU'}
            </div>
            <div className="text-xs">
                <p className="font-bold text-white line-clamp-1">{user?.name || 'Guest'}</p>
                <p className="text-slate-500 uppercase">{user?.role || 'Viewer'}</p>
            </div>
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
                <LogOut size={16} />
            </button>
        </div>
      </div>

      {showShiftSummary && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in zoom-in">
              <div className="bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-700 text-white">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="text-emerald-500"/> Sumar Tura</h3>
                      <button onClick={() => setShowShiftSummary(false)} className="p-1 hover:bg-slate-800 rounded-full"><X size={18}/></button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                          <span className="text-slate-400 font-bold text-sm">Ore Lucrate</span>
                          <span className="font-mono font-bold text-lg">{shiftStats.hours.toFixed(2)}h</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                          <span className="text-slate-400 font-bold text-sm">Vanzari Personale</span>
                          <span className="font-mono font-bold text-lg text-emerald-400">{shiftStats.sales.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                          <span className="text-slate-400 font-bold text-sm">Bacsis (Card)</span>
                          <span className="font-mono font-bold text-lg text-amber-400">{shiftStats.tips.toFixed(2)} RON</span>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setShowShiftSummary(false)} className="flex-1 py-3 border border-slate-600 rounded-xl font-bold text-slate-400 hover:bg-slate-800">Anuleaza</button>
                      <button onClick={confirmClockOut} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Confirma Iesire</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
