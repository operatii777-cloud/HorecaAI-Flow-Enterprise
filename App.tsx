
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage'; // Import Landing Page
// ... existing imports ...
import { POS } from './components/POS';
import { Operations } from './components/Operations';
import { Expeditor } from './components/Expeditor';
import { Catalog } from './components/Catalog';
import { Recipes } from './components/Recipes';
import { Reports } from './components/Reports';
import { Inventory } from './components/Inventory';
import { ClientView } from './components/ClientView';
import { InternalChat } from './components/InternalChat';
import { Reservations } from './components/Reservations';
import { Hostess } from './components/Hostess';
import { Settings } from './components/Settings';
import { Marketing } from './components/Marketing';
import { Audit } from './components/Audit';
import { Dashboard } from './components/Dashboard';
import { QueueMonitor } from './components/QueueMonitor';
import { Invoices } from './components/Invoices';
import { DeliveryManager } from './components/DeliveryManager';
import { Archive } from './components/Archive';
import { CRM } from './components/CRM';
import { Financials } from './components/Financials';
import { Compliance } from './components/Compliance';
import { Notifications } from './components/Notifications';
import { Help } from './components/Help';
import { DriverView } from './components/DriverView';
import { GlobalSearch } from './components/GlobalSearch';
import { ShiftHandover } from './components/ShiftHandover';
import { MenuBoard } from './components/MenuBoard';
import { Events } from './components/Events';
import { Headquarters } from './components/Headquarters';
import { Scoreboard } from './components/Scoreboard';
import { GiftCards } from './components/GiftCards';
import { Laundry } from './components/Laundry';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomerDisplay } from './components/CustomerDisplay';
import { PublicReservation } from './components/PublicReservation';
import { SelfServiceKiosk } from './components/SelfServiceKiosk';
import { FeedbackKiosk } from './components/FeedbackKiosk';
import { Maintenance } from './components/Maintenance';
import { StaffTraining } from './components/StaffTraining';
import { SetupWizard } from './components/SetupWizard';
import { LossPrevention } from './components/LossPrevention';
import { NetworkHealth } from './components/NetworkHealth';
import { CoatCheck } from './components/CoatCheck';
import { LostFound } from './components/LostFound';
import { Table, MenuItem, Order, OrderItem, OrderStatus, PaymentMethod, User, Role, Ingredient } from './types';
import { ApiService } from './services/api';
import { socketService } from './services/socket';
import { X, CheckCircle, AlertCircle, Info, Menu, Keyboard, Lock, Megaphone, GraduationCap, Loader2 } from 'lucide-react';

// ... (Keep Toast and LockScreen components as they are) ...

// Toast Component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`fixed bottom-6 right-6 ${bgColors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-right duration-300`}>
      {icons[type]}
      <span className="font-bold">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-full"><X size={16}/></button>
    </div>
  );
};

const LockScreen: React.FC<{ onUnlock: (pin: string) => void, error: string }> = ({ onUnlock, error }) => {
    const [pin, setPin] = useState('');
    const handleNumClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };
    useEffect(() => {
        if (pin.length === 4) {
            onUnlock(pin);
            setPin('');
        }
    }, [pin, onUnlock]);

    return (
        <div className="fixed inset-0 bg-slate-900 z-[200] flex items-center justify-center backdrop-blur-md">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
                <div className="mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <Lock className="text-white" size={32}/>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Terminal Blocat</h2>
                    <p className="text-slate-500">Introdu PIN-ul pentru a continua</p>
                </div>
                <div className="flex justify-center gap-4 mb-6">
                    {[0,1,2,3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-slate-800 border-slate-800' : 'bg-transparent border-slate-300'}`}></div>
                    ))}
                </div>
                {error && <p className="text-red-500 font-bold mb-4">{error}</p>}
                <div className="grid grid-cols-3 gap-4">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handleNumClick(n.toString())} className="h-16 rounded-xl bg-slate-100 text-xl font-bold hover:bg-slate-200">{n}</button>
                    ))}
                    <button onClick={() => setPin('')} className="h-16 rounded-xl text-red-500 font-bold hover:bg-red-50">C</button>
                    <button onClick={() => handleNumClick('0')} className="h-16 rounded-xl bg-slate-100 text-xl font-bold hover:bg-slate-200">0</button>
                </div>
            </div>
        </div>
    );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('pos');
  const [navParams, setNavParams] = useState<any>(null);
  
  // Add Landing Page State
  const [showLanding, setShowLanding] = useState(!window.location.search.includes('mode=client')); 

  // ... (Keep existing state definitions) ...
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientTableId, setClientTableId] = useState<number>(7);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [showBroadcastInput, setShowBroadcastInput] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
  }, []);

  useEffect(() => {
      const initSystem = async () => {
          try {
              // ... (Fetch Logic same as before) ...
              const [fetchedSettings, fetchedMenu, fetchedTables, fetchedOrders, fetchedUsers, fetchedIngredients] = await Promise.all([
                  ApiService.getSettings(),
                  ApiService.getMenu(),
                  ApiService.getTables(),
                  ApiService.getOrders(),
                  ApiService.getUsers(),
                  ApiService.getInventory()
              ]);

              if (!fetchedSettings.setupCompleted) setNeedsSetup(true);
              setIsTraining(!!fetchedSettings.trainingMode);
              setIsMaintenance(!!fetchedSettings.maintenanceMode);
              
              setMenuItems(fetchedMenu);
              setTables(fetchedTables);
              setOrders(fetchedOrders);
              setUsers(fetchedUsers);
              setIngredients(fetchedIngredients);

              const socket = socketService.connect();
              
              socket.on('new_order', (order: Order) => {
                  setOrders(prev => [...prev, order]);
                  notify(`Comanda noua: #${order.id.slice(-4)}`, 'info');
              });

              socket.on('order_update', (updatedOrder: Order) => {
                  setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
              });

              const params = new URLSearchParams(window.location.search);
              const modeParam = params.get('mode');
              const tableParam = params.get('table');

              if (modeParam === 'client' && tableParam) {
                  setShowLanding(false); // Skip landing for direct QR
                  setClientTableId(Number(tableParam));
                  setUser({ id: 'guest', name: 'Guest', pin: '', role: Role.WAITER, active: true });
                  setActiveTab('client');
              }

              setLoading(false);
          } catch (e) {
              console.error("Initialization failed", e);
              // Don't notify error on landing page to avoid scaring visitors if backend is sleeping
              setLoading(false);
          }
      };

      initSystem();

      return () => {
          socketService.disconnect();
      };
  }, [notify]);

  // ... (Keep existing effects and handlers) ...
  useEffect(() => {
      if (orders.length === 0 && tables.length === 0) return;

      const occupiedTableIds = new Set(
          orders
              .filter(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED && o.type !== 'delivery')
              .map(o => o.tableId)
      );

      setTables(prev => {
          const hasChanges = prev.some(t => t.occupied !== occupiedTableIds.has(t.id));
          if (!hasChanges) return prev;
          
          return prev.map(t => ({
              ...t,
              occupied: occupiedTableIds.has(t.id)
          }));
      });

      const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
      setBadges(prev => ({ ...prev, operations: pendingCount }));

  }, [orders]);

  const handleNavigate = (tab: string, params?: any) => {
      setActiveTab(tab);
      setNavParams(params);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLocked(false);
    setShowLanding(false); // Hide landing on login
    if (loggedInUser.role === Role.WAITER) setActiveTab('pos');
    else if (loggedInUser.role === Role.CHEF) setActiveTab('operations');
    else if (loggedInUser.role === Role.MANAGER) setActiveTab('dashboard');
    else if (loggedInUser.role === Role.DRIVER) setActiveTab('driver');
    else setActiveTab('dashboard');
    notify(`Bine ai venit, ${loggedInUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLocked(false);
    setShowLanding(true); // Return to landing on logout
    notify('Te-ai delogat cu succes.', 'info');
  };

  // ... (Keep all other handlers: handlePlaceOrder, handleUpdateOrderStatus, etc.) ...
  const handlePlaceOrder = async (tableId: number, items: OrderItem[]) => {
      const total = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const waiterId = user && user.id !== 'guest' ? user.id : 'u1';
      
      const orderData = {
          tableId,
          type: 'dine_in',
          clientId: 'client-123',
          waiterId,
          items,
          total
      };

      try {
          await ApiService.placeOrder(orderData);
          notify('Comanda trimisa!');
      } catch(e) {
          notify('Eroare la trimiterea comenzii.', 'error');
      }
  };

  const handlePlaceDeliveryOrder = async (customerInfo: {name: string, phone: string, address: string}, items: OrderItem[]) => {
      const total = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const waiterId = user && user.id !== 'guest' ? user.id : 'u1';
      
      const orderData = {
          tableId: 0,
          type: 'delivery',
          deliveryInfo: customerInfo,
          waiterId,
          items,
          total
      };

      try {
          await ApiService.placeOrder(orderData);
          notify('Comanda livrare inregistrata!');
      } catch(e) { notify('Eroare la livrare.', 'error'); }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
      try {
          await ApiService.updateOrderStatus(orderId, status);
          notify(`Status actualizat: ${status}`);
      } catch(e) { notify('Eroare update status.', 'error'); }
  };

  const handlePayOrder = async (orderId: string, method: PaymentMethod, tip: number, amount?: number) => {
      await handleUpdateOrderStatus(orderId, OrderStatus.PAID);
  };

  const handleAssignDriver = (orderId: string, driverId: string) => {
      notify('Sofer alocat (Simulare)');
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
              <Loader2 size={64} className="animate-spin text-emerald-500 mb-4"/>
              <h2 className="text-2xl font-bold">Se incarca HorecaAI...</h2>
              <p className="text-slate-400">Initializare conexiune server...</p>
          </div>
      );
  }

  if (needsSetup) return <SetupWizard onComplete={() => window.location.reload()}/>;

  // Main Render Logic
  if (showLanding && !user) {
      return <LandingPage onLoginClick={() => setShowLanding(false)} />;
  }

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} />;

    if (isMaintenance && user.role !== Role.ADMIN) {
        return <Maintenance />;
    }

    switch (activeTab) {
      case 'pos': return <POS tables={tables} menuItems={menuItems} activeOrders={orders} onPlaceOrder={handlePlaceOrder} onPlaceDeliveryOrder={handlePlaceDeliveryOrder} onPayOrder={handlePayOrder} ingredients={ingredients} notify={notify} user={user} />;
      case 'operations': return <Operations orders={orders} onUpdateStatus={handleUpdateOrderStatus} notify={notify} menuItems={menuItems}/>;
      case 'scoreboard': return <Scoreboard />;
      case 'expeditor': return <Expeditor orders={orders} onUpdateStatus={handleUpdateOrderStatus}/>;
      case 'delivery': return <DeliveryManager orders={orders} users={users} onUpdateStatus={handleUpdateOrderStatus} onAssignDriver={handleAssignDriver}/>;
      case 'driver': if(user) return <DriverView user={user} orders={orders} onUpdateStatus={handleUpdateOrderStatus}/>; return <div>User not found</div>;
      case 'catalog': return <Catalog menuItems={menuItems} onAddMenuItem={() => window.location.reload()} onUpdateMenuItem={() => window.location.reload()}/>;
      case 'recipes': return <Recipes menuItems={menuItems} onUpdateRecipe={() => window.location.reload()}/>;
      case 'inventory': case 'suppliers': return <Inventory notify={notify} />;
      case 'laundry': return <Laundry />;
      case 'coatcheck': return <CoatCheck />;
      case 'lostfound': return <LostFound />;
      case 'reservations': return <Reservations />;
      case 'hostess': return <Hostess />;
      case 'events': return <Events />;
      case 'settings': return <Settings tables={tables} />;
      case 'hq': return <Headquarters />;
      case 'marketing': return <Marketing />;
      case 'training': return <StaffTraining />;
      case 'audit': return <Audit />;
      case 'archive': return <Archive initialOrderId={navParams?.itemId} />;
      case 'crm': return <CRM initialClientId={navParams?.itemId} />;
      case 'financials': return <Financials />;
      case 'giftcards': return <GiftCards />;
      case 'compliance': return <Compliance />;
      case 'notifications': return <Notifications onNavigate={handleNavigate} />;
      case 'client': return <ClientView menuItems={menuItems} onPlaceOrder={handlePlaceOrder} orders={orders} onPayOrder={handlePayOrder} tableId={clientTableId} />;
      case 'kiosk': return <SelfServiceKiosk />;
      case 'feedback_kiosk': return <FeedbackKiosk />;
      case 'menuboard': return <MenuBoard />;
      case 'cds': return <CustomerDisplay />;
      case 'widget': return <PublicReservation />;
      case 'chat': return <InternalChat />;
      case 'reports': return <Reports orders={orders} />;
      case 'queue': return <QueueMonitor orders={orders} />;
      case 'invoices': return <Invoices />;
      case 'logbook': return <ShiftHandover />;
      case 'help': return <Help />;
      case 'security': return <LossPrevention />;
      case 'network': return <NetworkHealth />;
      default: return <Dashboard orders={orders} />;
    }
  };

  const isDisplayMode = activeTab === 'driver' || activeTab === 'menuboard' || activeTab === 'scoreboard' || activeTab === 'cds' || activeTab === 'widget' || activeTab === 'client' || activeTab === 'kiosk' || activeTab === 'feedback_kiosk';

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden relative">
      {isLocked && <LockScreen onUnlock={(pin) => user?.pin === pin ? setIsLocked(false) : setLockError('PIN Invalid')} error={lockError} />}
      {isTraining && (
          <div className="fixed top-0 left-0 right-0 h-6 bg-amber-400 text-black font-black text-center text-xs uppercase tracking-[0.2em] flex items-center justify-center z-[200] pointer-events-none">
              <GraduationCap size={14} className="mr-2"/> TRAINING MODE
          </div>
      )}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={handleNavigate} />
      {!isDisplayMode && user && (
          <button className="md:hidden fixed top-4 left-4 z-[60] bg-slate-900 text-white p-2 rounded-full shadow-lg" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
      )}
      {!isDisplayMode && user && (
          <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} badges={badges} onBroadcast={() => setShowBroadcastInput(true)} />
          </div>
      )}
      {isSidebarOpen && !isDisplayMode && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <main className={`flex-1 overflow-hidden h-full ${!isDisplayMode && user ? 'pt-16 md:pt-0' : ''} ${isTraining ? 'mt-6' : ''} relative`}>
        <ErrorBoundary>{renderContent()}</ErrorBoundary>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
