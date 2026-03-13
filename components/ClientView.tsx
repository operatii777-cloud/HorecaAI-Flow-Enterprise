
import React, { useState, useEffect } from 'react';
import { MenuItem, ProductCategory, OrderItem, Order, OrderStatus, PaymentMethod } from '../types';
import { ApiService } from '../services/api';
import { calculateMacros } from '../utils/calculations';
import { Bell, Receipt, X, Star, MessageSquare, Clock, CheckCircle, ChefHat, AlertCircle, ShoppingBag, CreditCard, Wallet, Smartphone, Activity, Info, Wine, ChevronRight, Sparkles, Globe, Mic, Loader2, Gamepad2, RefreshCcw } from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { getSommelierRecommendations } from '../services/geminiService';

interface ClientViewProps {
  menuItems: MenuItem[];
  onPlaceOrder: (tableId: number, items: OrderItem[]) => void;
  orders: Order[]; // Passed from App to track status
  onPayOrder?: (orderId: string, method: PaymentMethod, tip: number, amount?: number) => void;
  tableId: number; // Dynamic from props
}

const TRANSLATIONS = {
    ro: {
        welcome: 'Bine ai venit',
        table: 'Masa',
        callWaiter: 'Cheama Ospatar',
        bill: 'Nota',
        sommelier: 'Somelier Digital',
        add: 'Adauga',
        price: 'Lei',
        addToOrder: 'Adauga in Comanda',
        viewCart: 'Vezi Cosul',
        sendOrder: 'Trimite Comanda',
        yourOrder: 'Comanda Ta',
        total: 'Total',
        pay: 'Achita',
        payCard: 'Plateste cu Cardul',
        payCash: 'Cash la Ospatar',
        tip: 'Lasa un bacsis',
        feedback: 'Cum a fost experienta?',
        sendFeedback: 'Trimite Feedback',
        statusCooking: 'Se Prepara',
        statusReady: 'Gata',
        statusPending: 'Preluata',
        waitMessage: 'Te rugam sa astepti, pregatim totul cu grija.',
        orderReady: 'Comanda este gata! Vine imediat.',
        received: 'Am primit comanda',
        sommelierTitle: 'Somelier Digital',
        sommelierSubtitle: 'Recomandari Personalizate cu AI',
        whatToEat: 'Ce urmeaza sa serviti?',
        meat: 'Carne Rosie / Vita',
        fish: 'Peste / Fructe de Mare',
        pasta: 'Paste / Risotto',
        dessert: 'Desert / Dulce',
        back: 'Inapoi',
        recommendations: 'Recomandarile Noastre',
        allergens: 'Alergeni',
        nutrition: 'Valori Nutritionale',
        voicePrompt: 'Apasa si spune ce doresti...',
        loading: 'AI analizeaza meniul...',
        kidsZone: 'Kids Zone'
    },
    en: {
        welcome: 'Welcome',
        table: 'Table',
        callWaiter: 'Call Waiter',
        bill: 'Bill',
        sommelier: 'Digital Sommelier',
        add: 'Add',
        price: 'RON',
        addToOrder: 'Add to Order',
        viewCart: 'View Cart',
        sendOrder: 'Send Order',
        yourOrder: 'Your Order',
        total: 'Total',
        pay: 'Pay',
        payCard: 'Pay with Card',
        payCash: 'Pay Cash',
        tip: 'Leave a Tip',
        feedback: 'How was your experience?',
        sendFeedback: 'Send Feedback',
        statusCooking: 'Cooking',
        statusReady: 'Ready',
        statusPending: 'Pending',
        waitMessage: 'Please wait, we are preparing everything with care.',
        orderReady: 'Order is ready! Coming soon.',
        received: 'I received the order',
        sommelierTitle: 'Digital Sommelier',
        sommelierSubtitle: 'AI Personalized Recommendations',
        whatToEat: 'What are you having?',
        meat: 'Red Meat / Beef',
        fish: 'Fish / Seafood',
        pasta: 'Pasta / Risotto',
        dessert: 'Dessert / Sweets',
        back: 'Back',
        recommendations: 'Our Recommendations',
        allergens: 'Allergens',
        nutrition: 'Nutrition Facts',
        voicePrompt: 'Press and speak your order...',
        loading: 'AI is analyzing the menu...',
        kidsZone: 'Kids Zone'
    },
    fr: {
        welcome: 'Bienvenue',
        table: 'Table',
        callWaiter: 'Appeler Serveur',
        bill: 'Addition',
        sommelier: 'Sommelier Numérique',
        add: 'Ajouter',
        price: 'RON',
        addToOrder: 'Ajouter à la commande',
        viewCart: 'Voir Panier',
        sendOrder: 'Envoyer Commande',
        yourOrder: 'Votre Commande',
        total: 'Total',
        pay: 'Payer',
        payCard: 'Payer par Carte',
        payCash: 'Espèces',
        tip: 'Pourboire',
        feedback: 'Comment était votre expérience?',
        sendFeedback: 'Envoyer',
        statusCooking: 'Cuisson',
        statusReady: 'Prêt',
        statusPending: 'En Attente',
        waitMessage: 'Veuillez patienter, nous préparons tout avec soin.',
        orderReady: 'Votre commande est prête !',
        received: 'Bien reçu',
        sommelierTitle: 'Sommelier Numérique',
        sommelierSubtitle: 'Recommandations Personnalisées AI',
        whatToEat: 'Que allez-vous manger?',
        meat: 'Viande Rouge / Bœuf',
        fish: 'Poisson / Fruits de Mer',
        pasta: 'Pâtes / Risotto',
        dessert: 'Dessert / Douceurs',
        back: 'Retour',
        recommendations: 'Nos Recommandations',
        allergens: 'Allergènes',
        nutrition: 'Valeurs Nutritionnelles',
        voicePrompt: 'Appuyez pour commander...',
        loading: 'Analyse IA en cours...',
        kidsZone: 'Zone Enfants'
    }
};

type Lang = 'ro' | 'en' | 'fr';

export const ClientView: React.FC<ClientViewProps> = ({ menuItems, onPlaceOrder, orders, onPayOrder, tableId }) => {
  // Mock session data
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(ProductCategory.FOOD);
  const [showCart, setShowCart] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  
  // Language
  const [lang, setLang] = useState<Lang>('ro');
  const t = TRANSLATIONS[lang];

  // Feedback Modal
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Pay Modal
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'card'>('select');
  const [tip, setTip] = useState(0);

  // Screensaver State
  const [isScreensaver, setIsScreensaver] = useState(true);
  
  // Product Info Modal
  const [infoProduct, setInfoProduct] = useState<MenuItem | null>(null);

  // Sommelier State
  const [isSommelierOpen, setIsSommelierOpen] = useState(false);
  const [sommelierStep, setSommelierStep] = useState<'preference' | 'result'>('preference');
  const [sommelierRecommendations, setSommelierRecommendations] = useState<{item: MenuItem, reason: string}[]>([]);
  const [isLoadingSommelier, setIsLoadingSommelier] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);

  // Kids Zone
  const [isKidsZoneOpen, setIsKidsZoneOpen] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  // Auto-screensaver logic
  useEffect(() => {
      let timer: any;
      const resetTimer = () => {
          timer = setTimeout(() => setIsScreensaver(true), 120000); // 2 min idle
      };
      
      const handleActivity = () => {
          if(isScreensaver) setIsScreensaver(false);
          clearTimeout(timer);
          resetTimer();
      };

      window.addEventListener('click', handleActivity);
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      
      resetTimer();

      return () => {
          clearTimeout(timer);
          window.removeEventListener('click', handleActivity);
          window.removeEventListener('mousemove', handleActivity);
          window.removeEventListener('touchstart', handleActivity);
      };
  }, [isScreensaver]);

  // Find active order status
  useEffect(() => {
      const existing = orders.find(o => o.tableId === tableId && o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
      if(existing) setActiveOrderId(existing.id);
  }, [orders, tableId]);

  const trackedOrder = activeOrderId ? orders.find(o => o.id === activeOrderId) : null;

  const addToCart = (item: MenuItem, qty: number = 1) => {
    setCart(prev => {
        const exist = prev.find(i => i.id === item.id);
        if (exist) return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + qty} : i);
        return [...prev, { ...item, quantity: qty }];
    });
  };

  const handleOrder = async () => {
      onPlaceOrder(tableId, cart);
      setCart([]);
      setShowCart(false);
  };

  const submitFeedback = async () => {
      if(rating === 0) return alert("Te rugam selecteaza un rating!");
      await ApiService.addFeedback({
          id: Date.now().toString(),
          rating,
          comment,
          timestamp: Date.now(),
          orderId: activeOrderId || `ORD-${Date.now()}`
      });
      setShowFeedback(false);
      setRating(0);
      setComment('');
      // Don't clear active order yet, maybe they want to pay
      alert("Multumim pentru feedback!");
  };

  const handleCallWaiter = async () => {
      await ApiService.sendMessage({
          id: Date.now().toString(),
          from: `Masa ${tableId}`,
          text: `🔔 Clientul solicita ospatar la masa ${tableId}`,
          timestamp: Date.now()
      });
      alert("Un ospatar a fost notificat!");
  };

  const handleRequestBill = () => {
       setShowPayment(true);
  };

  const processPayment = () => {
      if(activeOrderId && onPayOrder && trackedOrder) {
          onPayOrder(activeOrderId, PaymentMethod.CARD, tip, trackedOrder.total);
          alert("Plata efectuata cu succes! Multumim.");
          setShowPayment(false);
          setActiveOrderId(null);
          setIsScreensaver(true);
      }
  };

  const handleVoiceCommand = (text: string) => {
      // Logic for AI Parsing: "Vreau doi burgeri si o apa"
      const lower = text.toLowerCase();
      let foundAny = false;

      // Simple Quantifier map
      const quantities: Record<string, number> = {
          'un': 1, 'o': 1, 'una': 1, 'doi': 2, 'doua': 2, 'trei': 3, 'patru': 4, 'cinci': 5
      };

      menuItems.forEach(item => {
          if (lower.includes(item.name.toLowerCase()) || (item.category === ProductCategory.DRINKS && lower.includes(item.name.split(' ')[0].toLowerCase()))) {
              // Check for quantity word preceding the item name match index? 
              // Simplified: just check if the sentence contains a number word
              let qty = 1;
              for (const [word, val] of Object.entries(quantities)) {
                  if (lower.includes(word)) {
                      // Very naive parsing: if "doi" is in sentence, use it. 
                      // Real NLP would parse dependencies.
                      qty = val;
                      break; 
                  }
              }
              
              addToCart(item, qty);
              foundAny = true;
          }
      });

      if (foundAny) {
          alert(`Am adaugat produsele identificate din: "${text}"`);
          setShowCart(true);
      } else {
          alert(`Nu am inteles comanda: "${text}". Te rugam sa repeti numele produsului exact.`);
      }
  };

  const handleSommelierSearch = async (type: string) => {
      setIsLoadingSommelier(true);
      setSommelierStep('result');
      
      const drinks = menuItems.filter(i => i.category === ProductCategory.ALCOHOL || i.category === ProductCategory.DRINKS);
      
      // Use AI to get recommendations
      const aiResults = await getSommelierRecommendations(type, lang);
      
      const matchedRecommendations: {item: MenuItem, reason: string}[] = [];
      
      if (aiResults && aiResults.recommendations) {
          aiResults.recommendations.forEach((rec: any) => {
              // Fuzzy match AI suggestion to local menu
              // Very simple match: Check if menu item name includes AI suggestion word
              const match = drinks.find(d => 
                  d.name.toLowerCase().includes(rec.name.toLowerCase()) || 
                  rec.name.toLowerCase().includes(d.name.toLowerCase())
              );
              if (match) {
                  matchedRecommendations.push({ item: match, reason: rec.reason });
              }
          });
      }

      // Fallback if AI fails or no matches
      if (matchedRecommendations.length === 0) {
          let results: MenuItem[] = [];
          if (type === 'meat') results = drinks.filter(d => d.description.toLowerCase().includes('rosu') || d.name.includes('Cabernet'));
          else if (type === 'fish') results = drinks.filter(d => d.description.toLowerCase().includes('alb') || d.name.includes('Chardonnay'));
          else results = drinks.slice(0, 3);
          
          results.slice(0, 3).forEach(r => matchedRecommendations.push({ item: r, reason: "Recomandare standard." }));
      }

      setSommelierRecommendations(matchedRecommendations);
      setIsLoadingSommelier(false);
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const getMacros = (item: MenuItem) => {
      // Since ingredients are not available here, we return estimates or empty.
      // Ideally, pass ingredients as prop or fetch them.
      return { calories: item.calories || 0, protein: item.macros?.protein || 0, fats: item.macros?.fats || 0, carbs: item.macros?.carbs || 0 };
  };

  // Tic Tac Toe Logic
  const calculateWinner = (squares: any[]) => {
      const lines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6]
      ];
      for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
              return squares[a];
          }
      }
      return null;
  };

  const handleSquareClick = (i: number) => {
      if (calculateWinner(board) || board[i]) return;
      const nextBoard = board.slice();
      nextBoard[i] = xIsNext ? 'X' : 'O';
      setBoard(nextBoard);
      setXIsNext(!xIsNext);
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  // SCREENSAVER (Attract Mode)
  if (isScreensaver) {
      return (
          <div className="h-full w-full bg-black relative overflow-hidden flex flex-col items-center justify-center text-white cursor-pointer" onClick={() => setIsScreensaver(false)}>
              <img 
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                alt="Food"
              />
              <div className="z-10 text-center animate-in zoom-in duration-1000">
                  <h1 className="text-6xl font-serif font-bold mb-4 drop-shadow-lg">HorecaAI Bistro</h1>
                  <p className="text-xl mb-8 font-light tracking-widest uppercase">Masa {tableId}</p>
                  <div className="inline-block border-2 border-white px-8 py-4 rounded-full text-lg font-bold animate-pulse hover:bg-white hover:text-black transition-colors">
                      Start / Comanda
                  </div>
              </div>
          </div>
      );
  }

  // Payment Modal
  if(showPayment && trackedOrder) {
      const orderTotal = trackedOrder.total;
      return (
          <div className="fixed inset-0 bg-slate-900/95 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">{t.pay}</h3>
                      <button onClick={() => setShowPayment(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  
                  {paymentStep === 'select' ? (
                      <div className="p-6 space-y-6">
                          <div className="text-center">
                              <p className="text-slate-500 text-sm uppercase font-bold">{t.total}</p>
                              <h2 className="text-4xl font-bold text-slate-800">{orderTotal} {t.price}</h2>
                          </div>

                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t.tip}</p>
                              <div className="flex gap-2">
                                  {[0, 5, 10, 15].map(tval => (
                                      <button 
                                        key={tval}
                                        onClick={() => setTip(tval)}
                                        className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-colors ${tip === tval ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 text-slate-600'}`}
                                      >
                                          {tval === 0 ? 'Nu' : `${tval} ${t.price}`}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="space-y-3">
                              <button onClick={() => setPaymentStep('card')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 shadow-lg">
                                  <CreditCard size={20}/> {t.payCard}
                              </button>
                              <button onClick={() => {
                                  ApiService.sendMessage({ id: Date.now().toString(), from: `Masa ${tableId}`, text: 'Clientul doreste sa plateasca CASH', timestamp: Date.now() });
                                  alert("Ospatarul a fost chemat pentru plata cash.");
                                  setShowPayment(false);
                              }} className="w-full py-3 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50">
                                  <Wallet size={20}/> {t.payCash}
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="p-6 space-y-4">
                          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg mb-4">
                              <div className="flex justify-between mb-6">
                                  <span className="font-mono opacity-80">Credit Card</span>
                                  <Smartphone size={20}/>
                              </div>
                              <div className="text-lg font-mono tracking-widest mb-4">**** **** **** 4242</div>
                              <div className="flex justify-between text-xs font-mono uppercase opacity-80">
                                  <span>Client</span>
                                  <span>12/25</span>
                              </div>
                          </div>
                          
                          <div className="text-center text-sm text-slate-500 mb-4">
                              Processing <b>{orderTotal + tip} {t.price}</b>...
                          </div>

                          <button onClick={processPayment} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 animate-pulse">
                              {t.pay}
                          </button>
                          <button onClick={() => setPaymentStep('select')} className="w-full py-2 text-slate-400 font-bold text-sm">{t.back}</button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // Status Screen (Unchanged)
  if (trackedOrder && trackedOrder.status !== OrderStatus.PAID && trackedOrder.status !== OrderStatus.SERVED && trackedOrder.status !== OrderStatus.CANCELLED) {
      let statusStep = 1;
      if (trackedOrder.status === OrderStatus.COOKING) statusStep = 2;
      if (trackedOrder.status === OrderStatus.READY_FOOD || trackedOrder.status === OrderStatus.READY_BAR) statusStep = 3;

      return (
          <div className="h-full bg-slate-900 flex justify-center items-center p-6 text-white relative">
              <div className="w-full max-w-md text-center space-y-8">
                  <div className="space-y-2">
                      <h1 className="text-2xl font-bold">{t.yourOrder}</h1>
                      <p className="text-slate-400">{t.waitMessage}</p>
                  </div>

                  <div className="flex justify-between relative px-4">
                      {/* Progress Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -z-10 mx-8"></div>
                      <div className={`absolute top-1/2 left-0 right-0 h-1 bg-amber-500 -z-10 mx-8 transition-all duration-1000`} style={{width: statusStep === 1 ? '0%' : statusStep === 2 ? '50%' : '100%'}}></div>

                      {/* Steps */}
                      <div className="flex flex-col items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${statusStep >= 1 ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>1</div>
                          <span className="text-xs font-bold uppercase">{t.statusPending}</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${statusStep >= 2 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                              <ChefHat size={18}/>
                          </div>
                          <span className="text-xs font-bold uppercase">{t.statusCooking}</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${statusStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                              <CheckCircle size={18}/>
                          </div>
                          <span className="text-xs font-bold uppercase">{t.statusReady}</span>
                      </div>
                  </div>

                  <div className="bg-slate-800 rounded-2xl p-6 text-left space-y-3">
                      <h3 className="font-bold border-b border-slate-700 pb-2 mb-2">{t.yourOrder}</h3>
                      {trackedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                              <span>{item.quantity} x {item.name}</span>
                              <span className="font-bold text-slate-400">{item.price * item.quantity} {t.price}</span>
                          </div>
                      ))}
                      <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-lg text-amber-500">
                          <span>{t.total}</span>
                          <span>{trackedOrder.total} {t.price}</span>
                      </div>
                  </div>

                  {statusStep === 3 && (
                      <div className="animate-in zoom-in slide-in-from-bottom duration-500 space-y-3">
                          <div className="bg-emerald-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                              {t.orderReady}
                          </div>
                          <button onClick={() => setShowFeedback(true)} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold">
                              {t.received}
                          </button>
                      </div>
                  )}
                  
                  {/* Pay Button available during wait */}
                  <button 
                    onClick={() => setShowPayment(true)}
                    className="w-full py-3 border border-slate-600 text-slate-300 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                      <CreditCard size={18}/> {t.pay}
                  </button>
                  
                  <button onClick={() => setIsKidsZoneOpen(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700">
                      <Gamepad2 size={18}/> {t.kidsZone}
                  </button>
              </div>

               {showFeedback && (
                <div className="absolute inset-0 bg-slate-900/95 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center text-slate-900">
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={32}/>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t.feedback}</h2>
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className={`transition-transform hover:scale-110 ${star <= rating ? 'text-amber-500' : 'text-slate-200'}`}>
                                    <Star size={36} fill={star <= rating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <textarea className="w-full border rounded-xl p-3 text-sm mb-4 outline-none bg-slate-50 text-slate-900" rows={3} placeholder="..." value={comment} onChange={e => setComment(e.target.value)}></textarea>
                        <button onClick={submitFeedback} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">{t.sendFeedback}</button>
                    </div>
                </div>
            )}
            
            {/* Kids Zone Modal */}
            {isKidsZoneOpen && (
                <div className="absolute inset-0 bg-indigo-900/95 z-[70] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
                        <button onClick={() => setIsKidsZoneOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-800"><X/></button>
                        <h2 className="text-2xl font-black text-indigo-600 text-center mb-6 uppercase tracking-widest flex items-center justify-center gap-2"><Gamepad2/> Tic Tac Toe</h2>
                        
                        <div className="grid grid-cols-3 gap-2 aspect-square mb-6">
                            {board.map((square, i) => (
                                <button 
                                    key={i} 
                                    className={`rounded-xl text-4xl font-black flex items-center justify-center transition-all ${square ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                                    onClick={() => handleSquareClick(i)}
                                >
                                    {square}
                                </button>
                            ))}
                        </div>
                        
                        <div className="text-center mb-6">
                            {winner ? (
                                <div className="text-2xl font-bold text-emerald-500 animate-bounce">Winner: {winner}! 🎉</div>
                            ) : isDraw ? (
                                <div className="text-xl font-bold text-slate-500">Draw!</div>
                            ) : (
                                <div className="text-lg font-bold text-slate-700">Next Player: {xIsNext ? 'X' : 'O'}</div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
                        >
                            <RefreshCcw size={18}/> Restart Game
                        </button>
                    </div>
                </div>
            )}
          </div>
      );
  }

  return (
    <div className="h-full bg-slate-100 flex justify-center overflow-hidden relative">
        <VoiceInput 
            isListening={isListening}
            toggleListening={() => setIsListening(!isListening)}
            onCommand={handleVoiceCommand}
        />

        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 pt-12 rounded-b-3xl shadow-lg z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-bold">HorecaAI Bistro</h1>
                        <p className="text-slate-400 text-sm">{t.table} {tableId}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setLang(l => l === 'ro' ? 'en' : l === 'en' ? 'fr' : 'ro')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-xs font-bold w-8 h-8 flex items-center justify-center uppercase">
                            {lang}
                        </button>
                        <button onClick={() => setIsListening(true)} className={`p-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'}`} title="Comanda Vocala"><Mic size={18}/></button>
                        <button onClick={() => { setIsSommelierOpen(true); setSommelierStep('preference'); }} className="p-2 bg-pink-600 rounded-full hover:bg-pink-700 animate-bounce" title={t.sommelier}><Wine size={18}/></button>
                        <button onClick={handleCallWaiter} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700" title={t.callWaiter}><Bell size={18}/></button>
                        <button onClick={handleRequestBill} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700" title={t.bill}><Receipt size={18}/></button>
                    </div>
                </div>
                
                {/* Voice Prompt */}
                <div className="text-center pb-2 text-xs text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => setIsListening(true)}>
                    {isListening ? "Ascult..." : t.voicePrompt}
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {Object.values(ProductCategory).map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-amber-500 text-white font-bold' : 'bg-slate-800 text-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {menuItems.filter(i => i.category === activeCategory).map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex min-h-28 relative">
                        <button 
                            className="absolute top-2 right-2 p-1 bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 z-10"
                            onClick={(e) => { e.stopPropagation(); setInfoProduct(item); }}
                        >
                            <Info size={16}/>
                        </button>
                        <div className="w-28 bg-slate-200 flex-shrink-0">
                             {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name}/>}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 pr-6">{item.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 mb-2">{item.description}</p>
                                {item.allergens && item.allergens.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.allergens.slice(0, 2).map(alg => (
                                            <span key={alg} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded font-bold uppercase flex items-center gap-0.5">
                                                <AlertCircle size={8}/> {alg}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="font-bold text-amber-600">{item.price} {t.price}</span>
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                >
                                    {t.add} +
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Floating Bar */}
            {cart.length > 0 && (
                <div className="absolute bottom-6 left-4 right-4 bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex justify-between items-center cursor-pointer transform hover:scale-105 transition-transform z-20" onClick={() => setShowCart(true)}>
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                        </div>
                        <span className="font-medium">{t.viewCart}</span>
                    </div>
                    <span className="font-bold text-lg">{total} {t.price}</span>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-lg">{t.yourOrder}</h2>
                        <button onClick={() => setShowCart(false)} className="p-2 bg-slate-200 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-sm text-slate-500">{item.quantity} x {item.price} {t.price}</div>
                                </div>
                                <div className="font-bold">{item.quantity * item.price} {t.price}</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 border-t bg-slate-50">
                        <div className="flex justify-between text-xl font-bold mb-4">
                            <span>{t.total}</span>
                            <span>{total} {t.price}</span>
                        </div>
                        <button 
                            onClick={handleOrder}
                            className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 shadow-lg shadow-amber-500/30"
                        >
                            {t.sendOrder}
                        </button>
                    </div>
                </div>
            )}

            {/* Info Product Modal */}
            {infoProduct && (
                <div className="absolute inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full rounded-2xl shadow-2xl p-6 relative">
                        <button onClick={() => setInfoProduct(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
                        
                        <h2 className="text-xl font-bold text-slate-800 mb-2 pr-8">{infoProduct.name}</h2>
                        <p className="text-sm text-slate-500 mb-6">{infoProduct.description}</p>
                        
                        {infoProduct.allergens && infoProduct.allergens.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">{t.allergens}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {infoProduct.allergens.map(a => (
                                        <span key={a} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1"><Activity size={14}/> {t.nutrition}</h4>
                            {(() => {
                                const m = getMacros(infoProduct);
                                return (
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-white p-2 rounded border shadow-sm">
                                            <div className="font-bold text-slate-800">{m.calories}</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-bold">kcal</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border shadow-sm">
                                            <div className="font-bold text-slate-800">{m.protein}g</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-bold">Prot</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border shadow-sm">
                                            <div className="font-bold text-slate-800">{m.fats}g</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-bold">Fat</div>
                                        </div>
                                        <div className="bg-white p-2 rounded border shadow-sm">
                                            <div className="font-bold text-slate-800">{m.carbs}g</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-bold">Carb</div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div className="mt-6">
                            <button 
                                onClick={() => { addToCart(infoProduct); setInfoProduct(null); }}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800"
                            >
                                {t.addToOrder} (+{infoProduct.price} {t.price})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sommelier Modal */}
            {isSommelierOpen && (
                <div className="absolute inset-0 bg-slate-900/90 z-[80] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 bg-pink-50 border-b border-pink-100 text-center relative">
                            <button onClick={() => setIsSommelierOpen(false)} className="absolute top-4 right-4 text-pink-300 hover:text-pink-600"><X size={20}/></button>
                            <Wine size={40} className="text-pink-600 mx-auto mb-2"/>
                            <h3 className="text-xl font-serif font-bold text-slate-800">{t.sommelierTitle}</h3>
                            <p className="text-sm text-pink-600">{t.sommelierSubtitle}</p>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {sommelierStep === 'preference' ? (
                                <div className="space-y-4">
                                    <p className="text-center text-slate-600 font-medium mb-4">{t.whatToEat}</p>
                                    <button onClick={() => handleSommelierSearch('meat')} className="w-full p-4 border rounded-xl hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="font-bold text-slate-700">🥩 {t.meat}</span>
                                        <ChevronRight className="text-slate-300 group-hover:text-pink-500"/>
                                    </button>
                                    <button onClick={() => handleSommelierSearch('fish')} className="w-full p-4 border rounded-xl hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="font-bold text-slate-700">🐟 {t.fish}</span>
                                        <ChevronRight className="text-slate-300 group-hover:text-pink-500"/>
                                    </button>
                                    <button onClick={() => handleSommelierSearch('pasta')} className="w-full p-4 border rounded-xl hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="font-bold text-slate-700">🍝 {t.pasta}</span>
                                        <ChevronRight className="text-slate-300 group-hover:text-pink-500"/>
                                    </button>
                                    <button onClick={() => handleSommelierSearch('dessert')} className="w-full p-4 border rounded-xl hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="font-bold text-slate-700">🍰 {t.dessert}</span>
                                        <ChevronRight className="text-slate-300 group-hover:text-pink-500"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-center text-slate-600 font-medium mb-4 flex items-center justify-center gap-2"><Sparkles className="text-amber-400" size={16}/> {t.recommendations}</p>
                                    
                                    {isLoadingSommelier ? (
                                        <div className="flex flex-col items-center py-8 text-pink-600">
                                            <Loader2 size={32} className="animate-spin mb-2"/>
                                            <p className="text-sm font-bold">{t.loading}</p>
                                        </div>
                                    ) : (
                                        sommelierRecommendations.map((rec, idx) => (
                                            <div key={idx} className="border border-pink-100 rounded-xl p-3 bg-pink-50/30 flex gap-3 items-start animate-in slide-in-from-bottom" style={{animationDelay: `${idx * 100}ms`}}>
                                                <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden mt-1">
                                                    {rec.item.image && <img src={rec.item.image} className="w-full h-full object-cover"/>}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-800 text-sm">{rec.item.name}</div>
                                                    <div className="text-xs text-pink-600 italic my-1">"{rec.reason}"</div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="font-bold text-slate-600">{rec.item.price} {t.price}</span>
                                                        <button 
                                                            onClick={() => { addToCart(rec.item); setIsSommelierOpen(false); }}
                                                            className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                                        >
                                                            {t.add}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <button onClick={() => setSommelierStep('preference')} className="w-full py-2 text-slate-400 text-sm font-bold mt-4">{t.back}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
