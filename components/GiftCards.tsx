
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { GiftCard } from '../types';
import { ApiService } from '../services/api';
import { Gift, Plus, CreditCard, X } from 'lucide-react';

export const GiftCards: React.FC = () => {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      balance: 100,
      email: '',
      name: ''
  });

  useEffect(() => {
      const load = async () => {
          setCards(await ApiService.getGiftCards());
      };
      load();
  }, []);

  const handleIssueCard = async () => {
      if(!formData.balance) return alert("Suma obligatorie.");
      
      const code = `GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const newCard: GiftCard = {
          id: Date.now().toString(),
          code,
          initialBalance: formData.balance,
          currentBalance: formData.balance,
          issuedDate: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 31536000000).toISOString(), // 1 year
          active: true,
          purchaserName: formData.name,
          recipientEmail: formData.email
      };
      
      await ApiService.addGiftCard(newCard);
      await ApiService.addCashTransaction({
          id: Date.now().toString(),
          type: 'float_in',
          amount: formData.balance,
          reason: `Gift Card Sale ${code}`,
          user: 'Admin',
          timestamp: Date.now()
      });
      
      setCards(await ApiService.getGiftCards());
      setIsModalOpen(false);
      alert(`Gift Card ${code} emis cu succes!`);
  };

  const defs: ColDef<GiftCard>[] = [
      { field: 'code', headerName: 'Cod Card', flex: 1, cellRenderer: (p: any) => <span className="font-mono font-bold text-slate-700">{p.value}</span> },
      { field: 'currentBalance', headerName: 'Balanta', width: 120, valueFormatter: p => `${p.value} RON`, cellStyle: { fontWeight: 'bold', color: 'green' } },
      { field: 'initialBalance', headerName: 'Initial', width: 120, valueFormatter: p => `${p.value} RON` },
      { field: 'issuedDate', headerName: 'Data Emiterii', width: 150, valueFormatter: p => new Date(p.value).toLocaleDateString() },
      { field: 'purchaserName', headerName: 'Cumparator', width: 150 },
      { field: 'active', headerName: 'Status', width: 100, cellRenderer: (p: any) => p.value ? '✅ Activ' : '❌ Inactiv' }
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Gift className="text-purple-600"/> Gift Cards
                </h2>
                <p className="text-slate-500 text-sm">Emite si gestioneaza carduri cadou.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
                <Plus size={18}/> Emite Card Nou
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Total Emis (Liability)</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                    {cards.reduce((acc, c) => acc + c.currentBalance, 0).toFixed(2)} RON
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Carduri Active</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">
                    {cards.filter(c => c.active && c.currentBalance > 0).length}
                </div>
            </div>
        </div>

        <div className="flex-1 ag-theme-quartz shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white">
            <AgGridReact rowData={cards} columnDefs={defs} pagination={true} paginationPageSize={15} />
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard/> Vanzare Gift Card</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Valoare (RON)</label>
                            <div className="flex gap-2 mt-1">
                                {[50, 100, 200, 500].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setFormData({...formData, balance: val})}
                                        className={`flex-1 py-2 border rounded-lg font-bold ${formData.balance === val ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600'}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="number" 
                                className="w-full border rounded-lg p-2 mt-2" 
                                value={formData.balance} 
                                onChange={e => setFormData({...formData, balance: Number(e.target.value)})}
                                placeholder="Alta suma..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Nume Cumparator</label>
                            <input className="w-full border rounded-lg p-2 mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Email Destinatar (Optional)</label>
                            <input className="w-full border rounded-lg p-2 mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-800 border border-purple-100">
                            Cardul va fi generat automat si suma va fi adaugata in registrul de casa.
                        </div>

                        <button onClick={handleIssueCard} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg mt-2">
                            Emite & Incaseaza
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
