
import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, ProductCategory, OrderStatus } from '../types';
import { ApiService } from '../services/api';
import { ShoppingBag, ChevronRight, X, CreditCard, ChevronLeft, Utensils, Star, Plus } from 'lucide-react';

export const SelfServiceKiosk: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [screen, setScreen] = useState<'screensaver' | 'type' | 'menu' | 'payment' | 'success'>('screensaver');
  const [orderType, setOrderType] = useState<'eat_in' | 'takeaway'>('eat_in');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [orderNumber, setOrderNumber] = useState(0);
  const [screensaverUrl, setScreensaverUrl] = useState('https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=1965&q=80');

  useEffect(() => {
      const load = async () => {
          const [m, s] = await Promise.all([ApiService.getMenu(), ApiService.getSettings()]);
          setMenu(m.filter(i => i.active));
          if(s.media?.kioskScreensaver) setScreensaverUrl(s.media.kioskScreensaver);
      };
      load();
  }, []);

  useEffect(() => {
      if (screen === 'screensaver') return;
      
      const timer = setTimeout(() => {
          setScreen('screensaver');
          setCart([]);
      }, 120000); 

      const reset = () => { clearTimeout(timer); };
      window.addEventListener('click', reset);
      return () => {
          window.removeEventListener('click', reset);
          clearTimeout(timer);
      }
  }, [screen]);

  const handleAddToCart = (item: MenuItem) => {
      setCart(prev => {
          const exist = prev.find(i => i.id === item.id);
          if(exist) return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i);
          return [...prev, { ...item, quantity: 1, selectedModifiers: [] }];
      });
      setSelectedProduct(null);
  };

  const handleCheckout = () => {
      setScreen('payment');
      setTimeout(async () => {
          const newOrderNumber = Math.floor(Math.random() * 900) + 100;
          setOrderNumber(newOrderNumber);
          
          const orderData = {
              tableId: orderType === 'eat_in' ? 99 : 0,
              type: orderType === 'eat_in' ? 'dine_in' : 'takeaway',
              items: cart,
              total: cart.reduce((a,b) => a + b.price * b.quantity, 0),
              clientId: 'kiosk-user'
          };
          
          await ApiService.placeOrder(orderData);
          
          setScreen('success');
      }, 3000);
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  if (screen === 'screensaver') {
      return (
          <div 
            className="h-screen w-full bg-cover bg-center cursor-pointer relative flex items-center justify-center overflow-hidden"
            style={{backgroundImage: `url(${screensaverUrl})`}}
            onClick={() => setScreen('type')}
          >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="z-10 text-center text-white animate-pulse">
                  <h1 className="text-8xl font-black mb-4 drop-shadow-2xl">HORECA AI</h1>
                  <p className="text-4xl font-light uppercase tracking-[0.3em]">Touch to Start</p>
              </div>
          </div>
      );
  }

  if (screen === 'type') {
      return (
          <div className="h-screen w-full bg-slate-100 p-12 flex gap-8 animate-in zoom-in duration-300">
              <button 
                onClick={() => { setOrderType('eat_in'); setScreen('menu'); }}
                className="flex-1 bg-white rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center justify-center gap-8 border-4 border-transparent hover:border-emerald-500"
              >
                  <div className="w-48 h-48 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Utensils size={80}/>
                  </div>
                  <span className="text-5xl font-black text-slate-800">EAT IN</span>
              </button>
              <button 
                onClick={() => { setOrderType('takeaway'); setScreen('menu'); }}
                className="flex-1 bg-white rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center justify-center gap-8 border-4 border-transparent hover:border-orange-500"
              >
                  <div className="w-48 h-48 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <ShoppingBag size={80}/>
                  </div>
                  <span className="text-5xl font-black text-slate-800">TAKEAWAY</span>
              </button>
          </div>
      );
  }

  if (screen === 'success') {
      return (
          <div className="h-screen w-full bg-emerald-600 flex flex-col items-center justify-center text-white p-12 text-center animate-in fade-in">
              <div className="w-32 h-32 bg-white text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl">
                  <Star size={64} fill="currentColor"/>
              </div>
              <h1 className="text-6xl font-black mb-4">ORDER CONFIRMED</h1>
              <p className="text-2xl mb-12 opacity-90">Please take your receipt and wait for your number.</p>
              
              <div className="bg-white/20 p-8 rounded-3xl border-4 border-white/30 backdrop-blur-md">
                  <p className="text-sm uppercase font-bold tracking-widest mb-2">Order Number</p>
                  <div className="text-9xl font-black font-mono">{orderNumber}</div>
              </div>

              <button 
                onClick={() => { setScreen('screensaver'); setCart([]); }}
                className="mt-16 bg-white text-emerald-800 px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
              >
                  Done
              </button>
          </div>
      );
  }

  if (screen === 'payment') {
      return (
          <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white relative">
              <div className="text-center space-y-8 animate-in zoom-in">
                  <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <CreditCard size={64}/>
                  </div>
                  <h2 className="text-4xl font-bold">Processing Payment...</h2>
                  <p className="text-xl text-slate-400">Please follow instructions on the terminal.</p>
                  <div className="text-6xl font-bold font-mono text-emerald-400">{total.toFixed(2)} RON</div>
              </div>
          </div>
      );
  }

  const categories = ['ALL', ...Object.values(ProductCategory)];

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
        <div className="w-32 bg-white shadow-xl z-20 flex flex-col items-center py-8 gap-4 overflow-y-auto no-scrollbar">
            <button onClick={() => setScreen('type')} className="p-4 bg-slate-100 rounded-2xl mb-4 text-slate-500 hover:bg-slate-200">
                <ChevronLeft size={32}/>
            </button>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center text-xs font-bold uppercase text-center p-2 transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="flex-1 flex flex-col relative">
            <div className="h-24 bg-white border-b flex items-center justify-between px-8">
                <h2 className="text-3xl font-black text-slate-800">{selectedCategory === 'ALL' ? 'POPULAR ITEMS' : selectedCategory}</h2>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Order</p>
                        <p className="text-2xl font-black text-indigo-600">{total.toFixed(2)} RON</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-3 gap-6 content-start bg-slate-100">
                {menu
                    .filter(i => selectedCategory === 'ALL' || i.category === selectedCategory)
                    .map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedProduct(item)}
                        className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col group border-2 border-transparent hover:border-indigo-500 active:scale-95"
                    >
                        <div className="h-48 w-full bg-slate-200 rounded-2xl mb-4 overflow-hidden relative">
                            {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                            ) : null}
                            <div className="absolute bottom-2 right-2 bg-white px-3 py-1 rounded-full font-bold shadow-sm">
                                {item.price} RON
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                    </div>
                ))}
            </div>

            {cart.length > 0 && (
                <div className="h-32 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 flex items-center px-8 justify-between">
                    <div className="flex gap-4 overflow-x-auto max-w-[70%] no-scrollbar py-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex-shrink-0 bg-slate-100 rounded-xl p-3 flex items-center gap-3 min-w-[150px]">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{item.quantity}</div>
                                <div>
                                    <div className="font-bold text-sm truncate w-24">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.price * item.quantity} RON</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={handleCheckout}
                        className="bg-emerald-500 text-white px-12 py-6 rounded-2xl font-black text-2xl shadow-xl hover:bg-emerald-600 hover:scale-105 transition-all flex items-center gap-4"
                    >
                        PAY {total.toFixed(2)} RON <ChevronRight size={32}/>
                    </button>
                </div>
            )}
        </div>

        {/* Product Modal */}
        {selectedProduct && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-12 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden flex shadow-2xl">
                    <div className="w-1/2 bg-slate-100 relative">
                        {selectedProduct.image && <img src={selectedProduct.image} className="w-full h-full object-cover"/>}
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <X size={24}/>
                        </button>
                    </div>
                    <div className="w-1/2 p-12 flex flex-col">
                        <h2 className="text-4xl font-black text-slate-800 mb-4">{selectedProduct.name}</h2>
                        <p className="text-xl text-slate-500 mb-8">{selectedProduct.description}</p>
                        
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-auto">
                            <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                                <Star fill="currentColor"/> MAKE IT A MEAL?
                            </h4>
                            <div className="flex gap-4">
                                <button className="flex-1 bg-white p-4 rounded-xl border-2 border-amber-200 hover:border-amber-500 font-bold text-amber-900 shadow-sm">
                                    + Fries (8 RON)
                                </button>
                                <button className="flex-1 bg-white p-4 rounded-xl border-2 border-amber-200 hover:border-amber-500 font-bold text-amber-900 shadow-sm">
                                    + Coke (6 RON)
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-8 border-t">
                            <div className="text-4xl font-black text-slate-800">{selectedProduct.price} RON</div>
                            <button 
                                onClick={() => handleAddToCart(selectedProduct)}
                                className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                            >
                                <Plus size={28}/> ADD TO ORDER
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
