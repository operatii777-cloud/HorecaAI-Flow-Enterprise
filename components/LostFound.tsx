
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { LostItem } from '../types';
import { ApiService } from '../services/api';
import { Search, Plus, UserCheck } from 'lucide-react';

export const LostFound: React.FC = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<LostItem>>({
      status: 'Found',
      dateFound: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
      const load = async () => {
          setItems(await ApiService.getLostItems());
      };
      load();
  }, []);

  const refresh = async () => setItems(await ApiService.getLostItems());

  const handleRegister = async () => {
      if(!newItem.description || !newItem.locationFound) return alert("Descriere si Locatie obligatorii.");
      
      const item: LostItem = {
          id: Date.now().toString(),
          description: newItem.description,
          locationFound: newItem.locationFound,
          foundBy: newItem.foundBy || 'Staff',
          dateFound: newItem.dateFound || new Date().toISOString(),
          status: 'Found',
          notes: newItem.notes
      };
      
      await ApiService.addLostItem(item);
      refresh();
      setIsModalOpen(false);
      setNewItem({ status: 'Found', dateFound: new Date().toISOString().split('T')[0] });
  };

  const handleClaim = async (item: LostItem) => {
      const name = prompt("Nume persoana care revendica:");
      if(!name) return;
      
      await ApiService.updateLostItem(item.id, {
          status: 'Claimed',
          claimedBy: name,
          claimDate: new Date().toISOString()
      });
      refresh();
  };

  const defs: ColDef<LostItem>[] = [
      { field: 'dateFound', headerName: 'Data', width: 120, valueFormatter: p => new Date(p.value).toLocaleDateString() },
      { field: 'description', headerName: 'Descriere Obiect', flex: 2 },
      { field: 'locationFound', headerName: 'Gasit In', width: 150 },
      { field: 'foundBy', headerName: 'Gasit De', width: 120 },
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === 'Found' ? 'bg-orange-100 text-orange-700' : p.value === 'Claimed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {p.value}
          </span>
      )},
      { headerName: 'Actiuni', width: 140, cellRenderer: (p: any) => (
          p.data.status === 'Found' && (
              <button 
                onClick={() => handleClaim(p.data)} 
                className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200"
              >
                  <UserCheck size={14}/> Revendicare
              </button>
          )
      )}
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Search className="text-blue-600"/> Lost & Found Registry
                </h2>
                <p className="text-slate-500 text-sm">Evidenta obiecte pierdute si gasite.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
                <Plus size={18}/> Raporteaza Obiect
            </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ag-theme-quartz">
            <AgGridReact rowData={items} columnDefs={defs} pagination={true} paginationPageSize={15} />
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Inregistrare Obiect Gasit</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Descriere</label>
                            <input className="w-full border rounded-lg p-2 mt-1" placeholder="ex: Telefon iPhone Negru" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Locatie</label>
                                <input className="w-full border rounded-lg p-2 mt-1" placeholder="ex: Sub Masa 5" value={newItem.locationFound || ''} onChange={e => setNewItem({...newItem, locationFound: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                <input type="date" className="w-full border rounded-lg p-2 mt-1" value={newItem.dateFound} onChange={e => setNewItem({...newItem, dateFound: e.target.value})}/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Gasit De (Staff)</label>
                            <input className="w-full border rounded-lg p-2 mt-1" value={newItem.foundBy || ''} onChange={e => setNewItem({...newItem, foundBy: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Note / Detalii</label>
                            <textarea className="w-full border rounded-lg p-2 mt-1" rows={2} value={newItem.notes || ''} onChange={e => setNewItem({...newItem, notes: e.target.value})}></textarea>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-slate-500">Anuleaza</button>
                            <button onClick={handleRegister} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Inregistreaza</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
