
import React, { useState, useEffect } from 'react';
import { OrderItem } from '../types';
import { ShoppingCart, CreditCard, Sparkles, Clock, Star } from 'lucide-react';

export const CustomerDisplay: React.FC = () => {
  const [data, setData] = useState<{items: OrderItem[], total: number, state: string, tableName: string, promo?: any}>({
      items: [],
      total: 0,
      state: 'idle',
      tableName: ''
  });

  useEffect(() => {
      const interval = setInterval(() => {
          const stored = localStorage.getItem('horeca_cds_state');
          if (stored) {
              setData(JSON.parse(stored));
          }
      }, 500); // Poll every 500ms for near-real-time updates
      return () => clearInterval(interval);
  }, []);

  const { items, total, state, tableName, promo } = data;

  if (items.length === 0 && state === 'idle') {
      return (
          <div className="h-screen w-full bg-slate-900 text-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-[10s] hover:scale-110" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=1769&q=80)'}}></div>
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12">
                  <div className="animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
                      <h1 className="text-6xl font-serif font-bold mb-4 drop-shadow-2xl">HorecaAI Bistro</h1>
                      <p className="text-2xl font-light tracking-[0.2em] uppercase text-slate-300">Taste the Excellence</p>
                  </div>
                  {promo && (
                      <div className="mt-12 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl animate-pulse">
                          <h2 className="text-3xl font-bold text-amber-400 mb-2 flex items-center gap-3 justify-center">
                              <Sparkles/> {promo.name}
                          </h2>
                          <p className="text-xl">Discount {promo.discount}% acum!</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex">
        {/* Left: Items List */}
        <div className="w-2/3 bg-white p-8 flex flex-col shadow-xl z-10">
            <div className="mb-8 flex justify-between items-end border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Comanda Ta</h1>
                    <p className="text-slate-500 text-lg">{tableName}</p>
                </div>
                <div className="text-slate-400 font-mono text-sm">{new Date().toLocaleTimeString()}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl animate-in slide-in-from-left duration-300 border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-200 text-slate-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                                {item.quantity}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{item.name}</h3>
                                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <p className="text-slate-500 text-sm">{item.selectedModifiers.map(m => m.name).join(', ')}</p>
                                )}
                            </div>
                        </div>
                        <div className="font-bold text-xl text-slate-700">
                            {(item.price * item.quantity).toFixed(2)} RON
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t">
                <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span className="text-xl">Subtotal</span>
                    <span className="text-xl font-mono">{(total / 1.09).toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 mb-4">
                    <span className="text-xl">TVA (9%)</span>
                    <span className="text-xl font-mono">{(total - (total/1.09)).toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 text-5xl font-black">
                    <span>Total</span>
                    <span>{total.toFixed(2)} RON</span>
                </div>
            </div>
        </div>

        {/* Right: Payment Status */}
        <div className="w-1/3 bg-slate-900 text-white p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
            {state === 'payment' ? (
                <div className="animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-pulse">
                        <CreditCard size={64} className="text-white"/>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Asteptam Plata</h2>
                    <p className="text-slate-400 text-xl">Va rugam apropiati cardul sau telefonul.</p>
                    <div className="mt-12 text-6xl font-mono font-bold text-emerald-400">
                        {total.toFixed(2)} <span className="text-2xl text-emerald-600">RON</span>
                    </div>
                </div>
            ) : (
                <div className="opacity-50">
                    <ShoppingCart size={80} className="mx-auto mb-4"/>
                    <h3 className="text-2xl font-bold uppercase tracking-widest">In Curs de Scanare</h3>
                </div>
            )}
            
            <div className="absolute bottom-8 text-center w-full opacity-30 text-sm">
                Multumim ca ati ales HorecaAI Bistro!
            </div>
        </div>
    </div>
  );
};
