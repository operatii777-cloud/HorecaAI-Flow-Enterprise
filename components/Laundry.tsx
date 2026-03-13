
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { LaundryItem } from '../types';
import { ApiService } from '../services/api';
import { Shirt, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

export const Laundry: React.FC = () => {
  const [items, setItems] = useState<LaundryItem[]>([]);
  
  useEffect(() => {
      const load = async () => {
          setItems(await ApiService.getLaundryItems());
      };
      load();
  }, []);

  const handleSendToLaundry = async (item: LaundryItem) => {
      const amount = Number(prompt(`Cate bucati de "${item.name}" trimiti la spalatorie? (Disponibil murdar: ${item.dirtyStock})`));
      if (!amount || amount <= 0 || amount > item.dirtyStock) return alert("Cantitate invalida.");
      
      await ApiService.updateLaundryItem(item.id, {
          dirtyStock: item.dirtyStock - amount,
          atLaundryStock: item.atLaundryStock + amount
      });
      setItems(await ApiService.getLaundryItems());
  };

  const handleReceiveFromLaundry = async (item: LaundryItem) => {
      const amount = Number(prompt(`Cate bucati de "${item.name}" ai primit inapoi? (La spalatorie: ${item.atLaundryStock})`));
      if (!amount || amount <= 0 || amount > item.atLaundryStock) return alert("Cantitate invalida.");
      
      const damaged = Number(prompt("Cate sunt deteriorate/pete? (0 daca totul e ok)") || 0);
      
      await ApiService.updateLaundryItem(item.id, {
          atLaundryStock: item.atLaundryStock - amount,
          cleanStock: item.cleanStock + (amount - damaged),
          totalStock: item.totalStock - damaged
      });
      setItems(await ApiService.getLaundryItems());
  };

  const handleMarkDirty = async (item: LaundryItem) => {
      const amount = Number(prompt(`Cate bucati de "${item.name}" s-au murdarit?`));
      if (!amount || amount <= 0 || amount > item.cleanStock) return alert("Stoc curat insuficient.");
      
      await ApiService.updateLaundryItem(item.id, {
          cleanStock: item.cleanStock - amount,
          dirtyStock: item.dirtyStock + amount
      });
      setItems(await ApiService.getLaundryItems());
  };

  const defs: ColDef<LaundryItem>[] = [
      { field: 'name', headerName: 'Articol', flex: 1 },
      { field: 'type', headerName: 'Tip', width: 100 },
      { field: 'cleanStock', headerName: 'Curat', width: 100, cellStyle: { color: 'green', fontWeight: 'bold' } },
      { field: 'dirtyStock', headerName: 'Murdar', width: 100, cellStyle: { color: 'orange', fontWeight: 'bold' } },
      { field: 'atLaundryStock', headerName: 'La Spalatorie', width: 120, cellStyle: { color: 'blue', fontWeight: 'bold' } },
      { field: 'totalStock', headerName: 'Total', width: 100 },
      { 
          headerName: 'Actiuni', 
          width: 300,
          cellRenderer: (p: any) => (
              <div className="flex gap-2">
                  <button onClick={() => handleMarkDirty(p.data)} className="p-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200" title="Marcheaza Murdar"><RotateCcw size={16}/></button>
                  <button onClick={() => handleSendToLaundry(p.data)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Trimite la Spalat"><ArrowRight size={16}/></button>
                  <button onClick={() => handleReceiveFromLaundry(p.data)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200" title="Primeste de la Spalat"><ArrowLeft size={16}/></button>
              </div>
          )
      }
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Shirt className="text-blue-500"/> Gestiune Textile & Uniforme
                </h2>
                <p className="text-slate-500 text-sm">Inventar fete de masa, servete si uniforme.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Articole la Spalatorie</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                    {items.reduce((acc, i) => acc + i.atLaundryStock, 0)} buc
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Cost Spalare (Estimare)</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">
                    {items.reduce((acc, i) => acc + (i.atLaundryStock * i.costPerWash), 0).toFixed(2)} RON
                </div>
            </div>
        </div>

        <div className="flex-1 ag-theme-quartz shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white">
            <AgGridReact rowData={items} columnDefs={defs} />
        </div>
    </div>
  );
};
