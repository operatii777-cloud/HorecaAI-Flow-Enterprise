import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Ingredient, Supplier, StockTransfer, MenuItem } from '../types';
import { ApiService } from '../services/api';
import { PackageOpen, FileInput, Trash2, AlertTriangle, ArrowRightLeft, QrCode, Truck, Plus, X } from 'lucide-react';

export const Inventory: React.FC<{ notify?: (msg: string, type?: 'success' | 'error' | 'info') => void }> = ({ notify }) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'suppliers' | 'nir' | 'waste' | 'transfer' | 'traceability' | 'batch'>('stocks');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [nirData, setNirData] = useState({ supplierId: '', items: [{ name: '', quantity: 0, price: 0 }] });
  const [wasteData, setWasteData] = useState({ ingredientId: '', quantity: 0, reason: 'expired' });
  const [transferData, setTransferData] = useState({ ingredientId: '', quantity: 0, from: 'Depozit Central', to: 'Kitchen' });
  const [batchData, setBatchData] = useState({ productId: '', quantity: 1 });
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});

  const refreshData = async () => {
      const [ing, sup, menu] = await Promise.all([
          ApiService.getInventory(), 
          ApiService.getSuppliers(),
          ApiService.getMenu()
      ]);
      setIngredients(ing);
      setSuppliers(sup);
      setMenuItems(menu);
  };

  useEffect(() => {
      refreshData();
  }, [activeTab]);

  const handleNIR = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!nirData.supplierId || nirData.items.length === 0) return alert("Completeaza datele NIR.");
      try {
          await ApiService.processNIR({
              ...nirData,
              invoiceNumber: `NIR-${Date.now().toString().slice(-6)}`
          });
          alert("NIR procesat cu succes!");
          setNirData({ supplierId: '', items: [{ name: '', quantity: 0, price: 0 }] });
          refreshData();
      } catch (e) { alert("Eroare procesare"); }
  };

  const handleWaste = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await ApiService.logWaste({
              ingredientId: wasteData.ingredientId,
              quantity: Number(wasteData.quantity),
              reason: wasteData.reason
          });
          alert("Pierdere inregistrata.");
          setWasteData({ ingredientId: '', quantity: 0, reason: 'expired' });
          refreshData();
      } catch(e) { alert("Eroare waste"); }
  };

  const handleTransfer = async () => {
      if(!transferData.ingredientId || !transferData.quantity) return;
      const transfer: StockTransfer = {
          id: Date.now().toString(),
          fromWarehouse: transferData.from,
          toWarehouse: transferData.to,
          ingredientId: transferData.ingredientId,
          quantity: Number(transferData.quantity),
          date: new Date().toISOString(),
          user: 'Admin'
      };
      await ApiService.addTransfer(transfer);
      alert("Transfer realizat.");
      refreshData();
  };

  const handleAddSupplier = async () => {
      if(!supplierForm.name) return alert("Nume furnizor obligatoriu");
      await ApiService.addSupplier({
          id: Date.now().toString(),
          name: supplierForm.name,
          cui: supplierForm.cui || '',
          contactPerson: supplierForm.contactPerson || '',
          phone: supplierForm.phone || '',
          email: supplierForm.email || '',
          category: supplierForm.category || 'General'
      });
      setIsSupplierModalOpen(false);
      setSupplierForm({});
      refreshData();
  };

  const stockDefs: ColDef[] = [
    { field: 'name', headerName: 'Ingredient', flex: 2, filter: true },
    { field: 'currentStock', headerName: 'Stoc', width: 120, cellRenderer: (p: any) => (
        <span className={`${(p.value || 0) <= (p.data?.minStockAlert || 0) ? 'text-red-600 font-bold' : 'text-slate-700'} flex items-center gap-2`}>
            {(p.value || 0) <= (p.data?.minStockAlert || 0) && <AlertTriangle size={16} className="text-red-500" />} 
            {p.value ?? 0} {p.data?.unit || ''}
        </span>
    )},
    { field: 'costPerUnit', headerName: 'Pret Unitar', width: 100, valueFormatter: p => `${p.value ?? 0} RON` },
    { field: 'warehouse', headerName: 'Gestiune', width: 120 }
  ];

  const supplierDefs: ColDef[] = [
      { field: 'name', headerName: 'Furnizor', flex: 1 },
      { field: 'cui', headerName: 'CUI', width: 120 },
      { field: 'contactPerson', headerName: 'Contact', width: 150 },
      { field: 'phone', headerName: 'Telefon', width: 120 },
      { field: 'email', headerName: 'Email', width: 180 }
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50 relative">
       <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-xl border border-slate-200 w-full no-scrollbar shadow-sm">
           <button onClick={() => setActiveTab('stocks')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'stocks' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><PackageOpen size={18}/> Stocuri</button>
           <button onClick={() => setActiveTab('suppliers')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'suppliers' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><Truck size={18}/> Furnizori</button>
           <button onClick={() => setActiveTab('nir')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'nir' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><FileInput size={18}/> Receptie (NIR)</button>
           <button onClick={() => setActiveTab('waste')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'waste' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><Trash2 size={18}/> Pierderi</button>
           <button onClick={() => setActiveTab('transfer')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'transfer' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><ArrowRightLeft size={18}/> Transfer</button>
           <button onClick={() => setActiveTab('batch')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'batch' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><PackageOpen size={18}/> Productie Batch</button>
           <button onClick={() => setActiveTab('traceability')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'traceability' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}><QrCode size={18}/> Trasabilitate</button>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex p-6">
           {activeTab === 'stocks' && <div className="w-full h-full ag-theme-quartz"><AgGridReact rowData={ingredients} columnDefs={stockDefs} /></div>}
           
           {activeTab === 'suppliers' && (
               <div className="w-full h-full flex flex-col">
                   <div className="flex justify-end mb-4">
                       <button onClick={() => setIsSupplierModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800"><Plus size={18}/> Adauga Furnizor</button>
                   </div>
                   <div className="flex-1 ag-theme-quartz"><AgGridReact rowData={suppliers} columnDefs={supplierDefs} /></div>
               </div>
           )}

           {activeTab === 'nir' && (
               <div className="max-w-3xl mx-auto w-full">
                   <h3 className="text-xl font-bold mb-6">Intrare Marfa (NIR)</h3>
                   <form onSubmit={handleNIR} className="space-y-6">
                       <div>
                           <label className="block text-sm font-bold text-slate-600 mb-1">Furnizor</label>
                           <select className="w-full border p-2 rounded-lg" value={nirData.supplierId} onChange={e => setNirData({...nirData, supplierId: e.target.value})}>
                               <option value="">-- Alege --</option>
                               {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-lg border">
                           {nirData.items.map((item, idx) => (
                               <div key={idx} className="flex gap-2 mb-2">
                                   <select className="flex-[2] border p-2 rounded" value={item.name} onChange={e => { const n = [...nirData.items]; n[idx].name = e.target.value; setNirData({...nirData, items: n}); }}>
                                        <option value="">Produs</option>
                                        {ingredients.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                                   </select>
                                   <input type="number" className="w-24 border p-2 rounded" placeholder="Cant" value={item.quantity || ''} onChange={e => { const n = [...nirData.items]; n[idx].quantity = Number(e.target.value); setNirData({...nirData, items: n}); }}/>
                                   <input type="number" className="w-24 border p-2 rounded" placeholder="Pret" value={item.price || ''} onChange={e => { const n = [...nirData.items]; n[idx].price = Number(e.target.value); setNirData({...nirData, items: n}); }}/>
                               </div>
                           ))}
                           <button type="button" onClick={() => setNirData({...nirData, items: [...nirData.items, {name:'', quantity:0, price:0}]})} className="text-sm font-bold text-blue-600">+ Linie</button>
                       </div>
                       <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold">Salveaza NIR</button>
                   </form>
               </div>
           )}

           {activeTab === 'waste' && (
               <div className="max-w-xl mx-auto w-full">
                   <h3 className="text-xl font-bold mb-6 text-red-600">Raportare Pierderi</h3>
                   <form onSubmit={handleWaste} className="space-y-4">
                        <select className="w-full border rounded-lg p-3" value={wasteData.ingredientId} onChange={e => setWasteData({...wasteData, ingredientId: e.target.value})}>
                            <option value="">-- Selecteaza Produs --</option>
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input type="number" className="w-full border rounded-lg p-3" placeholder="Cantitate" value={wasteData.quantity || ''} onChange={e => setWasteData({...wasteData, quantity: Number(e.target.value)})}/>
                        <select className="w-full border rounded-lg p-3" value={wasteData.reason} onChange={e => setWasteData({...wasteData, reason: e.target.value})}>
                            <option value="expired">Expirat</option>
                            <option value="damaged">Deteriorat</option>
                            <option value="burnt">Ars / Gresit</option>
                        </select>
                        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-bold">Confirm Pierdere</button>
                   </form>
               </div>
           )}
           
            {activeTab === 'transfer' && (
               <div className="max-w-xl mx-auto w-full">
                   <h3 className="text-xl font-bold mb-6">Transfer intre Gestiuni</h3>
                   <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-xs font-bold uppercase">Din</label><input className="w-full border p-2 rounded" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}/></div>
                           <div><label className="text-xs font-bold uppercase">Catre</label><input className="w-full border p-2 rounded" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}/></div>
                       </div>
                       <select className="w-full border rounded p-3" value={transferData.ingredientId} onChange={e => setTransferData({...transferData, ingredientId: e.target.value})}>
                           <option value="">-- Ingredient --</option>
                           {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Stoc: {i.currentStock})</option>)}
                       </select>
                       <input type="number" className="w-full border rounded p-3" placeholder="Cantitate" value={transferData.quantity || ''} onChange={e => setTransferData({...transferData, quantity: Number(e.target.value)})}/>
                       <button onClick={handleTransfer} className="w-full bg-blue-600 text-white py-3 rounded font-bold">Executa Transfer</button>
                   </div>
               </div>
           )}

           {activeTab === 'batch' && (
               <div className="max-w-xl mx-auto w-full">
                   <h3 className="text-xl font-bold mb-2">Productie in Batch</h3>
                   <p className="text-slate-500 text-sm mb-6">Scade ingredientele din stoc si creste stocul produsului finit.</p>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produs Finit</label>
                           <select className="w-full border rounded-lg p-3" value={batchData.productId} onChange={e => setBatchData({...batchData, productId: e.target.value})}>
                               <option value="">-- Selecteaza Produs --</option>
                               {menuItems.filter(i => i.recipe && i.recipe.length > 0).map(i => (
                                   <option key={i.id} value={i.id}>{i.name}</option>
                               ))}
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantitate de produs</label>
                           <input type="number" className="w-full border rounded-lg p-3" placeholder="Cantitate" value={batchData.quantity || ''} onChange={e => setBatchData({...batchData, quantity: Number(e.target.value)})}/>
                       </div>
                       <button 
                           onClick={async () => {
                               if(!batchData.productId || !batchData.quantity) return;
                               try {
                                   await ApiService.processBatchProduction(batchData.productId, batchData.quantity);
                                   alert("Productie batch finalizata!");
                                   setBatchData({ productId: '', quantity: 1 });
                                   refreshData();
                               } catch (e) { alert("Eroare productie batch"); }
                           }} 
                           className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                       >
                           Proceseaza Productie
                       </button>
                   </div>
               </div>
           )}

           {activeTab === 'traceability' && (
               <div className="w-full h-full overflow-y-auto">
                   <h3 className="font-bold text-lg mb-4">Istoric Loturi & Trasabilitate</h3>
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 font-bold text-slate-600"><tr><th className="p-3">Produs</th><th className="p-3">Data Intrare</th><th className="p-3">Furnizor</th><th className="p-3">Lot #</th><th className="p-3">Expira</th></tr></thead>
                       <tbody>
                           {ingredients.map(i => (
                               <tr key={i.id} className="border-b">
                                   <td className="p-3">{i.name}</td>
                                   <td className="p-3">{new Date().toLocaleDateString()}</td>
                                   <td className="p-3">{suppliers.find(s => s.id === i.supplierId)?.name || '-'}</td>
                                   <td className="p-3 font-mono text-xs">{i.id.slice(0,8).toUpperCase()}</td>
                                   <td className="p-3 text-emerald-600 font-bold">{new Date(Date.now() + 86400000 * 10).toLocaleDateString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           )}
       </div>

        {isSupplierModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Adauga Furnizor</h3>
                        <button onClick={() => setIsSupplierModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <input className="w-full border rounded-lg p-3" placeholder="Nume Companie" value={supplierForm.name || ''} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}/>
                        <input className="w-full border rounded-lg p-3" placeholder="CUI" value={supplierForm.cui || ''} onChange={e => setSupplierForm({...supplierForm, cui: e.target.value})}/>
                        <input className="w-full border rounded-lg p-3" placeholder="Persoana Contact" value={supplierForm.contactPerson || ''} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})}/>
                        <input className="w-full border rounded-lg p-3" placeholder="Telefon" value={supplierForm.phone || ''} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}/>
                        <input className="w-full border rounded-lg p-3" placeholder="Email" value={supplierForm.email || ''} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}/>
                        <button onClick={handleAddSupplier} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 mt-2">Salveaza Furnizor</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};