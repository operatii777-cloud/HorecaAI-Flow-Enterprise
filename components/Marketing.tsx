
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Voucher, Promotion } from '../types';
import { ApiService } from '../services/api';
import { Tag, Calendar, Plus, Trophy, X, Clock, Check } from 'lucide-react';

export const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'promos'>('vouchers');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  
  const [promoForm, setPromoForm] = useState({
      name: '',
      type: 'happy_hour',
      discountPercent: 10,
      startHour: 12,
      endHour: 18,
      days: [] as number[]
  });
  
  const refreshData = async () => {
    const [v, p] = await Promise.all([
        ApiService.getVouchers(),
        ApiService.getPromotions()
    ]);
    setVouchers(v);
    setPromos(p);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateVoucher = async () => {
    const code = prompt("Introdu cod voucher (ex: SUMMER20):");
    if (!code) return;
    const val = Number(prompt("Valoare procentuala (ex: 20):"));
    if (!val) return;

    await ApiService.createVoucher({
        id: Date.now().toString(),
        code: code.toUpperCase(),
        type: 'percent',
        value: val,
        active: true,
        maxUses: 100,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
    });
    refreshData();
  };

  const handleCreatePromo = async () => {
      if(!promoForm.name) return alert("Nume obligatoriu");
      await ApiService.createPromotion({
          id: Date.now().toString(),
          name: promoForm.name,
          type: promoForm.type as 'happy_hour' | 'daily_special',
          discountPercent: promoForm.discountPercent,
          active: true,
          startHour: promoForm.startHour,
          endHour: promoForm.endHour,
          days: promoForm.days.length > 0 ? promoForm.days : [0,1,2,3,4,5,6]
      });
      refreshData();
      setIsPromoModalOpen(false);
  };

  const toggleDay = (dayIndex: number) => {
      setPromoForm(prev => {
          const exists = prev.days.includes(dayIndex);
          if (exists) return { ...prev, days: prev.days.filter(d => d !== dayIndex) };
          return { ...prev, days: [...prev.days, dayIndex] };
      });
  };

  const voucherDefs: ColDef<Voucher>[] = [
    { field: 'code', headerName: 'Cod Voucher', flex: 1, cellRenderer: (p: any) => <span className="font-mono font-bold text-slate-700">{p.value}</span> },
    { field: 'type', headerName: 'Tip', width: 100 },
    { field: 'value', headerName: 'Valoare', width: 100, valueFormatter: p => p.data?.type === 'percent' ? `-${p.value}%` : `-${p.value} RON` },
    { field: 'maxUses', headerName: 'Limita', width: 100 },
    { field: 'usedCount', headerName: 'Utilizari', width: 100 },
    { field: 'active', headerName: 'Activ', width: 100, cellRenderer: (p: any) => p.value ? '✅' : '❌' },
    { field: 'expiresAt', headerName: 'Expira', width: 150 }
  ];

  const promoDefs: ColDef<Promotion>[] = [
      { field: 'name', headerName: 'Nume Promotie', flex: 1 },
      { field: 'type', headerName: 'Tip', width: 150, cellRenderer: (p: any) => p.value === 'happy_hour' ? 'Happy Hour ⏰' : 'Oferta Ziua 📅' },
      { field: 'discountPercent', headerName: 'Discount', width: 100, valueFormatter: p => `${p.value}%` },
      { field: 'active', headerName: 'Status', width: 100, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold ${p.value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>
              {p.value ? 'ACTIV' : 'INACTIV'}
          </span>
      )},
      { headerName: 'Zile', width: 150, valueGetter: (p) => p.data?.days.length === 7 ? 'Zilnic' : p.data?.days.map((d: number) => ['D','L','M','M','J','V','S'][d]).join(', ') || '' }
  ];

  const daysOfWeek = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam'];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Marketing & Fidelizare</h2>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('vouchers')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'vouchers' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Tag size={18}/> Vouchere
                </button>
                <button onClick={() => setActiveTab('promos')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'promos' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Calendar size={18}/> Promotii
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ag-theme-quartz h-[500px]">
                {activeTab === 'vouchers' && <AgGridReact rowData={vouchers} columnDefs={voucherDefs} />}
                {activeTab === 'promos' && <AgGridReact rowData={promos} columnDefs={promoDefs} />}
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={24}/>
                        <h3 className="font-bold text-lg">Program Loialitate</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm font-medium opacity-90">
                            <span>Rata Acumulare</span>
                            <span>1 RON = 1 Pct</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium opacity-90">
                            <span>Valoare Punct</span>
                            <span>100 Pct = 5 RON</span>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-sm backdrop-blur-sm transition-colors">
                        Configureaza
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 mb-4">Actiuni Rapide</h3>
                    <button onClick={handleCreateVoucher} className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 mb-3">
                        <Plus size={18}/> Creeaza Voucher
                    </button>
                    <button onClick={() => setIsPromoModalOpen(true)} className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50">
                        <Plus size={18}/> Promotie Noua
                    </button>
                </div>
            </div>
        </div>

        {/* New Promotion Modal */}
        {isPromoModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Definire Campanie</h3>
                        <button onClick={() => setIsPromoModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Nume Campanie</label>
                            <input className="w-full border rounded-lg p-2.5 mt-1" value={promoForm.name} onChange={e => setPromoForm({...promoForm, name: e.target.value})} placeholder="ex: Happy Hour Joi"/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Tip</label>
                                <select className="w-full border rounded-lg p-2.5 mt-1" value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value})}>
                                    <option value="happy_hour">Happy Hour</option>
                                    <option value="daily_special">Oferta Zilei</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Discount (%)</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={promoForm.discountPercent} onChange={e => setPromoForm({...promoForm, discountPercent: Number(e.target.value)})}/>
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Zile Active</label>
                             <div className="flex justify-between gap-1">
                                 {daysOfWeek.map((day, idx) => {
                                     const isActive = promoForm.days.includes(idx);
                                     return (
                                         <button 
                                            key={day}
                                            onClick={() => toggleDay(idx)}
                                            className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
                                         >
                                             {day[0]}
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                             <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2"><Clock size={16}/> Interval Orar</h4>
                             <div className="flex gap-4 items-center">
                                 <input type="number" className="w-20 p-2 rounded border border-amber-200 text-center font-bold" value={promoForm.startHour} onChange={e => setPromoForm({...promoForm, startHour: Number(e.target.value)})}/>
                                 <span className="text-amber-400 font-bold">:00</span>
                                 <span className="text-slate-400">-</span>
                                 <input type="number" className="w-20 p-2 rounded border border-amber-200 text-center font-bold" value={promoForm.endHour} onChange={e => setPromoForm({...promoForm, endHour: Number(e.target.value)})}/>
                                 <span className="text-amber-400 font-bold">:00</span>
                             </div>
                        </div>

                        <button onClick={handleCreatePromo} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 mt-2">
                            <Check size={18}/> Activeaza Promotia
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
