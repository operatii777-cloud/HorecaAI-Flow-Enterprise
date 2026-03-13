
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { LogbookEntry } from '../types';
import { ApiService } from '../services/api';
import { Book, Save, CloudSun, CheckSquare, Plus, Star } from 'lucide-react';

export const ShiftHandover: React.FC = () => {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Form State
  const [formData, setFormData] = useState<Partial<LogbookEntry>>({
      shift: 'Dinner',
      notes: '',
      issues: '',
      weather: 'Senin, 22°C',
      staffRating: 5,
      sales: 0,
      checklist: [
          { task: 'Verificare Casa Marcat', done: false },
          { task: 'Inchidere Lumini/AC', done: false },
          { task: 'Verificare Incuietori', done: false },
          { task: 'Trimite Raport Z', done: false }
      ]
  });

  useEffect(() => {
      const load = async () => {
          setEntries(await ApiService.getLogbook());
          
          // Auto-populate sales
          const today = new Date().toISOString().split('T')[0];
          const [active, archived] = await Promise.all([ApiService.getOrders(), ApiService.getArchivedOrders()]);
          const orders = [...active, ...archived];
          const todaysTotal = orders
            .filter(o => new Date(o.timestamp).toISOString().split('T')[0] === today)
            .reduce((acc, o) => acc + o.total, 0);
          
          setFormData(prev => ({ ...prev, sales: todaysTotal }));
      };
      load();
  }, [activeTab]);

  const handleSubmit = async () => {
      if(!formData.notes) return alert("Adauga note de serviciu.");
      
      const entry: LogbookEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          managerName: 'Manager Activ', // Should come from context
          shift: formData.shift as any,
          notes: formData.notes || '',
          issues: formData.issues || '',
          weather: formData.weather || '',
          staffRating: formData.staffRating || 5,
          sales: formData.sales || 0,
          checklist: formData.checklist || []
      };
      
      await ApiService.addLogbookEntry(entry);
      alert("Raport tura salvat!");
      setEntries(await ApiService.getLogbook());
      setActiveTab('history');
      
      // Reset form
      setFormData({
          shift: 'Dinner',
          notes: '',
          issues: '',
          weather: 'Senin, 22°C',
          staffRating: 5,
          sales: 0,
          checklist: [
              { task: 'Verificare Casa Marcat', done: false },
              { task: 'Inchidere Lumini/AC', done: false },
              { task: 'Verificare Incuietori', done: false },
              { task: 'Trimite Raport Z', done: false }
          ]
      });
  };

  const toggleCheck = (idx: number) => {
      if(!formData.checklist) return;
      const newChecklist = [...formData.checklist];
      newChecklist[idx].done = !newChecklist[idx].done;
      setFormData({...formData, checklist: newChecklist});
  };

  const defs: ColDef<LogbookEntry>[] = [
      { field: 'date', headerName: 'Data', width: 150, valueFormatter: p => new Date(p.value).toLocaleDateString() },
      { field: 'shift', headerName: 'Tura', width: 100 },
      { field: 'managerName', headerName: 'Manager', width: 120 },
      { field: 'sales', headerName: 'Vanzari', width: 100, valueFormatter: p => `${p.value} RON` },
      { field: 'staffRating', headerName: 'Rating Staff', width: 100, cellRenderer: (p: any) => '⭐'.repeat(p.value) },
      { field: 'notes', headerName: 'Note', flex: 1 }
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Book className="text-indigo-600"/> Jurnal Tura (Manager Log)
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('new')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Plus size={18}/> Raport Nou
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Book size={18}/> Istoric
                </button>
            </div>
        </div>

        {activeTab === 'new' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tura</label>
                            <select className="w-full border rounded-lg p-2.5 mt-1" value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value as any})}>
                                <option value="Breakfast">Breakfast</option>
                                <option value="Lunch">Lunch</option>
                                <option value="Dinner">Dinner</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Vanzari (Pana acum)</label>
                            <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={formData.sales} disabled />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Sumar Service (Pozitiv)</label>
                        <textarea className="w-full border rounded-lg p-3 mt-1 h-24" placeholder="Ce a mers bine? VIPs? Evenimente?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase text-red-500">Probleme / Plangeri / Mentenanta</label>
                        <textarea className="w-full border rounded-lg p-3 mt-1 h-24 border-red-100 bg-red-50 focus:bg-white" placeholder="Clienti nemultumiti? Echipamente stricate?" value={formData.issues} onChange={e => setFormData({...formData, issues: e.target.value})}></textarea>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><CheckSquare size={18}/> Checklist Inchidere</h3>
                        <div className="space-y-3">
                            {formData.checklist?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleCheck(idx)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                        {item.done && <CheckSquare size={14}/>}
                                    </div>
                                    <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.task}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><CloudSun size={14}/> Vremea</label>
                            <input className="w-full border rounded-lg p-2 mt-1" value={formData.weather} onChange={e => setFormData({...formData, weather: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Star size={14}/> Rating Echipa</label>
                            <div className="flex gap-2 mt-1">
                                {[1,2,3,4,5].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setFormData({...formData, staffRating: s})}
                                        className={`w-8 h-8 rounded border flex items-center justify-center font-bold transition-colors ${s <= (formData.staffRating || 0) ? 'bg-amber-400 border-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                        <Save size={18}/> Salveaza Jurnal
                    </button>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 ag-theme-quartz">
                <AgGridReact rowData={entries} columnDefs={defs} pagination={true} paginationPageSize={20}/>
            </div>
        )}
    </div>
  );
};
