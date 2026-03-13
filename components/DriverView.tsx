
import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, User } from '../types';
import { ApiService } from '../services/api';
import { Navigation, Phone, CheckCircle, Package, MapPin, RefreshCw, Bike, PenTool, X, History } from 'lucide-react';

interface DriverViewProps {
  user: User;
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({ user, orders, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const refreshOrders = async () => {
      setIsRefreshing(true);
      const allOrders = await ApiService.getOrders(); 
      const assigned = allOrders.filter(o => o.driverId === user.id && o.type === 'delivery');
      setMyOrders(assigned.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
      refreshOrders();
  }, [orders, user.id]);

  const activeDeliveries = myOrders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  const historyDeliveries = myOrders.filter(o => o.status === OrderStatus.DELIVERED);

  const calculateEarnings = () => {
      const deliveryFee = 15;
      return historyDeliveries.reduce((acc, o) => acc + deliveryFee + (o.tip || 0), 0);
  };

  const handleAction = async (order: Order) => {
      if (order.status === OrderStatus.READY_FOOD || order.status === OrderStatus.PENDING) {
          if(confirm("Piei comanda si pleci spre client?")) {
              onUpdateStatus(order.id, OrderStatus.DELIVERY_IN_TRANSIT);
          }
      } else if (order.status === OrderStatus.DELIVERY_IN_TRANSIT) {
          setSelectedOrder(order);
          setShowSignaturePad(true);
      }
  };

  const confirmDelivery = async () => {
      if (selectedOrder) {
          const canvas = canvasRef.current;
          const signature = canvas ? canvas.toDataURL() : 'mock_signature';
          await ApiService.updateOrder(selectedOrder.id, { proofOfDelivery: signature });
          onUpdateStatus(selectedOrder.id, OrderStatus.DELIVERED);
          setShowSignaturePad(false);
          setSelectedOrder(null);
      }
  };

  const openNavigation = (address: string) => {
      alert(`Navigare pornita catre: ${address}`);
  };

  const startDrawing = (e: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
  };

  const draw = (e: any) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="h-full bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
        <div className="bg-slate-800 p-6 pb-8 rounded-b-3xl shadow-lg z-10">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-none">{user.name}</h2>
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Online
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={refreshOrders} className={`p-2 rounded-lg bg-slate-700 text-white ${isRefreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={18}/>
                    </button>
                    <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 flex flex-col items-end min-w-[80px]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Castig Azi</span>
                        <span className="font-bold text-emerald-400">{calculateEarnings()} Lei</span>
                    </div>
                </div>
            </div>
            <div className="flex bg-slate-900/50 p-1 rounded-xl">
                <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                    <Bike size={16}/> Active ({activeDeliveries.length})
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
                    <History size={16}/> Istoric
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'active' ? (
                activeDeliveries.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Package size={48} className="mb-4 opacity-20"/>
                        <p>Nicio livrare activa.</p>
                    </div>
                ) : (
                    activeDeliveries.map(order => (
                        <div key={order.id} className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-1 inline-block">#{order.id.slice(-4)}</span>
                                    <h3 className="font-bold text-lg">{order.deliveryInfo?.customerName}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-xl">{order.total} Lei</span>
                                    <span className="text-xs text-slate-500 uppercase font-bold">
                                        {order.status === OrderStatus.DELIVERY_IN_TRANSIT ? 'In Transit' : 'Pregatit'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-slate-400 mt-0.5 flex-shrink-0" size={16}/>
                                    <span className="text-sm font-medium leading-tight">{order.deliveryInfo?.address}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleAction(order)}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                                    order.status === OrderStatus.DELIVERY_IN_TRANSIT 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                }`}
                            >
                                {order.status === OrderStatus.DELIVERY_IN_TRANSIT ? (
                                    <><CheckCircle size={20}/> CONFIRMA LIVRAREA (POD)</>
                                ) : (
                                    <><Package size={20}/> PREIA COMANDA</>
                                )}
                            </button>
                        </div>
                    ))
                )
            ) : (
                <div className="space-y-3">
                    {historyDeliveries.slice(0, 10).map(order => (
                        <div key={order.id} className="bg-slate-800 rounded-xl p-4 flex justify-between items-center opacity-80">
                            <div>
                                <div className="font-bold text-slate-300">Livrare #{order.id.slice(-4)}</div>
                                <div className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-emerald-400">+15 Lei</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {showSignaturePad && selectedOrder && (
            <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full rounded-2xl p-4 flex flex-col h-[70vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool size={20}/> Semnatura Client</h3>
                        <button onClick={() => setShowSignaturePad(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} className="text-slate-500"/></button>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden touch-none mb-4">
                        <canvas 
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full cursor-crosshair"
                            width={300} height={400}
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                        ></canvas>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={clearSignature} className="py-3 px-6 border rounded-xl font-bold text-slate-500">Sterge</button>
                        <button onClick={confirmDelivery} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">Confirma Livrarea</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
