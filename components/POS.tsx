
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Table, MenuItem, Order, OrderItem, OrderStatus, ProductCategory, PaymentMethod, Ingredient, ModifierOption, ModifierGroup, Client, User, Role } from '../types';
import { Plus, Minus, Send, Utensils, Euro, Split, CreditCard, Banknote, Ticket, Receipt, AlertCircle, Check, X, Bike, AlertOctagon, Search, Filter, Mic, PartyPopper, UserPlus, Gift, MoveRight, Merge, Layers, Flame, PauseCircle, Trash2, Undo2, Sparkles, Map, BarChart3, Clock, CheckSquare, Users, Car, Timer, ArrowRight, Flag, LockKeyhole, Coffee, IceCream } from 'lucide-react';
import { ALLERGENS_LIST } from '../constants';
import { ApiService } from '../services/api';
import { VoiceInput } from './VoiceInput';

interface POSProps {
  tables: Table[];
  menuItems: MenuItem[];
  activeOrders: Order[];
  onPlaceOrder: (tableId: number, items: OrderItem[]) => void;
  onPlaceDeliveryOrder?: (customerInfo: {name: string, phone: string, address: string}, items: OrderItem[]) => void;
  onPayOrder: (orderId: string, method: PaymentMethod, tip: number, amount?: number) => void;
  ingredients?: Ingredient[];
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  user: User | null;
}

export const POS: React.FC<POSProps> = ({ tables, menuItems, activeOrders, onPlaceOrder, onPlaceDeliveryOrder, onPayOrder, ingredients = [], notify, user }) => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(ProductCategory.FOOD);
  
  // View Modes
  const [viewMode, setViewMode] = useState<'tables' | 'drivethru'>('tables');

  // Course State
  const [activeCourse, setActiveCourse] = useState<'course_1' | 'course_2' | 'course_3'>('course_2'); 

  // Guest Tracking
  const [activeSeat, setActiveSeat] = useState(1);
  const [seatCount, setSeatCount] = useState(1);

  // Delivery Mode State
  const [isDeliveryMode, setIsDeliveryMode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', phone: '', address: '' });
  const [foundClient, setFoundClient] = useState<{name: string, orders: number} | null>(null);

  // Drive Thru State
  const [activeLane, setActiveLane] = useState<1 | 2>(1);
  const [driveThruOrders, setDriveThruOrders] = useState<Record<number, {id: string, items: OrderItem[], startTime: number, status: 'ordering'|'paying'|'pickup'}>>({});

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isProformaModalOpen, setIsProformaModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0); 
  const [discountAmount, setDiscountAmount] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState('');

  // Upsell Modal State
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
  const [upsellSuggestions, setUpsellSuggestions] = useState<MenuItem[]>([]);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0);

  // Split Logic
  const [splitMode, setSplitMode] = useState<'equal' | 'items' | 'seats'>('equal');
  const [splitCount, setSplitCount] = useState(2);
  const [selectedSplitItems, setSelectedSplitItems] = useState<number[]>([]); 
  const [selectedSplitSeat, setSelectedSplitSeat] = useState(1);

  // Modifiers Modal State
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierOption[]>>({});

  // Receipt Printing
  const [receiptToPrint, setReceiptToPrint] = useState<Order | null>(null);

  // Search & Filter
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);

  // Voice Assistant
  const [isListening, setIsListening] = useState(false);

  // Happy Hour Active?
  const [activePromo, setActivePromo] = useState<{name: string, discount: number} | null>(null);

  // Transfer Table Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Client Link Modal
  const [isLinkClientModalOpen, setIsLinkClientModalOpen] = useState(false);
  const [linkedClient, setLinkedClient] = useState<Client | null>(null);
  const [clientSearchPhone, setClientSearchPhone] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  // Void Item Modal & Security
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [itemToVoid, setItemToVoid] = useState<{idx: number, name: string} | null>(null);
  const [voidReason, setVoidReason] = useState('Gresala Operare');
  const [returnStock, setReturnStock] = useState(false);
  
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [authAction, setAuthAction] = useState<() => void>(() => {});

  // Heatmap State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [tableRevenue, setTableRevenue] = useState<Record<number, number>>({});

  // Map Mode Detection
  const useMapLayout = useMemo(() => tables.some(t => t.x !== undefined && t.y !== undefined), [tables]);

  // Load clients for search
  useEffect(() => {
      ApiService.getClients().then(setClients);
  }, []);

  // Check for promotions on mount and interval
  useEffect(() => {
      const checkPromo = async () => {
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay(); // 0 = Sun
          const promos = await ApiService.getPromotions();
          const active = promos.find(p => 
              p.active && 
              p.days.includes(day) && 
              (p.startHour === undefined || hour >= p.startHour) && 
              (p.endHour === undefined || hour < p.endHour)
          );
          if (active) {
              setActivePromo({ name: active.name, discount: active.discountPercent });
          } else {
              setActivePromo(null);
          }
      };
      checkPromo();
      const interval = setInterval(checkPromo, 60000);
      return () => clearInterval(interval);
  }, []);

  // Calculate Table Revenue for Heatmap
  useEffect(() => {
      if(showHeatmap) {
          const fetchHistory = async () => {
              const archived = await ApiService.getArchivedOrders();
              const allOrders = [...activeOrders, ...archived];
              const revenue: Record<number, number> = {};
              
              allOrders.forEach(o => {
                  if(o.tableId > 0 && o.status === OrderStatus.PAID) {
                      revenue[o.tableId] = (revenue[o.tableId] || 0) + o.total;
                  }
              });
              setTableRevenue(revenue);
          };
          fetchHistory();
      }
  }, [showHeatmap, activeOrders]);

  const activeOrderForSelectedTable = useMemo(() => {
    if (isDeliveryMode) return null; 
    return activeOrders.find(o => o.tableId === selectedTableId && o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
  }, [activeOrders, selectedTableId, isDeliveryMode]);

  // Determine seat count from existing order or manual input
  useEffect(() => {
      if(activeOrderForSelectedTable) {
          const maxSeat = activeOrderForSelectedTable.items.reduce((max, item) => Math.max(max, item.seatIdx || 1), 1);
          setSeatCount(Math.max(seatCount, maxSeat));
      }
  }, [activeOrderForSelectedTable]);

  // Sync Linked Client if already attached to order
  useEffect(() => {
      if(activeOrderForSelectedTable?.clientId) {
          const c = clients.find(c => c.id === activeOrderForSelectedTable.clientId);
          if(c) setLinkedClient(c);
      } else {
          setLinkedClient(null);
      }
  }, [activeOrderForSelectedTable, clients]);

  // CDS: Broadcast Cart State to LocalStorage for Customer Display
  useEffect(() => {
      let itemsToBroadcast: OrderItem[] = [];
      let totalToBroadcast = 0;
      let state = 'idle';

      if (activeOrderForSelectedTable) {
          itemsToBroadcast = activeOrderForSelectedTable.items;
          totalToBroadcast = activeOrderForSelectedTable.total;
          state = 'active';
      }
      
      if (currentOrderItems.length > 0) {
          itemsToBroadcast = [...itemsToBroadcast, ...currentOrderItems];
          totalToBroadcast += currentOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          state = 'active';
      }

      if (isPaymentModalOpen) state = 'payment';

      localStorage.setItem('horeca_cds_state', JSON.stringify({
          items: itemsToBroadcast,
          total: totalToBroadcast,
          state: state,
          tableName: selectedTableId ? `Masa ${selectedTableId}` : 'Comanda',
          promo: activePromo
      }));

  }, [currentOrderItems, activeOrderForSelectedTable, isPaymentModalOpen, activePromo, selectedTableId]);


  // HOTKEYS
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'F4') {
              e.preventDefault();
              if (activeOrderForSelectedTable && !isPaymentModalOpen) {
                  const remaining = activeOrderForSelectedTable.splitBill ? activeOrderForSelectedTable.splitBill.remainingAmount : activeOrderForSelectedTable.total;
                  handleOpenPayment(remaining);
              }
          }
          if (e.key === 'F9') {
              e.preventDefault();
              if (currentOrderItems.length > 0) submitOrder();
          }
          if (e.key === 'Escape') {
              if (isManagerAuthOpen) setIsManagerAuthOpen(false);
              else if (isUpsellModalOpen) setIsUpsellModalOpen(false);
              else if (isPaymentModalOpen) setIsPaymentModalOpen(false);
              else if (isSplitModalOpen) setIsSplitModalOpen(false);
              else if (isProformaModalOpen) setIsProformaModalOpen(false);
              else if (selectedItemForModifiers) setSelectedItemForModifiers(null);
              else if (isFilterOpen) setIsFilterOpen(false);
              else if (isTransferModalOpen) setIsTransferModalOpen(false);
              else if (isLinkClientModalOpen) setIsLinkClientModalOpen(false);
              else if (isVoidModalOpen) setIsVoidModalOpen(false);
              else if (selectedTableId) {
                  setSelectedTableId(null);
                  setIsDeliveryMode(false);
              }
          }
          if (e.key === 'F2') {
              e.preventDefault();
              searchInputRef.current?.focus();
          }
          // Voice Hotkey
          if (e.ctrlKey && e.code === 'Space') {
              e.preventDefault();
              setIsListening(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOrderForSelectedTable, currentOrderItems, isPaymentModalOpen, selectedTableId, isFilterOpen, isTransferModalOpen, isLinkClientModalOpen, isVoidModalOpen, isManagerAuthOpen, isUpsellModalOpen]);

  const handleVoiceCommand = (text: string) => {
      const lower = text.toLowerCase();
      
      if (lower.includes('masă') || lower.includes('masa')) {
          const match = lower.match(/\d+/);
          if (match) {
              const tableId = parseInt(match[0]);
              const table = tables.find(t => t.id === tableId);
              if (table) {
                  handleTableSelect(tableId);
                  notify(`Selectat Masa ${tableId}`, 'success');
              } else {
                  notify(`Masa ${tableId} nu exista`, 'error');
              }
              return;
          }
      }

      if (selectedTableId || isDeliveryMode || viewMode === 'drivethru') {
          setSearchTerm(text);
          notify(`Cautare: "${text}"`, 'info');
      } else {
          notify("Selecteaza o masa pentru a cauta produse", 'error');
      }
  };

  const handleTableSelect = (id: number) => {
    setSelectedTableId(id);
    setIsDeliveryMode(false);
    setCurrentOrderItems([]); 
    setSeatCount(1);
    setActiveSeat(1);
  };

  const handleDeliverySelect = () => {
      setIsDeliveryMode(true);
      setSelectedTableId(null);
      setCurrentOrderItems([]);
      setDeliveryInfo({ name: '', phone: '', address: '' });
      setFoundClient(null);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const phone = e.target.value;
      setDeliveryInfo({...deliveryInfo, phone});
      
      if(phone.length >= 4) {
          const client = clients.find(c => c.phone === phone);
          if(client) {
              setDeliveryInfo({ name: client.name, phone: client.phone, address: client.address || '' });
              setFoundClient({ name: client.name, orders: client.ordersCount });
          } else {
              setFoundClient(null);
          }
      }
  };

  const handleLinkClientSearch = (phone: string) => {
      setClientSearchPhone(phone);
      if(phone.length >= 4) {
          const client = clients.find(c => c.phone === phone);
          if(client) setLinkedClient(client);
      }
  };

  const confirmLinkClient = () => {
      if(linkedClient && activeOrderForSelectedTable) {
          ApiService.updateOrder(activeOrderForSelectedTable.id, { clientId: linkedClient.id });
          notify(`Client ${linkedClient.name} asociat comenzii!`, 'success');
          setIsLinkClientModalOpen(false);
      } else if (!activeOrderForSelectedTable) {
          notify("Trebuie sa ai o comanda activa pentru a asocia un client.", 'error');
      }
  };

  const handleTransferTable = async (targetTableId: number) => {
      if(!selectedTableId) return;
      if(targetTableId === selectedTableId) return notify("Selecteaza o masa diferita!", 'error');
      
      try {
          await ApiService.transferTable(selectedTableId, targetTableId, user?.name || 'User');
          notify(`Transfer / Unire la Masa ${targetTableId} realizata!`, 'success');
          setIsTransferModalOpen(false);
          setSelectedTableId(targetTableId);
      } catch (e) {
          notify("Eroare la transfer.", 'error');
      }
  };

  const isOutOfStock = (item: MenuItem) => {
    if (!item.recipe || item.recipe.length === 0) return false;
    for (const recipeItem of item.recipe) {
      const ingredient = ingredients.find(ing => ing.id === recipeItem.ingredientId);
      if (!ingredient || ingredient.currentStock < recipeItem.quantity) {
        return true;
      }
    }
    return false;
  };

  const initModifiers = (item: MenuItem) => {
      if (item.modifiers && item.modifiers.length > 0) {
          setSelectedItemForModifiers(item);
          setSelectedModifiers({});
          return;
      }
      addToCart(item);
  };

  const addToCart = (item: MenuItem, modifiers: ModifierOption[] = []) => {
    if(isOutOfStock(item)) {
        notify(`${item.name} nu mai este in stoc!`, 'error');
        return;
    }

    if(item.pairing && Math.random() > 0.5) { 
        notify(`💡 Sugestie AI: ${item.pairing}`, 'info');
    }

    let finalPrice = item.price;
    let appliedDiscountName = undefined;
    let discountedPrice = undefined;

    if (activePromo && item.category !== ProductCategory.ALCOHOL) {
        discountedPrice = item.price * (1 - activePromo.discount / 100);
        finalPrice = discountedPrice;
        appliedDiscountName = activePromo.name;
    }

    setCurrentOrderItems(prev => {
      const modifierKey = modifiers.map(m => m.id).sort().join(',');
      const existing = prev.find(i => {
          const iModKey = i.selectedModifiers?.map(m => m.id).sort().join(',') || '';
          return i.id === item.id && iModKey === modifierKey && i.course === activeCourse && i.seatIdx === activeSeat;
      });

      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      
      const modifierTotal = modifiers.reduce((acc, m) => acc + m.price, 0);
      
      return [...prev, { 
          ...item, 
          quantity: 1, 
          selectedModifiers: modifiers,
          price: finalPrice + modifierTotal,
          originalPrice: item.price + modifierTotal,
          discountedPrice,
          appliedDiscountName,
          course: activeCourse,
          itemStatus: 'pending', 
          seatIdx: activeSeat
      }];
    });
  };

  const confirmModifiers = () => {
      if(!selectedItemForModifiers) return;
      
      const missingRequired = selectedItemForModifiers.modifiers?.some(group => {
          const selectedInGroup = selectedModifiers[group.id] || [];
          return selectedInGroup.length < group.minSelection;
      });

      if(missingRequired) {
          notify("Te rog selecteaza optiunile obligatorii!", 'error');
          return;
      }

      const flatModifiers: ModifierOption[] = (Object.values(selectedModifiers) as ModifierOption[][]).reduce((acc: ModifierOption[], curr: ModifierOption[]) => acc.concat(curr), []);
      addToCart(selectedItemForModifiers, flatModifiers);
      setSelectedItemForModifiers(null);
      setSelectedModifiers({});
  };

  const toggleModifier = (group: ModifierGroup, option: ModifierOption) => {
      setSelectedModifiers(prev => {
          const current = prev[group.id] || [];
          const exists = current.find(o => o.id === option.id);
          
          if (exists) {
              return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
          } else {
              if (group.maxSelection === 1) {
                  return { ...prev, [group.id]: [option] };
              } else {
                   if (current.length >= group.maxSelection) return prev;
                   return { ...prev, [group.id]: [...current, option] };
              }
          }
      });
  };

  const removeFromCart = (index: number) => {
    setCurrentOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const submitOrder = () => {
    if(viewMode === 'drivethru') {
        if(currentOrderItems.length === 0) return notify("Comanda goala!", 'error');
        
        // Drive Thru Logic
        const laneOrder = driveThruOrders[activeLane];
        if(!laneOrder) {
            const newId = Date.now().toString();
            setDriveThruOrders(prev => ({
                ...prev,
                [activeLane]: { id: newId, items: currentOrderItems, startTime: Date.now(), status: 'ordering' }
            }));
            
            onPlaceOrder(-activeLane, currentOrderItems); // Negative ID for lanes
            
            notify(`Masina inregistrata pe Linia ${activeLane}!`, 'success');
        } else {
            onPlaceOrder(-activeLane, currentOrderItems);
            notify(`Comanda Linia ${activeLane} actualizata!`, 'info');
        }
        
        setCurrentOrderItems([]);
        return;
    }

    if (isDeliveryMode) {
        if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
            notify("Completeaza datele clientului!", 'error');
            return;
        }
        if (currentOrderItems.length === 0) return notify("Cosul este gol!", 'error');

        if (onPlaceDeliveryOrder) {
            onPlaceDeliveryOrder(deliveryInfo, currentOrderItems);
            setCurrentOrderItems([]);
            setDeliveryInfo({ name: '', phone: '', address: '' });
            setIsDeliveryMode(false); 
        }
    } else {
        if (selectedTableId && currentOrderItems.length > 0) {
          onPlaceOrder(selectedTableId, currentOrderItems);
          setCurrentOrderItems([]);
        }
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent, item: MenuItem) => {
      e.preventDefault();
      if(user?.role !== Role.ADMIN && user?.role !== Role.MANAGER) return;

      if(confirm(`Vrei sa schimbi statusul produsului "${item.name}" in ${item.active ? 'INACTIV' : 'ACTIV'}?`)) {
          ApiService.saveMenuItem({...item, active: !item.active}).then(() => {
              notify(`Produsul a fost ${!item.active ? 'activat' : 'dezactivat'}.`, 'info');
              window.location.reload(); 
          });
      }
  };

  const toggleAllergenFilter = (allergen: string) => {
      setExcludedAllergens(prev => 
          prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
      );
  };

  const filteredMenu = menuItems.filter(item => {
      const matchesCategory = item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasExcludedAllergen = excludedAllergens.some(alg => item.allergens?.includes(alg));
      if (hasExcludedAllergen) return false;

      return (searchTerm ? matchesSearch : matchesCategory);
  });
  
  const currentTotal = currentOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const existingOrderTotal = activeOrderForSelectedTable ? activeOrderForSelectedTable.total : 0;
  
  const remainingToPay = activeOrderForSelectedTable && activeOrderForSelectedTable.splitBill 
    ? activeOrderForSelectedTable.splitBill.remainingAmount 
    : existingOrderTotal;

  const handleOpenPayment = (amount: number) => {
      if(activeOrderForSelectedTable) {
          const hasDrink = activeOrderForSelectedTable.items.some(i => i.category === ProductCategory.DRINKS || i.category === ProductCategory.ALCOHOL || i.category === ProductCategory.COFFEE);
          const hasDessert = activeOrderForSelectedTable.items.some(i => i.category === ProductCategory.DESSERT);
          
          if (!hasDrink || !hasDessert) {
              let suggestions: MenuItem[] = [];
              if(!hasDrink) {
                  const drinks = menuItems.filter(i => i.category === ProductCategory.DRINKS || i.category === ProductCategory.COFFEE).slice(0, 2);
                  suggestions = [...suggestions, ...drinks];
              }
              if(!hasDessert) {
                  const sweets = menuItems.filter(i => i.category === ProductCategory.DESSERT).slice(0, 1);
                  suggestions = [...suggestions, ...sweets];
              }
              
              if(suggestions.length > 0) {
                  setUpsellSuggestions(suggestions);
                  setPendingPaymentAmount(amount);
                  setIsUpsellModalOpen(true);
                  return; 
              }
          }
      }

      setPaymentAmount(amount);
      setDiscountAmount(0);
      setGiftCardCode('');
      setIsPaymentModalOpen(true);
  };

  const handleUpsellDecline = () => {
      setIsUpsellModalOpen(false);
      setPaymentAmount(pendingPaymentAmount);
      setDiscountAmount(0);
      setGiftCardCode('');
      setIsPaymentModalOpen(true);
  };

  const handleUpsellAdd = (item: MenuItem) => {
      if(activeOrderForSelectedTable) {
          onPlaceOrder(activeOrderForSelectedTable.tableId, [{...item, quantity: 1}]);
          notify(`${item.name} adaugat! Poti incasa din nou.`, 'success');
          setIsUpsellModalOpen(false);
      }
  };

  const handleFinalPayment = (method: PaymentMethod) => {
      if(method === PaymentMethod.GIFT_CARD) {
          ApiService.getGiftCards().then(cards => {
              const card = cards.find(c => c.code === giftCardCode && c.active);
              const finalAmountToPay = paymentAmount - discountAmount;
              
              if(!card) return notify("Cod card invalid!", 'error');
              if(card.currentBalance < finalAmountToPay) return notify("Sold insuficient pe card!", 'error');
              
              notify("Plata Gift Card procesata!", 'success');
          });
      }

      if(viewMode === 'drivethru' && driveThruOrders[activeLane]) {
          const laneId = -activeLane;
          const order = activeOrders.find(o => o.tableId === laneId && o.status !== OrderStatus.PAID);
          if(order) {
              onPayOrder(order.id, method, tipAmount, order.total);
              
              setDriveThruOrders(prev => {
                  const newState = {...prev};
                  delete newState[activeLane];
                  return newState;
              });
              notify(`Incasat Linia ${activeLane}. Masina a plecat.`, 'success');
              setIsPaymentModalOpen(false);
              setTipAmount(0);
              setCurrentOrderItems([]);
          }
          return;
      }

      if(activeOrderForSelectedTable) {
          const finalAmountToPay = paymentAmount - discountAmount;
          onPayOrder(activeOrderForSelectedTable.id, method, tipAmount, finalAmountToPay);
          
          setReceiptToPrint(activeOrderForSelectedTable);
          setTimeout(() => {
              window.print();
              setReceiptToPrint(null);
              setIsPaymentModalOpen(false);
              setIsSplitModalOpen(false);
              setTipAmount(0);
          }, 500);
      }
  };

  const applyLoyaltyDiscount = (amount: number) => {
      setDiscountAmount(amount);
  };

  const toggleSplitItem = (index: number) => {
      if(selectedSplitItems.includes(index)) {
          setSelectedSplitItems(prev => prev.filter(i => i !== index));
      } else {
          setSelectedSplitItems(prev => [...prev, index]);
      }
  };

  const calculateSplitAmount = () => {
      if(splitMode === 'equal') {
          return remainingToPay / splitCount;
      } else if (splitMode === 'seats') {
          if(!activeOrderForSelectedTable) return 0;
          return activeOrderForSelectedTable.items
            .filter(i => i.seatIdx === selectedSplitSeat)
            .reduce((acc, i) => acc + (i.price * i.quantity), 0);
      } else {
          if(!activeOrderForSelectedTable) return 0;
          return selectedSplitItems.reduce((acc, idx) => {
              const item = activeOrderForSelectedTable.items[idx];
              if(!item) return acc;
              return acc + (item.price * item.quantity); 
          }, 0);
      }
  };

  const handlePrintProforma = () => {
      setReceiptToPrint(activeOrderForSelectedTable || null);
      setTimeout(() => {
          window.print();
          setReceiptToPrint(null);
      }, 500);
  };

  const handleFireCourse = async (course: string) => {
      if(activeOrderForSelectedTable) {
          const newStatus = { ...activeOrderForSelectedTable.courseStatus, [course]: 'fire' };
          await ApiService.updateOrder(activeOrderForSelectedTable.id, { courseStatus: newStatus as any });
          notify(`Felul ${courseNames[course as keyof typeof courseNames] || course} a fost trimis spre gatire!`, 'success');
      }
  };

  const openVoidModal = (item: OrderItem, realIdx: number) => {
      setItemToVoid({idx: realIdx, name: item.name});
      if (user?.role === Role.ADMIN || user?.role === Role.MANAGER) {
          setIsVoidModalOpen(true);
      } else {
          setAuthAction(() => {
              setIsVoidModalOpen(true);
          });
          setIsManagerAuthOpen(true);
      }
  };

  const handleManagerAuth = () => {
      ApiService.getUsers().then(users => {
          const managers = users.filter(u => u.role === Role.ADMIN || u.role === Role.MANAGER);
          const authorized = managers.find(m => m.pin === managerPin);
          
          if(authorized) {
              setIsManagerAuthOpen(false);
              setManagerPin('');
              authAction();
          } else {
              notify("PIN Incorect!", 'error');
              setManagerPin('');
          }
      });
  };

  const handleVoidConfirm = async () => {
      if(itemToVoid && activeOrderForSelectedTable) {
          try {
              await ApiService.voidOrderItem(activeOrderForSelectedTable.id, itemToVoid.idx, voidReason, returnStock, user?.name || 'Admin');
              notify(`Produs "${itemToVoid.name}" sters (VOID)!`, 'success');
              setIsVoidModalOpen(false);
              setItemToVoid(null);
          } catch (e) {
              notify("Eroare la stergere.", 'error');
          }
      }
  };

  const getTableTimer = (tableId: number) => {
      const order = activeOrders.find(o => o.tableId === tableId && o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
      if(!order) return null;
      const minutes = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
      return minutes;
  };

  const getTimerColor = (minutes: number) => {
      if (minutes < 60) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      if (minutes < 90) return 'text-amber-700 bg-amber-100 border-amber-300';
      return 'text-red-700 bg-red-100 border-red-300 animate-pulse';
  };

  const getTableColor = (tableId: number, isActive: boolean) => {
      if(showHeatmap) {
          const revenue = tableRevenue[tableId] || 0;
          const maxRev = Math.max(...(Object.values(tableRevenue) as number[]), 1);
          const intensity = Math.min(revenue / maxRev, 1);
          
          const g = Math.round(255 * (1 - intensity));
          const b = Math.round(255 * (1 - intensity));
          return { backgroundColor: `rgb(255, ${g}, ${b})`, color: intensity > 0.5 ? 'white' : 'black' };
      }
      
      if(isActive) return { backgroundColor: '', className: 'bg-amber-100 border-2 border-amber-500 text-amber-700' };
      return { backgroundColor: '', className: 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent text-slate-600' };
  };

  const calculateVatBreakdown = (order: Order) => {
      const breakdown: Record<number, {base: number, vat: number}> = {};
      order.items.forEach(item => {
          const rate = item.vatRate || 19;
          const itemTotal = item.price * item.quantity;
          const base = itemTotal / (1 + rate/100);
          const vat = itemTotal - base;
          
          if(!breakdown[rate]) breakdown[rate] = {base: 0, vat: 0};
          breakdown[rate].base += base;
          breakdown[rate].vat += vat;
      });
      return breakdown;
  };

  const groupedCartItems = useMemo(() => {
      const groups: Record<string, OrderItem[]> = {
          'course_1': [], 'course_2': [], 'course_3': []
      };
      
      currentOrderItems.forEach(item => {
          const c = item.course || 'course_2';
          if(!groups[c]) groups[c] = [];
          groups[c].push(item);
      });
      return groups;
  }, [currentOrderItems]);

  const groupedActiveItems = useMemo(() => {
      const groups: Record<string, {item: OrderItem, originalIndex: number}[]> = {
          'course_1': [], 'course_2': [], 'course_3': []
      };
      if(activeOrderForSelectedTable) {
          activeOrderForSelectedTable.items.forEach((item, index) => {
              const c = item.course || 'course_2';
              if(!groups[c]) groups[c] = [];
              groups[c].push({ item, originalIndex: index });
          });
      }
      return groups;
  }, [activeOrderForSelectedTable]);

  const courseNames = {
      'course_1': 'Aperitiv / Fel 1',
      'course_2': 'Fel Principal',
      'course_3': 'Desert'
  };

  const handleDriveThruPay = () => {
      const laneOrder = driveThruOrders[activeLane];
      if(!laneOrder) return;
      const laneOrderObj = activeOrders.find(o => o.tableId === -activeLane && o.status !== OrderStatus.PAID);
      const total = laneOrderObj ? laneOrderObj.total : 0;
      handleOpenPayment(total);
  };

  const getLaneDuration = (lane: number) => {
      const o = driveThruOrders[lane];
      if(!o) return 0;
      return Math.floor((Date.now() - o.startTime) / 1000);
  };

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden relative">
      <VoiceInput 
        onCommand={handleVoiceCommand} 
        isListening={isListening} 
        toggleListening={() => setIsListening(!isListening)} 
      />
      {/* ... UI Rendering Logic Same as Before but connected to API logic ... */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {/* ... Main Panel Content (Tables, Grid, etc) ... */}
          {!selectedTableId && !isDeliveryMode && viewMode === 'tables' ? (
               <div className="flex flex-col h-full">
                   {/* ... Table Map UI ... */}
                   <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Plan Sala</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode('drivethru')} className="px-3 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700">
                                <Car size={18}/> Drive Thru
                            </button>
                            <button onClick={() => setShowHeatmap(!showHeatmap)} className="px-3 py-2 border rounded-lg font-bold text-sm flex items-center gap-2"><BarChart3 size={18}/> Heatmap</button>
                            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-white border rounded text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-slate-200"></span> Liber
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Ocupat
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Rezervat
                            </div>
                            <button onClick={handleDeliverySelect} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800">
                                <Bike size={18}/> Delivery / Comanda Noua
                            </button>
                        </div>
                   </div>
                   {/* ... Table Grid Rendering logic from previous step ... */}
                   <div className="p-6 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {tables.map(table => {
                            const isActive = activeOrders.some(o => o.tableId === table.id && o.status !== OrderStatus.PAID);
                            const styleInfo = getTableColor(table.id, isActive);
                            return (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableSelect(table.id)}
                                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm relative overflow-hidden ${showHeatmap ? '' : styleInfo.className}`}
                                    style={{ backgroundColor: styleInfo.backgroundColor, color: styleInfo.color }}
                                >
                                    <span className="text-2xl font-bold">{table.id}</span>
                                    <span className="text-xs mt-1 font-medium opacity-70">{table.seats} locuri</span>
                                    {isActive && !showHeatmap && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider absolute bottom-2">Ocupat</span>}
                                </button>
                            );
                        })}
                   </div>
               </div>
          ) : viewMode === 'drivethru' && !selectedTableId ? (
               <div className="flex flex-col h-full bg-slate-900 text-white">
                   <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                           <button onClick={() => setViewMode('tables')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft/></button>
                           <h2 className="text-2xl font-black flex items-center gap-3"><Car size={32} className="text-indigo-500"/> DRIVE THRU</h2>
                       </div>
                       <div className="flex gap-4">
                           <div className="text-right">
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Timp Mediu Servire</p>
                               <p className="text-xl font-mono font-bold text-emerald-400">04:22</p>
                           </div>
                       </div>
                   </div>
                   <div className="flex-1 p-8 grid grid-cols-2 gap-8">
                       {[1, 2].map(lane => {
                           const order = driveThruOrders[lane];
                           return (
                               <div key={lane} className={`rounded-3xl border-2 transition-all flex flex-col overflow-hidden ${order ? 'border-indigo-500 bg-slate-800/50' : 'border-slate-800 border-dashed bg-transparent'}`}>
                                   <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                       <h3 className="text-xl font-bold">LANE {lane}</h3>
                                       {order && <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold animate-pulse">ACTIV</span>}
                                   </div>
                                   <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                       {order ? (
                                           <div className="space-y-6 w-full">
                                               <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-500/30">
                                                   <span className="text-3xl font-mono font-bold">{getDriveThruTimer(lane)}s</span>
                                               </div>
                                               <div>
                                                   <p className="text-slate-400 font-bold uppercase text-xs">Comanda Curenta</p>
                                                   <p className="text-2xl font-black mt-1">ORD-{order.id.slice(-6)}</p>
                                               </div>
                                               <div className="grid grid-cols-2 gap-3">
                                                   <button onClick={() => handleTableSelect(-lane)} className="py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all">Editeaza</button>
                                                   <button onClick={() => handleDriveThruPay(lane)} className="py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Incasare</button>
                                               </div>
                                           </div>
                                       ) : (
                                           <div className="space-y-4">
                                               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                                   <Plus className="text-slate-600" size={32}/>
                                               </div>
                                               <p className="text-slate-500 font-bold">Asteptare vehicul...</p>
                                               <button onClick={() => handleTableSelect(-lane)} className="px-8 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700">Deschide Lane</button>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>
          ) : (
               // ... Menu Grid ...
               <div className="flex flex-col h-full">
                   <div className="p-4 border-b space-y-3 bg-slate-50">
                        {/* ... Navigation ... */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <button onClick={() => { setSelectedTableId(null); setIsDeliveryMode(false); setViewMode('tables'); }} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1">&larr; Inapoi</button>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">
                                    {isDeliveryMode ? 'Comanda Delivery' : selectedTableId && selectedTableId < 0 ? `Drive Thru Lane ${Math.abs(selectedTableId)}` : `Masa ${selectedTableId}`}
                                </h3>
                            </div>
                            {isDeliveryMode && (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Telefon Client..." 
                                        className="px-4 py-2 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-800"
                                        value={deliveryInfo.phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Adresa..." 
                                        className="px-4 py-2 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-800 w-64"
                                        value={deliveryInfo.address}
                                        onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                        {/* ... Categories ... */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {Object.values(ProductCategory).map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>{cat}</button>
                            ))}
                        </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50">
                        {filteredMenu.map(item => (
                            <div key={item.id} onClick={() => !isOutOfStock(item) && initModifiers(item)} className={`border border-slate-200 rounded-xl p-3 flex flex-col hover:shadow-lg transition-all cursor-pointer bg-white ${isOutOfStock(item) ? 'opacity-60 grayscale' : ''}`}>
                                <div className="h-24 w-full bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
                                    {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer"/>}
                                    {isOutOfStock(item) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">STOC EPUIZAT</div>}
                                </div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                                    <span className="font-bold text-amber-600 text-sm">{item.price} L</span>
                                </div>
                            </div>
                        ))}
                   </div>
               </div>
          )}

      </div>

      {/* Right Area: Order Summary */}
      <div className="w-96 bg-white rounded-2xl shadow-sm flex flex-col border border-slate-200">
           {/* ... Order Summary Header ... */}
           <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div>
                   <h2 className="text-lg font-bold text-slate-800">{selectedTableId ? (selectedTableId < 0 ? `Drive Thru L${Math.abs(selectedTableId)}` : `Masa ${selectedTableId}`) : 'Comanda'}</h2>
                   {activeOrderForSelectedTable && <p className="text-slate-400 text-xs font-mono">ORD-{activeOrderForSelectedTable.id.slice(-6)}</p>}
               </div>
               <div className="flex gap-1">
                   {selectedTableId && selectedTableId > 0 && (
                       <button onClick={() => setIsTransferModalOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Transfer Masa">
                           <MoveRight size={18}/>
                       </button>
                   )}
                   <button onClick={() => setIsLinkClientModalOpen(true)} className={`p-2 rounded-lg transition-all ${linkedClient ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title="Asociaza Client">
                       <UserPlus size={18}/>
                   </button>
               </div>
           </div>
           {/* ... Items List ... */}
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {activeOrderForSelectedTable?.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-start py-1 text-sm">
                       <div><span className="font-bold">{item.quantity}x</span> {item.name}</div>
                       <div className="font-bold text-slate-500">{(item.price * item.quantity).toFixed(2)}</div>
                   </div>
               ))}
               {currentOrderItems.length > 0 && <div className="border-t my-2 pt-2 text-xs font-bold text-slate-400 uppercase">Noi</div>}
               {currentOrderItems.map((item, idx) => (
                   <div key={`new-${idx}`} className="flex justify-between items-start py-1 text-sm font-bold text-slate-800">
                       <div>
                           {item.quantity}x {item.name}
                           <button onClick={() => removeFromCart(idx)} className="ml-2 text-red-500"><Minus size={12}/></button>
                       </div>
                       <div>{(item.price * item.quantity).toFixed(2)}</div>
                   </div>
               ))}
           </div>
           {/* ... Footer Actions ... */}
           <div className="p-4 bg-slate-50 border-t border-slate-100">
               {activePromo && (
                   <div className="flex justify-between items-center mb-2 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                       <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                           <Sparkles size={14}/> {activePromo.name}
                       </div>
                       <span className="text-amber-700 font-bold text-xs">-{activePromo.discount}%</span>
                   </div>
               )}
               <div className="flex justify-between items-center mb-4">
                   <span className="text-slate-500 font-medium text-sm">Total</span>
                   <span className="text-2xl font-bold text-slate-800">{(remainingToPay + currentTotal).toFixed(2)} RON</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                   {currentOrderItems.length > 0 ? (
                       <button onClick={submitOrder} className="col-span-2 w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                           <Send size={18}/> Trimite (F9)
                       </button>
                   ) : (
                       <button onClick={() => handleOpenPayment(remainingToPay)} className="col-span-2 bg-emerald-500 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 flex items-center justify-center gap-2">
                           <Euro size={18}/> Incasare (F4)
                       </button>
                   )}
               </div>
           </div>
      </div>
      
      {/* Modals */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Incasare</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl text-center">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total de Plata</p>
                <h2 className="text-4xl font-black">{(paymentAmount - discountAmount + tipAmount).toFixed(2)} <span className="text-xl font-normal opacity-60">RON</span></h2>
                {discountAmount > 0 && <p className="text-emerald-400 text-sm mt-2 font-bold">Discount Aplicat: -{discountAmount.toFixed(2)} L</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFinalPayment(PaymentMethod.CASH)} className="flex flex-col items-center justify-center p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all group">
                  <Banknote className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" size={32}/>
                  <span className="font-bold text-emerald-800">Numerar</span>
                </button>
                <button onClick={() => handleFinalPayment(PaymentMethod.CARD)} className="flex flex-col items-center justify-center p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 transition-all group">
                  <CreditCard className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={32}/>
                  <span className="font-bold text-blue-800">Card</span>
                </button>
                <button onClick={() => handleFinalPayment(PaymentMethod.VOUCHER)} className="flex flex-col items-center justify-center p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all group">
                  <Ticket className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" size={32}/>
                  <span className="font-bold text-purple-800">Voucher</span>
                </button>
                <button onClick={() => handleFinalPayment(PaymentMethod.GIFT_CARD)} className="flex flex-col items-center justify-center p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl hover:bg-amber-100 transition-all group">
                  <Gift className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" size={32}/>
                  <span className="font-bold text-amber-800">Gift Card</span>
                </button>
              </div>

              {/* Tip Selection */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bacsis (Tip)</p>
                <div className="flex gap-2">
                  {[0, 5, 10, 15].map(percent => (
                    <button 
                      key={percent} 
                      onClick={() => setTipAmount(paymentAmount * (percent / 100))}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${tipAmount === paymentAmount * (percent / 100) ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {percent}%
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      placeholder="Suma" 
                      className="w-full py-2 px-3 bg-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-slate-800"
                      onChange={(e) => setTipAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsSplitModalOpen(true)} className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Split size={18}/> Divide Nota
                </button>
                <button onClick={() => setIsProformaModalOpen(true)} className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Receipt size={18}/> Proforma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSplitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Divide Nota</h3>
              <button onClick={() => setIsSplitModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <button onClick={() => setSplitMode('equal')} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${splitMode === 'equal' ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>Egal</button>
                  <button onClick={() => setSplitMode('items')} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${splitMode === 'items' ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>Produse</button>
                  <button onClick={() => setSplitMode('seats')} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${splitMode === 'seats' ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>Locuri</button>
                </div>

                {splitMode === 'equal' && (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">Numar Persoane</p>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"><Minus/></button>
                      <span className="text-3xl font-black text-slate-800 w-12 text-center">{splitCount}</span>
                      <button onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"><Plus/></button>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Suma per persoana</p>
                      <p className="text-2xl font-black text-emerald-700">{(remainingToPay / splitCount).toFixed(2)} L</p>
                    </div>
                  </div>
                )}

                {splitMode === 'seats' && (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">Selecteaza Locul</p>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({length: seatCount}).map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedSplitSeat(i + 1)}
                          className={`py-3 rounded-xl font-bold transition-all ${selectedSplitSeat === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          L{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col h-[400px]">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt size={18}/> Sumar Selectie</h4>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {splitMode === 'items' ? (
                    activeOrderForSelectedTable?.items.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => toggleSplitItem(idx)}
                        className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all ${selectedSplitItems.includes(idx) ? 'bg-white border-indigo-500 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50'}`}
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.quantity}x {item.price} L</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedSplitItems.includes(idx) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                          {selectedSplitItems.includes(idx) && <Check size={14}/>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8">
                      <Info size={48} className="mb-4 opacity-20"/>
                      <p className="text-sm font-medium">Suma va fi calculata automat pe baza modului de divizare selectat.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-500">Total Selectat</span>
                    <span className="text-2xl font-black text-slate-800">{calculateSplitAmount().toFixed(2)} L</span>
                  </div>
                  <button 
                    onClick={() => { setPaymentAmount(calculateSplitAmount()); setIsSplitModalOpen(false); }}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200"
                  >
                    Confirma Selectia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUpsellModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300">
             <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="text-amber-600" size={40}/>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Sugestii Inteligente</h3>
                  <p className="text-slate-500 mt-2">Am observat ca lipsesc bauturile sau desertul. Recomanzi ceva?</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {upsellSuggestions.map(item => (
                    <button key={item.id} onClick={() => handleUpsellAdd(item)} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-amber-500 hover:bg-amber-50 transition-all group">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {item.category === ProductCategory.DRINKS ? <Coffee className="text-blue-500"/> : <IceCream className="text-pink-500"/>}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.price} L</p>
                      </div>
                      <Plus className="text-slate-300 group-hover:text-amber-600"/>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleUpsellDecline} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">Nu, multumesc</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {selectedItemForModifiers && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedItemForModifiers.name}</h3>
                <p className="text-sm text-slate-500">Personalizeaza produsul</p>
              </div>
              <button onClick={() => setSelectedItemForModifiers(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {selectedItemForModifiers.modifiers?.map(group => (
                <div key={group.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                      {group.name}
                      {group.minSelection > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Obligatoriu</span>}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">Selecteaza {group.minSelection === group.maxSelection ? group.minSelection : `${group.minSelection}-${group.maxSelection}`}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {group.options.map(option => {
                      const isSelected = selectedModifiers[group.id]?.some(o => o.id === option.id);
                      return (
                        <button 
                          key={option.id} 
                          onClick={() => toggleModifier(group, option)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                          <p className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{option.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{option.price > 0 ? `+${option.price} L` : 'Gratuit'}</p>
                          {isSelected && <div className="absolute top-2 right-2 text-indigo-500"><CheckCircle size={16}/></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setSelectedItemForModifiers(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-2xl border-2 border-transparent transition-all">Anuleaza</button>
              <button onClick={confirmModifiers} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all">Adauga in Comanda</button>
            </div>
          </div>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Transfer / Unire Masa</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">{selectedTableId}</div>
                <MoveRight className="text-blue-400"/>
                <div className="text-sm font-medium text-blue-800">Selecteaza masa de destinatie pentru a muta sau uni comenzile.</div>
              </div>
              <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2 no-scrollbar">
                {tables.filter(t => t.id !== selectedTableId).map(table => (
                  <button 
                    key={table.id} 
                    onClick={() => handleTransferTable(table.id)}
                    className="aspect-square rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center group"
                  >
                    <span className="text-xl font-black text-slate-800 group-hover:scale-110 transition-transform">{table.id}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">{table.occupied ? 'Unire' : 'Liber'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLinkClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Asociaza Client</h3>
              <button onClick={() => setIsLinkClientModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  placeholder="Cauta dupa telefon..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                  value={clientSearchPhone}
                  onChange={(e) => handleLinkClientSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {linkedClient ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200 animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                      {linkedClient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800">{linkedClient.name}</h4>
                      <p className="text-emerald-600 font-bold text-sm">{linkedClient.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Membru Loyalty</span>
                        <span className="text-[10px] font-bold text-slate-400">{linkedClient.ordersCount} comenzi</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={confirmLinkClient} className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                    Asociaza la Comanda
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <UserPlus size={48} className="mx-auto mb-4 opacity-20"/>
                  <p className="font-medium">Introdu numarul de telefon pentru a gasi clientul in baza de date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isVoidModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-red-50">
              <h3 className="text-xl font-bold text-red-800 flex items-center gap-2"><AlertOctagon size={24}/> Stergere Produs (VOID)</h3>
              <button onClick={() => setIsVoidModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-400"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Produs selectat</p>
                <p className="text-lg font-black text-slate-800">{itemToVoid?.name}</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase">Motiv Stergere</label>
                <select 
                  className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                >
                  <option>Gresala Operare</option>
                  <option>Clientul s-a razgandit</option>
                  <option>Calitate Neadecvata</option>
                  <option>Intarziere prea mare</option>
                  <option>Altele (Manager)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  checked={returnStock}
                  onChange={(e) => setReturnStock(e.target.checked)}
                />
                <span className="font-bold text-slate-700">Returneaza ingredientele in stoc</span>
              </label>

              <button onClick={handleVoidConfirm} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 shadow-xl shadow-red-100 transition-all">
                Confirma Stergerea
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagerAuthOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LockKeyhole className="text-red-600" size={40}/>
            </div>
            <h3 className="text-2xl font-black text-slate-800">Autorizare Manager</h3>
            <p className="text-slate-500 mt-2">Aceasta actiune necesita aprobarea unui manager.</p>
            
            <div className="mt-8 space-y-6">
              <div className="flex justify-center gap-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${managerPin.length > i ? 'bg-slate-800 border-slate-800 scale-125' : 'bg-transparent border-slate-300'}`}></div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button 
                    key={n} 
                    onClick={() => managerPin.length < 4 && setManagerPin(prev => prev + n)}
                    className="h-16 rounded-2xl bg-slate-100 text-xl font-black hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    {n}
                  </button>
                ))}
                <button onClick={() => setManagerPin('')} className="h-16 rounded-2xl text-red-500 font-black hover:bg-red-50 active:scale-95 transition-all">C</button>
                <button onClick={() => managerPin.length < 4 && setManagerPin(prev => prev + '0')} className="h-16 rounded-2xl bg-slate-100 text-xl font-black hover:bg-slate-200 active:scale-95 transition-all">0</button>
                <button onClick={handleManagerAuth} className="h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100"><Check size={24}/></button>
              </div>
            </div>
            
            <button onClick={() => setIsManagerAuthOpen(false)} className="mt-8 text-slate-400 font-bold hover:text-slate-600">Anuleaza</button>
          </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      {receiptToPrint && (
        <div className="hidden print:block p-8 font-mono text-sm w-[80mm] bg-white">
          <div className="text-center mb-6">
            <h1 className="text-xl font-black uppercase tracking-tighter">HorecaAI POS</h1>
            <p className="text-xs">Strada Exemplu Nr. 1, Bucuresti</p>
            <p className="text-xs">CIF: RO12345678 | Reg. Com: J40/123/2023</p>
            <div className="my-4 border-t border-dashed border-slate-300"></div>
            <h2 className="font-bold uppercase">{isProformaModalOpen ? 'NOTA DE PLATA (PROFORMA)' : 'BON FISCAL'}</h2>
            <p className="text-xs">Masa: {receiptToPrint.tableId} | Ospatar: {user?.name}</p>
            <p className="text-xs">Data: {new Date().toLocaleString()}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b border-dashed pb-1 mb-1">
              <span>Produs</span>
              <span>Total</span>
            </div>
            {receiptToPrint.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <p>{item.quantity}x {item.name}</p>
                  {item.selectedModifiers?.map((m, mi) => (
                    <p key={mi} className="text-[10px] pl-2">+ {m.name}</p>
                  ))}
                </div>
                <span>{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-slate-300"></div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-lg font-black">
              <span>TOTAL</span>
              <span>{receiptToPrint.total.toFixed(2)} L</span>
            </div>
            {receiptToPrint.splitBill && (
              <div className="flex justify-between text-xs italic">
                <span>Suma Platita (Partial)</span>
                <span>{(receiptToPrint.total - receiptToPrint.splitBill.remainingAmount).toFixed(2)} L</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-[10px] space-y-1">
            <p className="font-bold">Defalcare TVA:</p>
            {Object.entries(calculateVatBreakdown(receiptToPrint)).map(([rate, vals]) => (
              <div key={rate} className="flex justify-between">
                <span>Cota {rate}%:</span>
                <span>Baza: {vals.base.toFixed(2)} | TVA: {vals.vat.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-bold">Va multumim!</p>
            <p className="text-[10px]">Software powered by HorecaAI</p>
            <div className="mt-4 flex justify-center">
               {/* Placeholder for QR Code */}
               <div className="w-24 h-24 border-2 border-slate-200 flex items-center justify-center text-[8px] text-slate-400 text-center p-2">
                 QR CODE<br/>FEEDBACK & LOYALTY
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
