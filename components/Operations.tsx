
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Department, ProductCategory, OrderItem, ModifierOption, MenuItem, KitchenStation } from '../types';
import { Clock, CheckCircle, Flame, BellRing, Beer, ChefHat, User, Printer, Layers, List, ClipboardList, Info, X, PauseCircle, Moon, Sun, ShoppingBag, RotateCcw, History, Filter, Volume2, VolumeX, CheckSquare, Square, Scale, ArrowRight, Keyboard, Sigma } from 'lucide-react';
import { ApiService } from '../services/api';

interface OperationsProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  menuItems?: MenuItem[];
}

export const Operations: React.FC<OperationsProps> = ({ orders, onUpdateStatus, notify, menuItems = [] }) => {
  const [view, setView] = useState<Department>(Department.KITCHEN);
  const [mode, setMode] = useState<'orders' | 'items' | 'prep' | 'history' | 'allday'>('orders');
  const [prepList, setPrepList] = useState<{name: string, projected: number, productId?: string}[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stationFilter, setStationFilter] = useState<KitchenStation | 'All'>('All');
  
  const filteredOrders = orders.filter(o => {
    if (o.status === OrderStatus.PAID || o.status === OrderStatus.CANCELLED) return false;
    
    let hasDeptItems = false;
    if (view === Department.KITCHEN) {
        hasDeptItems = o.items.some(i => i.category === ProductCategory.FOOD || i.category === ProductCategory.DESSERT) && o.status !== OrderStatus.READY_FOOD;
    } else if (view === Department.BAR) {
        hasDeptItems = o.items.some(i => i.category === ProductCategory.DRINKS || i.category === ProductCategory.ALCOHOL || i.category === ProductCategory.COFFEE) && o.status !== OrderStatus.READY_BAR;
    } else {
        return o.status === OrderStatus.READY_FOOD || o.status === OrderStatus.READY_BAR || o.status === OrderStatus.SERVED;
    }

    if (!hasDeptItems) return false;

    if (stationFilter !== 'All' && view === Department.KITCHEN) {
        const hasStationItems = o.items.some(item => item.station === stationFilter);
        if (!hasStationItems) return false;
    }

    return true;
  });

  useEffect(() => {
      if(mode === 'prep') {
          const fetchPrepData = async () => {
              const reservations = await ApiService.getReservations();
              const totalGuests = reservations
                .filter(r => r.date === new Date().toISOString().split('T')[0])
                .reduce((acc, r) => acc + r.guests, 0);
              
              const menu = await ApiService.getMenu();
              const findId = (name: string) => menu.find(m => m.name.includes(name))?.id;

              setPrepList([
                  { name: 'Burger Patties (Vita)', projected: Math.ceil(totalGuests * 0.45) + 5, productId: findId('Burger') },
                  { name: 'Portii Paste (Trufe)', projected: Math.ceil(totalGuests * 0.3) + 3, productId: findId('Paste') },
              ]);
          };
          fetchPrepData();
      }
  }, [mode]);

  const handleItemClick = async (orderId: string, itemId: string, currentStatus?: string) => {
      if(currentStatus === 'ready' || currentStatus === 'served') return; 
      await ApiService.updateOrderItemStatus(orderId, itemId, 'ready');
      notify("Articol marcat GATA!", 'success');
  };

  const handleExecutePrep = async (item: any, qty: number) => {
      if(!item.productId) return;
      try {
          await ApiService.processBatchProduction(item.productId, qty);
          notify(`Productie finalizata: ${qty}x ${item.name}`, 'success');
      } catch (e) {
          notify("Eroare la productie.", 'error');
      }
  };

  return (
    <div className={`h-full flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`border-b px-6 py-4 flex items-center justify-between no-print ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
         <div className="flex gap-4 items-center">
             <div className={`flex gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                 <button onClick={() => setView(Department.KITCHEN)} className={`px-4 py-2 rounded-md text-sm font-bold ${view === Department.KITCHEN ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>KDS Bucatarie</button>
                 <button onClick={() => setView(Department.BAR)} className={`px-4 py-2 rounded-md text-sm font-bold ${view === Department.BAR ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>KDS Bar</button>
             </div>
         </div>
         <div className="flex items-center gap-4">
             <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 {filteredOrders.length} Comenzi Active
             </div>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
                 {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
         </div>
      </div>

      <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`rounded-xl shadow-sm border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-100">
                    <span className="font-bold text-lg text-slate-800">
                        {order.tableId > 0 ? `Masa ${order.tableId}` : 'Delivery'}
                    </span>
                    <span className="text-xs font-mono">{new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="p-4 flex-1 space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span className={`${item.itemStatus === 'ready' ? 'line-through text-emerald-600' : 'text-slate-700'}`}>
                                {item.quantity}x {item.name}
                            </span>
                            <button onClick={() => handleItemClick(order.id, item.id, item.itemStatus)} className="text-slate-400 hover:text-emerald-500">
                                {item.itemStatus === 'ready' ? <CheckCircle size={16}/> : <Square size={16}/>}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t bg-slate-50">
                    <button 
                        onClick={() => onUpdateStatus(order.id, view === Department.KITCHEN ? OrderStatus.READY_FOOD : OrderStatus.READY_BAR)}
                        className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                    >
                        Gata Tot
                    </button>
                </div>
            </div>
          ))}
      </div>
    </div>
  );
};
