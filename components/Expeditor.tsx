
import React, { useState } from 'react';
import { Order, OrderStatus, ProductCategory } from '../types';
import { ApiService } from '../services/api';
import { CheckCircle, Clock, Bell, Printer, Utensils, Beer, ChefHat, AlertTriangle } from 'lucide-react';

interface ExpeditorProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const getTimerColor = (timestamp: number) => {
    const elapsed = (Date.now() - timestamp) / 60000; 
    if (elapsed > 25) return 'text-red-600 bg-red-100';
    if (elapsed > 15) return 'text-orange-600 bg-orange-100';
    return 'text-emerald-600 bg-emerald-100';
};

const handleCallRunner = async (order: Order) => {
    await ApiService.sendMessage({
        id: Date.now().toString(),
        from: 'EXPO',
        text: `🔔 COMANDA MASA ${order.tableId} ESTE GATA! VA ROG RIDICATI.`,
        timestamp: Date.now()
    });
    alert(`Ospatarul a fost notificat pentru Masa ${order.tableId}`);
};

const handlePrintRunnerTicket = (order: Order) => {
    alert(`Printare bon de alergator pentru Masa ${order.tableId}...`);
};

interface OrderCardProps {
    order: Order;
    onDragStart: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onDragStart }) => {
    const foodItems = order.items.filter(i => i.category === ProductCategory.FOOD || i.category === ProductCategory.DESSERT);
    const drinkItems = order.items.filter(i => i.category === ProductCategory.DRINKS || i.category === ProductCategory.ALCOHOL);
    
    const elapsed = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);

    return (
        <div 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative"
          draggable
          onDragStart={() => onDragStart(order.id)}
        >
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                <div>
                    <h4 className="font-bold text-lg text-slate-800">
                        {order.tableId > 0 ? `Masa ${order.tableId}` : 'Delivery'}
                    </h4>
                    <span className="text-xs text-slate-400">#{order.id.slice(-4)}</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${getTimerColor(new Date(order.timestamp).getTime())}`}>
                    <Clock size={12}/> {elapsed} min
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {foodItems.length > 0 && (
                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-orange-800 uppercase">
                            <Utensils size={12}/> Bucatarie
                        </div>
                        <ul className="text-sm space-y-1">
                            {foodItems.map((item, idx) => (
                                <li key={idx} className="flex justify-between">
                                    <span className="text-slate-700">{item.quantity}x {item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {drinkItems.length > 0 && (
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-blue-800 uppercase">
                            <Beer size={12}/> Bar
                        </div>
                        <ul className="text-sm space-y-1">
                            {drinkItems.map((item, idx) => (
                                <li key={idx} className="flex justify-between">
                                    <span className="text-slate-700">{item.quantity}x {item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {order.note && (
                <div className="mb-4 p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200 flex items-start gap-2">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0"/>
                    {order.note}
                </div>
            )}

            <div className="flex gap-2">
                <button 
                  onClick={() => handlePrintRunnerTicket(order)}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                  title="Print Bon Alergator"
                >
                    <Printer size={16}/>
                </button>
                {order.status === OrderStatus.READY_FOOD || order.status === OrderStatus.READY_BAR ? (
                    <button 
                      onClick={() => handleCallRunner(order)}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 animate-pulse"
                    >
                        <Bell size={16}/> Cheama Runner
                    </button>
                ) : (
                    <button 
                      className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-lg font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                      disabled
                    >
                        <Clock size={16}/> In Lucru
                    </button>
                )}
            </div>
        </div>
    );
};

export const Expeditor: React.FC<ExpeditorProps> = ({ orders }) => {
  const activeOrders = orders.filter(o => 
      o.status !== OrderStatus.PAID && 
      o.status !== OrderStatus.CANCELLED && 
      o.status !== OrderStatus.DELIVERED &&
      o.status !== OrderStatus.SERVED
  );

  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  
  const pending = activeOrders.filter(o => o.status === OrderStatus.PENDING);
  const cooking = activeOrders.filter(o => o.status === OrderStatus.COOKING);
  const ready = activeOrders.filter(o => o.status === OrderStatus.READY_FOOD || o.status === OrderStatus.READY_BAR);

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50 overflow-hidden">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ChefHat className="text-orange-600"/> Expeditie (Kitchen Pass)
                </h2>
                <p className="text-slate-500 text-sm">Monitorizare si sincronizare comenzi intre sectii.</p>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
            <div className="bg-slate-100 rounded-2xl flex flex-col border border-slate-200">
                <div className="p-4 border-b border-slate-200 bg-slate-200/50 rounded-t-2xl flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={18}/> In Asteptare
                    </h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{pending.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {pending.map(order => <OrderCard key={order.id} order={order} onDragStart={setDraggedOrder}/>)}
                    {pending.length === 0 && <p className="text-center text-slate-400 py-10 italic">Nicio comanda noua.</p>}
                </div>
            </div>

            <div className="bg-orange-50/50 rounded-2xl flex flex-col border border-orange-100">
                <div className="p-4 border-b border-orange-200 bg-orange-100/50 rounded-t-2xl flex justify-between items-center">
                    <h3 className="font-bold text-orange-800 uppercase tracking-wider flex items-center gap-2">
                        <Utensils size={18}/> Se Prepara
                    </h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-orange-600">{cooking.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cooking.map(order => <OrderCard key={order.id} order={order} onDragStart={setDraggedOrder}/>)}
                    {cooking.length === 0 && <p className="text-center text-orange-300 py-10 italic">Bucataria este libera.</p>}
                </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl flex flex-col border border-emerald-100">
                <div className="p-4 border-b border-emerald-200 bg-emerald-100/50 rounded-t-2xl flex justify-between items-center">
                    <h3 className="font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle size={18}/> La Pass (Gata)
                    </h3>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600">{ready.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {ready.map(order => <OrderCard key={order.id} order={order} onDragStart={setDraggedOrder}/>)}
                    {ready.length === 0 && <p className="text-center text-emerald-300 py-10 italic">Pass-ul este gol.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};
