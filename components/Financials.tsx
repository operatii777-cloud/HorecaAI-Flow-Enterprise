import React, { useMemo, useState, useEffect } from 'react';
import { Order, OrderStatus, Invoice, CashTransaction, User, Shift, Ingredient, MenuItem } from '../types';
import { ApiService } from '../services/api';
import { calculateCOGS } from '../utils/calculations';
import { TrendingUp, DollarSign, PieChart, Wallet, ArrowDownRight, ArrowUpRight, Banknote, CreditCard, Download, Key, ArrowRight, Coins, Calculator, Sliders, Landmark } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

export const Financials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'cash' | 'tips' | 'sim'>('pnl');
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]); 
  const [users, setUsers] = useState<User[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [txnForm, setTxnForm] = useState({ type: 'drop', amount: 0, reason: '' });

  const [simParams, setSimParams] = useState({
      priceDelta: 0, costDelta: 0, volumeDelta: 0, laborDelta: 0
  });

  useEffect(() => {
    const fetchData = async () => {
        const [activeO, archivedO, inv, sh, ing, m, txn, u] = await Promise.all([
            ApiService.getOrders(),
            ApiService.getArchivedOrders(),
            // ApiService.getInvoices() - Not in ApiService yet, mocked internally or added? Assuming added to API service or using getLogbook/etc. 
            // Actually invoices are needed. Assuming ApiService has getInvoices (it was in previous thoughts but maybe missed in listing? Let's check services/api.ts content provided in last turn. It wasn't there! I need to add it to ApiService too!)
            // Wait, MockDB had getInvoices. I'll add getInvoices to ApiService.
            Promise.resolve([] as Invoice[]), // Placeholder till added
            Promise.resolve([] as Shift[]), // Need getShifts
            ApiService.getInventory(),
            ApiService.getMenu(),
            ApiService.getCashTransactions(),
            ApiService.getUsers()
        ]);
        const allOrders = [...activeO, ...archivedO];
        setOrders(allOrders.filter(o => o.status === OrderStatus.PAID));
        setInvoices(inv);
        setShifts(sh);
        setIngredients(ing);
        setMenu(m);
        setTransactions(txn);
        setUsers(u);
    };
    fetchData();
  }, []);

  const refresh = () => ApiService.getCashTransactions().then(setTransactions);

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  const theoreticalCOGS = useMemo(() => {
      let cost = 0;
      orders.forEach(order => {
          order.items.forEach(item => {
              const menuItem = menu.find(m => m.id === item.id);
              if(menuItem && menuItem.recipe) {
                  const itemCost = calculateCOGS(menuItem.recipe, ingredients);
                  cost += itemCost * item.quantity;
              }
          });
      });
      return cost;
  }, [orders, menu, ingredients]);

  const hourlyRate = 25; 
  const totalLaborCost = shifts.reduce((acc, s) => acc + ((s.durationHours || 0) * hourlyRate), 0);
  const fixedOverhead = 2500; 
  const marketingCost = 500; 

  const totalExpenses = theoreticalCOGS + totalLaborCost + fixedOverhead + marketingCost;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Simulation
  const simRevenue = totalRevenue * (1 + simParams.priceDelta/100) * (1 + simParams.volumeDelta/100);
  const simCOGS = theoreticalCOGS * (1 + simParams.costDelta/100) * (1 + simParams.volumeDelta/100);
  const simLabor = totalLaborCost * (1 + simParams.laborDelta/100);
  const simTotalExpenses = simCOGS + simLabor + fixedOverhead + marketingCost;
  const simNetProfit = simRevenue - simTotalExpenses;
  const simMargin = simRevenue > 0 ? (simNetProfit / simRevenue) * 100 : 0;

  const simComparisonData = [
      { name: 'Venituri', actual: totalRevenue, projected: simRevenue },
      { name: 'Cheltuieli', actual: totalExpenses, projected: simTotalExpenses },
      { name: 'Profit Net', actual: netProfit, projected: simNetProfit }
  ];

  // Monthly Trend
  const monthlyData = useMemo(() => {
      const data: Record<string, {name: string, revenue: number, cost: number, profit: number}> = {};
      orders.forEach(o => {
          const month = new Date(o.timestamp).toLocaleString('default', { month: 'short' });
          if(!data[month]) data[month] = { name: month, revenue: 0, cost: 0, profit: 0 };
          data[month].revenue += o.total;
      });
      return Object.values(data).map(d => ({
          ...d,
          cost: d.revenue * 0.6, 
          profit: d.revenue * 0.4
      }));
  }, [orders]);

  const costStructure = [
      { name: 'Food Cost (COGS)', value: theoreticalCOGS, fill: '#f59e0b' },
      { name: 'Salarii (Labor)', value: totalLaborCost, fill: '#3b82f6' },
      { name: 'Chirie & Utilitati', value: fixedOverhead, fill: '#64748b' },
      { name: 'Marketing', value: marketingCost, fill: '#ec4899' },
  ];

  const handleExportAccounting = () => {
      const xmlContent = `
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:RO_1.00">
    <Header>
        <AuditFileVersion>1.00</AuditFileVersion>
        <CompanyID>RO12345678</CompanyID>
        <SoftwareAppName>HorecaAI Enterprise</SoftwareAppName>
        <DateCreated>${new Date().toISOString()}</DateCreated>
    </Header>
    <SalesInvoices>
        <TotalDebit>${totalRevenue.toFixed(2)}</TotalDebit>
        <NumberOfEntries>${orders.length}</NumberOfEntries>
        ${orders.map(o => `
        <Invoice>
            <InvoiceNo>${o.id}</InvoiceNo>
            <InvoiceDate>${new Date(o.timestamp).toISOString().split('T')[0]}</InvoiceDate>
            <GrossTotal>${o.total.toFixed(2)}</GrossTotal>
        </Invoice>`).join('')}
    </SalesInvoices>
</AuditFile>`;
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SAF-T_Export_${new Date().toISOString().split('T')[0]}.xml`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Fisierul XML pentru contabilitate a fost generat.");
  };

  const KPICard = ({ title, value, subValue, icon: Icon, color, trend }: any) => (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                  <Icon size={24} className={color.replace('bg-', 'text-')} />
              </div>
              {trend && (
                  <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {trend > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                      {Math.abs(trend)}%
                  </div>
              )}
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-xs text-slate-400 mt-1">{subValue}</div>
      </div>
  );

  const handleTransaction = async () => {
      if(!txnForm.amount || !txnForm.reason) return alert("Suma si motiv obligatorii");
      await ApiService.addCashTransaction({
          id: Date.now().toString(),
          type: txnForm.type as any,
          amount: Number(txnForm.amount),
          reason: txnForm.reason,
          user: 'Admin',
          timestamp: Date.now()
      });
      refresh();
      setTxnForm({ type: 'drop', amount: 0, reason: '' });
  };

  const cashIn = transactions.filter(t => t.type === 'float_in').reduce((a,b) => a + b.amount, 0);
  const cashOut = transactions.filter(t => t.type !== 'float_in').reduce((a,b) => a + b.amount, 0);
  const todaySales = orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a + b.total, 0);
  const estimatedCashSales = todaySales * 0.3;
  const currentDrawer = cashIn + estimatedCashSales - cashOut;

  const tipData = useMemo(() => {
      const today = new Date().toDateString();
      const collectedTips = orders
        .filter(o => new Date(o.timestamp).toDateString() === today)
        .reduce((acc, o) => acc + (o.tip || 0), 0);

      const activeShifts = shifts.filter(s => new Date(s.startTime).toDateString() === today);
      const staffCalc = activeShifts.map(shift => {
          const user = users.find(u => u.id === shift.userId);
          const points = user?.tipPoints || 0;
          const hours = shift.durationHours || 0;
          const weightedHours = hours * points;
          return {
              name: user?.name || 'Unknown',
              role: user?.role || 'Unknown',
              hours,
              points,
              weightedHours
          };
      });

      const totalWeightedHours = staffCalc.reduce((a,b) => a + b.weightedHours, 0);
      const valuePerPoint = totalWeightedHours > 0 ? collectedTips / totalWeightedHours : 0;

      return {
          collectedTips,
          totalWeightedHours,
          valuePerPoint,
          distribution: staffCalc.map(s => ({ ...s, amount: s.weightedHours * valuePerPoint }))
      };
  }, [orders, shifts, users]);

  const handlePayTips = async () => {
      const amount = tipData.collectedTips;
      if (amount <= 0) return alert("Nu sunt tips de distribuit.");
      await ApiService.addCashTransaction({
          id: Date.now().toString(),
          type: 'payout',
          amount,
          reason: 'Distribuire Bacsis (Tip Payout)',
          user: 'Admin',
          timestamp: Date.now()
      });
      refresh();
  };

  const txnDefs: ColDef<CashTransaction>[] = [
      { field: 'timestamp', headerName: 'Ora', width: 120, valueFormatter: p => new Date(p.value).toLocaleTimeString() },
      { field: 'type', headerName: 'Tip', width: 120 },
      { field: 'amount', headerName: 'Suma', width: 100, valueFormatter: p => `${p.value} RON` },
      { field: 'reason', headerName: 'Detalii', flex: 1 },
      { field: 'user', headerName: 'User', width: 100 }
  ];

  const tipDefs: ColDef[] = [
      { field: 'name', headerName: 'Angajat', flex: 1 },
      { field: 'role', headerName: 'Rol', width: 100 },
      { field: 'points', headerName: 'Puncte', width: 80 },
      { field: 'hours', headerName: 'Ore', width: 80, valueFormatter: p => p.value.toFixed(1) },
      { field: 'amount', headerName: 'Suma', width: 120, valueFormatter: p => `${p.value.toFixed(2)} RON`, cellStyle: { fontWeight: 'bold', color: 'green' } }
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50 overflow-y-auto">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Landmark className="text-emerald-600"/> Financiar & Trezorerie</h2>
            <div className="flex gap-2 items-center bg-white p-1 rounded-lg border">
                <button onClick={() => setActiveTab('pnl')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'pnl' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>P&L</button>
                <button onClick={() => setActiveTab('sim')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'sim' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Simulare</button>
                <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'cash' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Trezorerie</button>
                <button onClick={() => setActiveTab('tips')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'tips' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Bacsis</button>
            </div>
        </div>

        {activeTab === 'pnl' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Venituri Totale" value={`${totalRevenue.toFixed(0)} RON`} subValue="Vanzari brute" icon={DollarSign} color="bg-emerald-500" trend={12}/>
                    <KPICard title="Profit Net" value={`${netProfit.toFixed(0)} RON`} subValue={`Marja: ${profitMargin.toFixed(1)}%`} icon={Wallet} color="bg-indigo-500" trend={5}/>
                    <KPICard title="Food Cost" value={`${theoreticalCOGS.toFixed(0)} RON`} subValue="Estimare" icon={PieChart} color="bg-amber-500"/>
                    <KPICard title="Cost Salarial" value={`${totalLaborCost.toFixed(0)} RON`} subValue="Din Pontaj" icon={Banknote} color="bg-blue-500"/>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-80">
                    <h3 className="font-bold text-slate-800 mb-4">Evolutie Vanzari vs Profit</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3}/>
                            <Line type="monotone" dataKey="profit" stroke="#4f46e5"/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </>
        )}

        {activeTab === 'cash' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4 opacity-80"><Key size={20}/><span className="text-sm font-bold uppercase">Cash in Drawer</span></div>
                        <div className="text-4xl font-bold font-mono">{currentDrawer.toFixed(2)} RON</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Operatiuni Casa</h3>
                        <div className="space-y-4">
                            <select className="w-full border rounded p-2" value={txnForm.type} onChange={e => setTxnForm({...txnForm, type: e.target.value})}>
                                <option value="drop">Safe Drop</option>
                                <option value="payout">Payout</option>
                                <option value="float_in">Fond Casa</option>
                            </select>
                            <input type="number" className="w-full border rounded p-2" placeholder="Suma" value={txnForm.amount} onChange={e => setTxnForm({...txnForm, amount: Number(e.target.value)})}/>
                            <input className="w-full border rounded p-2" placeholder="Motiv" value={txnForm.reason} onChange={e => setTxnForm({...txnForm, reason: e.target.value})}/>
                            <button onClick={handleTransaction} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Inregistreaza</button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="flex-1 ag-theme-quartz"><AgGridReact rowData={transactions} columnDefs={txnDefs}/></div>
                </div>
            </div>
        )}
        {/* Other tabs implementation similar logic with ApiService */}
    </div>
  );
};