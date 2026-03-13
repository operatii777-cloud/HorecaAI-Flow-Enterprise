
import React, { useState } from 'react';
import { Order, OrderStatus, User, Role } from '../types';
import { Bike, Clock, MapPin, CheckCircle, Navigation, UserCircle, Phone, Map, List } from 'lucide-react';
import { ApiService } from '../services/api';

interface DeliveryManagerProps {
  orders: Order[];
  users: User[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onAssignDriver: (orderId: string, driverId: string) => void;
}

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({ orders, users, onUpdateStatus, onAssignDriver }) => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const drivers = users.filter(u => u.role === Role.DRIVER || u.role === Role.ADMIN);

  const pendingDeliveries = orders.filter(o => o.type === 'delivery' && (o.status === OrderStatus.READY_FOOD || o.status === OrderStatus.PENDING));
  const inTransit = orders.filter(o => o.type === 'delivery' && o.status === OrderStatus.DELIVERY_IN_TRANSIT);
  const delivered = orders.filter(o => o.type === 'delivery' && o.status === OrderStatus.DELIVERED);

  const handleAssign = async (orderId: string, driverId: string) => {
      onAssignDriver(orderId, driverId);
      await ApiService.updateOrder(orderId, { driverId });
      onUpdateStatus(orderId, OrderStatus.DELIVERY_IN_TRANSIT);
  };

  const getPlatformIcon = (platform?: string) => {
      switch(platform) {
          case 'glovo': return '🛵';
          case 'tazz': return '⚡';
          case 'bolt_food': return '🍏';
          case 'uber_eats': return '🚗';
          default: return '📞';
      }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Bike size={24} className="text-orange-500"/> Dispecerat Livrari
                </h2>
                <p className="text-slate-500 text-sm">Gestioneaza flota si statusul comenzilor</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-lg">
                    <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 ${view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                        <List size={16}/> Lista
                    </button>
                    <button onClick={() => setView('map')} className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 ${view === 'map' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                        <Map size={16}/> Harta Live
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-slate-700 text-sm">{drivers.filter(d => d.active).length} Soferi Activi</span>
                </div>
            </div>
        </div>

        {view === 'list' ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Column 1: Ready for Pickup */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                        <h3 className="font-bold text-orange-800 uppercase tracking-wide text-sm flex items-center gap-2">
                            <Clock size={16}/> Pregatite / In Asteptare
                        </h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-orange-600 shadow-sm">{pendingDeliveries.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {pendingDeliveries.map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg flex items-center gap-2">
                                        <span className="text-xl">{getPlatformIcon(order.platform)}</span>
                                        #{order.id.slice(-4)}
                                    </span>
                                </div>
                                <div className="mb-3 space-y-1">
                                    <div className="flex items-start gap-2 text-sm text-slate-700">
                                        <UserCircle size={14} className="mt-0.5 text-slate-400"/>
                                        <span className="font-bold">{order.deliveryInfo?.customerName}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <MapPin size={14} className="mt-0.5 text-slate-400"/>
                                        <span className="line-clamp-2">{order.deliveryInfo?.address}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <Phone size={14} className="mt-0.5 text-slate-400"/>
                                        <span>{order.deliveryInfo?.phone}</span>
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Aloca Sofer</label>
                                    <select 
                                        className="w-full border rounded-lg p-2 text-sm bg-slate-50 focus:bg-white transition-colors"
                                        onChange={(e) => handleAssign(order.id, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Selecteaza --</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        {pendingDeliveries.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Nicio comanda in asteptare</p>}
                    </div>
                </div>

                {/* Column 2: In Transit */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-800 uppercase tracking-wide text-sm flex items-center gap-2">
                            <Navigation size={16}/> In Livrare
                        </h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-blue-600 shadow-sm">{inTransit.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {inTransit.map(order => {
                            const driver = drivers.find(d => d.id === order.driverId);
                            return (
                                <div key={order.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <span className="font-bold text-lg flex items-center gap-2">
                                            <span className="text-xl">{getPlatformIcon(order.platform)}</span>
                                            #{order.id.slice(-4)}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            <Bike size={12}/> {driver?.name || 'Sofer'}
                                        </div>
                                    </div>
                                    <div className="mb-4 pl-2 space-y-1">
                                        <div className="text-sm font-medium">{order.deliveryInfo?.address}</div>
                                    </div>
                                    <button 
                                        onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16}/> Finalizeaza Livrarea
                                    </button>
                                </div>
                            );
                        })}
                        {inTransit.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Nicio livrare activa</p>}
                    </div>
                </div>

                {/* Column 3: Delivered */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden opacity-80">
                    <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                        <h3 className="font-bold text-emerald-800 uppercase tracking-wide text-sm flex items-center gap-2">
                            <CheckCircle size={16}/> Livrate Recent
                        </h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 shadow-sm">{delivered.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {delivered.slice(0, 10).map(order => { 
                            const driver = drivers.find(d => d.id === order.driverId);
                            return (
                                <div key={order.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-600 line-through decoration-slate-400 flex items-center gap-2">
                                            <span>{getPlatformIcon(order.platform)}</span>
                                            #{order.id.slice(-4)}
                                        </div>
                                        <div className="text-xs text-slate-400">Livrat de {driver?.name || 'Unknown'}</div>
                                    </div>
                                    <div className="text-emerald-600 font-bold text-sm">OK</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-300 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)',
                    backgroundSize: '40px 40px'
                }}></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-xl border-4 border-slate-800 z-20 flex flex-col items-center">
                    <div className="bg-slate-900 text-white p-2 rounded-full"><Bike size={24}/></div>
                    <div className="text-[10px] font-bold mt-1 bg-white px-2 rounded uppercase">HQ</div>
                </div>

                {pendingDeliveries.concat(inTransit).map((order) => {
                    const hash = order.id.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
                    const top = (hash % 80) + 10;
                    const left = ((hash * 17) % 80) + 10;
                    const isTransit = order.status === OrderStatus.DELIVERY_IN_TRANSIT;

                    return (
                        <div key={order.id} style={{top: `${top}%`, left: `${left}%`}} className="absolute group z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform hover:scale-125 transition-transform cursor-pointer ${isTransit ? 'bg-blue-600 text-white animate-bounce' : 'bg-orange-500 text-white'}`}>
                                {isTransit ? <Bike size={16}/> : <MapPin size={16}/>}
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                                #{order.id.slice(-4)} • {order.deliveryInfo?.customerName}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
