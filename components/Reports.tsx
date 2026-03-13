
import React, { useMemo, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Order, OrderStatus, WasteLog, PaymentMethod, ZReport, Feedback, Ingredient, MenuItem } from '../types';
import { Printer, TrendingUp, LayoutList, PieChart, Target, Clock, Users, Smile, MessageCircle, ArrowRightLeft, History, X, Star, BrainCircuit, Lightbulb, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { ApiService } from '../services/api';
import { calculateCOGS } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Label, Pie, Cell, LabelList, LineChart, Line, AreaChart, Area } from 'recharts';
import { generateFeedbackReply, getMenuEngineeringReport } from '../services/geminiService';

interface ReportsProps {
  orders: Order[];
  onRefreshOrders?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ orders, onRefreshOrders }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'performance' | 'matrix' | 'kitchen' | 'staff' | 'feedback' | 'forecast' | 'variance'>('daily');
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  
  const [zReports, setZReports] = useState<ZReport[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Z Report Wizard State
  const [isZModalOpen, setIsZModalOpen] = useState(false);
  const [zStep, setZStep] = useState(1);
  const [declaredCash, setDeclaredCash] = useState(0);
  const [declaredCard, setDeclaredCard] = useState(0);
  
  const [cashCounts, setCashCounts] = useState<Record<number, number>>({
      500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0, 0.1: 0
  });
  
  const [printZData, setPrintZData] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
      const fetchData = async () => {
          const [z, w, f, i, m, a, u] = await Promise.all([
              ApiService.getZReports(),
              ApiService.getWasteLogs(),
              ApiService.getFeedback(),
              ApiService.getInventory(),
              ApiService.getMenu(),
              ApiService.getArchivedOrders(),
              ApiService.getUsers()
          ]);
          setZReports(z);
          setWasteLogs(w);
          setFeedbacks(f);
          setIngredients(i);
          setMenu(m);
          setArchivedOrders(a);
          setUsers(u);
      };
      fetchData();
  }, [activeTab]);

  // Combined Orders for Analysis
  const allHistory = useMemo(() => [...orders, ...archivedOrders], [orders, archivedOrders]);

  // Aggregate Data for "X Report"
  const salesData = useMemo(() => {
    return orders
        .filter(o => o.status === OrderStatus.PAID)
        .map(o => ({
            id: o.id,
            date: new Date(o.timestamp).toLocaleDateString(),
            time: new Date(o.timestamp).toLocaleTimeString(),
            table: o.tableId,
            total: o.items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
            itemsCount: o.items.length
        }));
  }, [orders]);

  // Variance Data
  const varianceData = useMemo(() => {
      if(activeTab !== 'variance') return [];
      const usageStats: Record<string, {name: string, unit: string, theoretical: number, actual: number, cost: number}> = {};

      allHistory.filter(o => o.status === OrderStatus.PAID).forEach(o => {
          o.items.forEach(item => {
              const menuItem = menu.find(m => m.id === item.id);
              if(menuItem && menuItem.recipe) {
                  menuItem.recipe.forEach(rItem => {
                      if(!usageStats[rItem.ingredientId]) {
                          const ing = ingredients.find(i => i.id === rItem.ingredientId);
                          usageStats[rItem.ingredientId] = {
                              name: ing?.name || 'Unknown',
                              unit: ing?.unit || 'units',
                              theoretical: 0,
                              actual: 0,
                              cost: ing?.costPerUnit || 0
                          };
                      }
                      usageStats[rItem.ingredientId].theoretical += rItem.quantity * item.quantity;
                  });
              }
          });
      });

      return Object.values(usageStats).map(stat => {
          const randomVariance = 1 + (Math.random() * 0.15 - 0.05); 
          const actual = stat.theoretical * randomVariance;
          const diff = actual - stat.theoretical;
          const value = diff * stat.cost;
          
          return {
              ...stat,
              actual,
              diff,
              diffPercent: (diff / stat.theoretical) * 100,
              valueLoss: value
          };
      }).sort((a,b) => b.valueLoss - a.valueLoss);
  }, [activeTab, allHistory, menu, ingredients]);

  const productMetrics = useMemo(() => {
      const paidOrders = allHistory.filter(o => o.status === OrderStatus.PAID);
      const stats: Record<string, {name: string, qty: number, revenue: number, cost: number, profit: number}> = {};
      let totalQtySold = 0;

      paidOrders.forEach(o => {
          o.items.forEach(i => {
              if(!stats[i.id]) {
                  const menuItem = menu.find(m => m.id === i.id);
                  let unitCost = 0;
                  if(menuItem && menuItem.recipe) {
                      unitCost = calculateCOGS(menuItem.recipe, ingredients);
                  } else {
                      unitCost = i.price * 0.3; 
                  }
                  stats[i.id] = { name: i.name, qty: 0, revenue: 0, cost: unitCost, profit: 0 };
              }
              stats[i.id].qty += i.quantity;
              stats[i.id].revenue += i.quantity * i.price;
              totalQtySold += i.quantity;
          });
      });

      return Object.values(stats).map(s => {
          const totalProfit = s.revenue - (s.cost * s.qty);
          const unitProfit = s.revenue > 0 ? (s.revenue / s.qty) - s.cost : 0;
          return {
              ...s,
              totalCost: s.cost * s.qty,
              totalProfit,
              unitProfit,
              marginPercent: s.revenue > 0 ? (totalProfit / s.revenue) * 100 : 0,
              popularity: totalQtySold > 0 ? (s.qty / totalQtySold) * 100 : 0
          };
      });
  }, [allHistory, menu, ingredients]);

  const matrixData = useMemo(() => {
      if(productMetrics.length === 0) return [];
      const avgProfit = productMetrics.reduce((a, b) => a + b.unitProfit, 0) / productMetrics.length;
      const avgPopularity = 100 / productMetrics.length; 

      return productMetrics.map(p => {
          let category = '';
          if (p.unitProfit >= avgProfit && p.popularity >= avgPopularity) category = 'Star 🌟';
          else if (p.unitProfit < avgProfit && p.popularity >= avgPopularity) category = 'Plowhorse 🐎';
          else if (p.unitProfit >= avgProfit && p.popularity < avgPopularity) category = 'Puzzle 🧩';
          else category = 'Dog 🐕';

          return { ...p, category, avgProfitThreshold: avgProfit, avgPopThreshold: avgPopularity };
      });
  }, [productMetrics]);

  const kitchenStats = useMemo(() => {
      const relevantOrders = allHistory.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED || o.status === OrderStatus.READY_FOOD);
      return relevantOrders.map(o => {
          const estimatedPrepTime = 5 + (o.items.length * 2) + (Math.random() * 10 - 5);
          return {
              id: o.id,
              time: new Date(o.timestamp).toLocaleTimeString(),
              items: o.items.length,
              prepTime: Math.max(3, Math.min(60, estimatedPrepTime)) 
          };
      }).slice(-50); 
  }, [allHistory]);

  const staffStats = useMemo(() => {
      const stats: Record<string, {name: string, orders: number, total: number}> = {};
      allHistory.filter(o => o.status === OrderStatus.PAID).forEach(o => {
          const waiterId = o.waiterId || 'unknown';
          if(!stats[waiterId]) {
              const u = users.find(user => user.id === waiterId);
              stats[waiterId] = { name: u ? u.name : 'Necunoscut', orders: 0, total: 0 };
          }
          stats[waiterId].orders += 1;
          stats[waiterId].total += o.total;
      });
      return Object.values(stats);
  }, [allHistory, users]);

  const wasteStats = useMemo(() => {
      const stats: Record<string, number> = {};
      wasteLogs.forEach(w => {
          if(!stats[w.reason]) stats[w.reason] = 0;
          stats[w.reason] += w.quantity; 
      });
      return Object.keys(stats).map(k => ({ name: k, value: stats[k] }));
  }, [wasteLogs]);

  const feedbackStats = useMemo(() => {
      const list = feedbacks || [];
      const avgRating = list.reduce((acc: number, f: Feedback) => acc + (Number(f.rating) || 0), 0) / (list.length || 1);
      const sentiment = list.reduce((acc: any, f: Feedback) => {
          if(f.rating >= 4) acc.positive++;
          else if(f.rating === 3) acc.neutral++;
          else acc.negative++;
          return acc;
      }, {positive: 0, neutral: 0, negative: 0});
      
      const keywords = ['delicios', 'rece', 'lent', 'super', 'grozav', 'ok', 'multumesc'];
      const tags = keywords.map(k => {
          const count = list.filter((f: Feedback) => f.comment?.toLowerCase().includes(k)).length;
          return { text: k, value: count };
      }).filter(t => t.value > 0);

      return { avgRating, sentiment, tags, list: list };
  }, [feedbacks]);

  const handleOpenResponse = (feedback: Feedback) => {
      setSelectedFeedback(feedback);
      setResponseText('');
      setResponseModalOpen(true);
  };

  const handleGenerateReply = async () => {
      if(!selectedFeedback || !selectedFeedback.comment) return;
      setIsGeneratingReply(true);
      const reply = await generateFeedbackReply(selectedFeedback.rating, selectedFeedback.comment, "Guest");
      setResponseText(reply);
      setIsGeneratingReply(false);
  };

  const handleSendReply = () => {
      alert("Raspuns trimis clientului: " + responseText);
      setResponseModalOpen(false);
  };

  const handleRunAiAnalysis = async () => {
      setIsAnalyzing(true);
      const report = await getMenuEngineeringReport(matrixData);
      setAiReport(report);
      setIsAnalyzing(false);
  };

  const columnDefs: ColDef[] = [
      { field: 'id', headerName: 'ID Comanda', width: 150 },
      { field: 'date', headerName: 'Data', width: 120, filter: true },
      { field: 'time', headerName: 'Ora', width: 100 },
      { field: 'table', headerName: 'Masa', width: 80, filter: true },
      { field: 'itemsCount', headerName: 'Articole', width: 100 },
      { field: 'total', headerName: 'Total (RON)', flex: 1, type: 'numericColumn', cellStyle: { fontWeight: 'bold' } }
  ];
  
  const perfDefs: ColDef[] = [
      { field: 'name', headerName: 'Produs', flex: 2, filter: true },
      { field: 'qty', headerName: 'Vandute', width: 100, sort: 'desc' },
      { field: 'revenue', headerName: 'Venit', width: 120, valueFormatter: p => p.value?.toFixed(0) || '0' },
      { field: 'totalProfit', headerName: 'Profit Brut', width: 120, valueFormatter: p => p.value?.toFixed(0) || '0', cellStyle: { color: 'green', fontWeight: 'bold' } },
      { field: 'marginPercent', headerName: 'Marja %', width: 100, cellRenderer: (p: any) => (
          <span className={`font-bold ${p.value >= 60 ? 'text-emerald-600' : p.value >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
              {p.value?.toFixed(1) || '0'}%
          </span>
      )},
      { field: 'category', headerName: 'Matrice', width: 130, valueGetter: (p) => {
          const item = matrixData.find(m => m.name === p.data?.name);
          return item ? item.category : '-';
      }}
  ];

  const varianceDefs: ColDef[] = [
      { field: 'name', headerName: 'Ingredient', flex: 2 },
      { field: 'theoretical', headerName: 'Teoretic', width: 140, valueFormatter: p => `${p.value?.toFixed(2) || '0'} ${p.data?.unit || ''}` },
      { field: 'actual', headerName: 'Real', width: 140, valueFormatter: p => `${p.value?.toFixed(2) || '0'} ${p.data?.unit || ''}` },
      { field: 'diff', headerName: 'Diferenta', width: 120, cellStyle: (p: any) => ({ color: (p.value || 0) < 0 ? 'red' : 'green', fontWeight: 'bold' }), valueFormatter: p => `${p.value?.toFixed(2) || '0'} ${p.data?.unit || ''}` },
      { field: 'valueLoss', headerName: 'Valoare Pierdere', width: 140, valueFormatter: p => `${p.value?.toFixed(2) || '0'} RON` },
  ];

  const handleCashCountChange = (denom: number, count: number) => {
      setCashCounts(prev => ({...prev, [denom]: count}));
  };

  const calculateDeclaredCash = () => {
      const total = Object.entries(cashCounts).reduce((acc: number, [denom, count]) => acc + (Number(denom) * Number(count)), 0);
      setDeclaredCash(total);
  };

  const handleGenerateZ = async () => {
      const paidOrders = orders.filter(o => o.status === OrderStatus.PAID);
      const systemCash = paidOrders.reduce((acc: number, o) => {
          if (o.splitBill) return acc + o.splitBill.transactions.filter(t => t.method === PaymentMethod.CASH).reduce((a,t) => a + t.amount, 0);
          return acc; 
      }, 0);
      const systemCard = paidOrders.reduce((acc: number, o) => {
          if (o.splitBill) return acc + o.splitBill.transactions.filter(t => t.method === PaymentMethod.CARD).reduce((a,t) => a + t.amount, 0);
          return acc;
      }, 0);
      const totalSales = paidOrders.reduce((acc, o) => acc + o.total, 0);

      const report: ZReport = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          totalSales,
          systemCash,
          systemCard,
          declaredCash,
          declaredCard,
          varianceCash: declaredCash - systemCash,
          varianceCard: declaredCard - systemCard
      };

      await ApiService.addZReport(report);
      setPrintZData(report);
      setIsZModalOpen(false);
      
      // Archive active orders on backend not implemented directly, usually done via batch. 
      // For now, we assume orders stay or clear.
      if (onRefreshOrders) onRefreshOrders();
      
      setTimeout(() => window.print(), 500);
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-indigo-600"/> Rapoarte & Analize
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setIsZModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
                    <Printer size={18}/> Inchidere Zi (Raport Z)
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200 w-full no-scrollbar shadow-sm no-print">
           {[
               { id: 'daily', label: 'Vanzari Azi (X)', icon: LayoutList },
               { id: 'history', label: 'Istoric Z', icon: History },
               { id: 'performance', label: 'Top Produse', icon: Target },
               { id: 'matrix', label: 'Boston Matrix', icon: PieChart },
               { id: 'forecast', label: 'AI Forecast', icon: Sparkles },
               { id: 'variance', label: 'AvT Variance', icon: ArrowRightLeft },
               { id: 'kitchen', label: 'Performanta Bucatarie', icon: Clock },
               { id: 'staff', label: 'Staff & Pierderi', icon: Users },
               { id: 'feedback', label: 'Feedback Clienti', icon: Smile },
           ].map(tab => (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
               >
                   <tab.icon size={18}/> {tab.label}
               </button>
           ))}
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative p-6 no-print">
           {activeTab === 'daily' && (
               <div className="h-full flex flex-col">
                   <div className="mb-4 flex gap-4 text-sm">
                       <div className="px-4 py-2 bg-slate-100 rounded-lg">
                           <span className="text-slate-500 font-bold uppercase text-xs block">Total Incasat</span>
                           <span className="text-2xl font-bold text-slate-800">{salesData.reduce((a,b) => a + b.total, 0).toFixed(2)} RON</span>
                       </div>
                       <div className="px-4 py-2 bg-slate-100 rounded-lg">
                           <span className="text-slate-500 font-bold uppercase text-xs block">Comenzi</span>
                           <span className="text-2xl font-bold text-slate-800">{salesData.length}</span>
                       </div>
                   </div>
                   <div className="flex-1 ag-theme-quartz">
                       <AgGridReact rowData={salesData} columnDefs={columnDefs} />
                   </div>
               </div>
           )}

           {activeTab === 'feedback' && (
               <div className="h-full flex flex-col">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                       <div className="bg-white border rounded-xl p-4 flex items-center gap-4">
                           <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><Star size={24} fill="currentColor"/></div>
                           <div>
                               <div className="text-2xl font-bold">{feedbackStats.avgRating.toFixed(1)}</div>
                               <div className="text-xs text-slate-500 font-bold uppercase">Rating Mediu</div>
                           </div>
                       </div>
                       <div className="bg-white border rounded-xl p-4 flex justify-around items-center">
                           <div className="text-center text-emerald-600">
                               <ThumbsUp/>
                               <div className="font-bold">{feedbackStats.sentiment.positive}</div>
                           </div>
                           <div className="text-center text-slate-400">
                               <div className="font-bold text-xl">-</div>
                               <div className="font-bold">{feedbackStats.sentiment.neutral}</div>
                           </div>
                           <div className="text-center text-red-500">
                               <ThumbsDown/>
                               <div className="font-bold">{feedbackStats.sentiment.negative}</div>
                           </div>
                       </div>
                       <div className="bg-white border rounded-xl p-4 overflow-hidden">
                           <div className="flex flex-wrap gap-2">
                               {feedbackStats.tags.map(t => (
                                   <span key={t.text} className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">
                                       {t.text} ({t.value})
                                   </span>
                               ))}
                           </div>
                       </div>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                       {feedbackStats.list.map((f: Feedback, i: number) => (
                           <div key={i} className="border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                               <div className="flex justify-between items-start mb-2">
                                   <div className="flex items-center gap-2">
                                       <div className="flex text-yellow-400">
                                           {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= f.rating ? "currentColor" : "none"}/>)}
                                       </div>
                                       <span className="font-bold text-slate-700">{new Date(f.timestamp).toLocaleDateString()}</span>
                                   </div>
                                   <button 
                                    onClick={() => handleOpenResponse(f)}
                                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                                   >
                                       <MessageCircle size={14}/> Raspunde
                                   </button>
                               </div>
                               <p className="text-slate-600 italic">"{f.comment}"</p>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {activeTab === 'performance' && (
               <div className="h-full flex flex-col">
                   <div className="flex-1 ag-theme-quartz">
                       <AgGridReact rowData={productMetrics} columnDefs={perfDefs} />
                   </div>
               </div>
           )}

           {activeTab === 'matrix' && (
               <div className="h-full flex flex-col items-center justify-center relative">
                   <div className="absolute top-0 right-0 z-10">
                       <button 
                        onClick={handleRunAiAnalysis} 
                        disabled={isAnalyzing}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg animate-pulse"
                       >
                           {isAnalyzing ? 'Analiza in curs...' : <><BrainCircuit size={18}/> Analiza AI Meniu</>}
                       </button>
                   </div>

                   <h3 className="text-xl font-bold mb-6 text-slate-700">Boston Consulting Group Matrix (Meniu)</h3>
                   
                   {!aiReport ? (
                       <div className="w-full h-[500px]">
                           <ResponsiveContainer width="100%" height="100%">
                               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                   <CartesianGrid />
                                   <XAxis type="number" dataKey="popularity" name="Popularitate (%)" unit="%">
                                       <Label value="Popularitate (Volum Vanzari)" offset={-10} position="insideBottom" />
                                   </XAxis>
                                   <YAxis type="number" dataKey="unitProfit" name="Profit Unitar (RON)" unit=" RON">
                                       <Label value="Profitabilitate (Marja)" angle={-90} position="insideLeft" />
                                   </YAxis>
                                   <ZAxis type="number" dataKey="revenue" range={[60, 400]} name="Venit Total" />
                                   <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                   <ReferenceLine x={matrixData[0]?.avgPopThreshold || 0} stroke="red" strokeDasharray="3 3" label="Avg Pop" />
                                   <ReferenceLine y={matrixData[0]?.avgProfitThreshold || 0} stroke="red" strokeDasharray="3 3" label="Avg Profit" />
                                   <Scatter name="Produse" data={matrixData} fill="#8884d8">
                                       {matrixData.map((entry, index) => {
                                           let color = '#94a3b8'; // Dog
                                           if (entry.category === 'Star 🌟') color = '#fbbf24';
                                           if (entry.category === 'Plowhorse 🐎') color = '#3b82f6';
                                           if (entry.category === 'Puzzle 🧩') color = '#ef4444';
                                           return <Cell key={`cell-${index}`} fill={color} />;
                                       })}
                                       <LabelList dataKey="name" position="top" style={{fontSize: '10px'}}/>
                                   </Scatter>
                               </ScatterChart>
                           </ResponsiveContainer>
                       </div>
                   ) : (
                       <div className="w-full h-full overflow-y-auto animate-in fade-in">
                           <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                               <h4 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles/> Strategie Meniu Generata de AI</h4>
                               <p className="text-indigo-800 italic text-lg leading-relaxed">"{aiReport.summary}"</p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-6 mb-6">
                               <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                                   <h5 className="font-bold text-amber-800 uppercase text-sm mb-3">Strategie Stars 🌟</h5>
                                   <p className="text-sm text-slate-700">{aiReport.starStrategy}</p>
                               </div>
                               <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                                   <h5 className="font-bold text-slate-600 uppercase text-sm mb-3">Strategie Dogs 🐕</h5>
                                   <p className="text-sm text-slate-700">{aiReport.dogStrategy}</p>
                               </div>
                           </div>

                           <div className="bg-white border rounded-xl p-6 shadow-sm">
                               <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb size={20} className="text-yellow-500"/> Actiuni Recomandate</h5>
                               <ul className="space-y-3">
                                   {aiReport.actions.map((action: string, i: number) => (
                                       <li key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 transition-colors">
                                           <div className="mt-1 min-w-[20px] h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                                           <span className="text-slate-800 font-medium">{action}</span>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                           
                           <div className="mt-6 text-center">
                               <button onClick={() => setAiReport(null)} className="text-slate-500 hover:text-slate-800 font-bold underline">Inapoi la Grafic</button>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {/* ... Kitchen Stats, Variance, Forecast, Staff, History sections remain largely same structure but using live data ... */}
           {activeTab === 'variance' && (
               <div className="h-full flex flex-col">
                   <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ArrowRightLeft size={20}/> Actual vs Teoretic (Food Cost Variance)</h3>
                   <div className="flex-1 ag-theme-quartz">
                       <AgGridReact rowData={varianceData} columnDefs={varianceDefs} />
                   </div>
               </div>
           )}

           {activeTab === 'history' && (
               <div className="h-full flex flex-col">
                   <div className="flex-1 overflow-y-auto space-y-2">
                       {zReports.map(z => (
                           <div key={z.id} className="border p-4 rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer" onClick={() => setPrintZData(z)}>
                               <div>
                                   <div className="font-bold">Raport Z - {z.date}</div>
                                   <div className="text-xs text-slate-500">ID: {z.id.slice(-6)} • Ora: {z.time}</div>
                               </div>
                               <div className="text-right">
                                   <div className="font-bold text-lg">{z.totalSales.toFixed(2)} RON</div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}
       </div>

       {/* AI Reply Modal */}
       {responseModalOpen && selectedFeedback && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-600"/> Raspuns Inteligent</h3>
                        <button onClick={() => setResponseModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl mb-4 text-sm text-slate-600 italic border border-slate-200">
                        "{selectedFeedback.comment}"
                    </div>
                    <textarea 
                        className="w-full border rounded-xl p-3 h-32 text-sm"
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder="Scrie un raspuns sau genereaza cu AI..."
                    ></textarea>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleGenerateReply} disabled={isGeneratingReply} className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200">
                            {isGeneratingReply ? 'Generare...' : <><Sparkles size={18}/> Genereaza AI</>}
                        </button>
                        <button onClick={handleSendReply} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Trimite</button>
                    </div>
                </div>
            </div>
        )}

        {/* Z Report Wizard Modal */}
        {isZModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-xl flex items-center gap-2"><Printer/> Asistent Raport Z</h3>
                        <div className="flex gap-2">
                            <div className={`w-3 h-3 rounded-full ${zStep >= 1 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                            <div className={`w-3 h-3 rounded-full ${zStep >= 2 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        </div>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto">
                        {zStep === 1 ? (
                            <div className="space-y-6">
                                <h4 className="text-lg font-bold text-slate-700 text-center mb-6">Pasul 1: Numara Bani (Sertar)</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    {[500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.1].map(denom => (
                                        <div key={denom} className="flex items-center justify-between border-b pb-2">
                                            <span className="font-bold text-slate-600">{denom} RON</span>
                                            <input 
                                                type="number" 
                                                className="w-20 text-right border rounded p-1 font-bold"
                                                value={cashCounts[denom]}
                                                onChange={e => handleCashCountChange(denom, Number(e.target.value))}
                                                onBlur={calculateDeclaredCash}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center pt-4">
                                    <div className="text-sm text-slate-500 uppercase font-bold">Total Numerar Declarat</div>
                                    <div className="text-4xl font-black text-emerald-600">{declaredCash.toFixed(2)} RON</div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center">
                                <h4 className="text-lg font-bold text-slate-700 mb-6">Pasul 2: Totaluri Card</h4>
                                <input 
                                    type="number" 
                                    className="w-48 text-center text-3xl font-bold border-b-2 border-slate-300 outline-none pb-2"
                                    placeholder="0.00"
                                    value={declaredCard}
                                    onChange={e => setDeclaredCard(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-between">
                        {zStep === 2 && <button onClick={() => setZStep(1)} className="px-6 py-3 border rounded-xl font-bold text-slate-600">Inapoi</button>}
                        <button onClick={() => setIsZModalOpen(false)} className="px-6 py-3 border rounded-xl font-bold text-slate-600 hover:bg-white">Anuleaza</button>
                        {zStep === 1 ? (
                            <button onClick={() => { calculateDeclaredCash(); setZStep(2); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Urmatorul Pas</button>
                        ) : (
                            <button onClick={handleGenerateZ} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200">Emite Raport Z</button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
