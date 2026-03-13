
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Order, OrderStatus } from '../types';
import { ApiService } from '../services/api';
import { Archive as ArchiveIcon, Search, Eye } from 'lucide-react';

interface ArchiveProps {
    initialOrderId?: string;
}

export const Archive: React.FC<ArchiveProps> = ({ initialOrderId }) => {
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
        const data = await ApiService.getArchivedOrders();
        setArchivedOrders(data);
        setFilteredOrders(data);
    };
    load();
  }, []);

  useEffect(() => {
      if(initialOrderId && archivedOrders.length > 0) {
          const order = archivedOrders.find(o => o.id === initialOrderId);
          if(order) setSelectedOrder(order);
      }
  }, [initialOrderId, archivedOrders]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredOrders(archivedOrders.filter(o => 
        o.id.toLowerCase().includes(lower) || 
        o.total.toString().includes(lower) ||
        new Date(o.timestamp).toLocaleDateString().includes(lower)
    ));
  }, [searchTerm, archivedOrders]);

  const defs: ColDef<Order>[] = [
      { field: 'id', headerName: 'ID', width: 120, cellRenderer: (p: any) => <span className="font-mono text-slate-600">#{p.value.slice(-6)}</span> },
      { field: 'timestamp', headerName: 'Data', flex: 1, valueFormatter: p => new Date(p.value).toLocaleString() },
      { field: 'type', headerName: 'Tip', width: 100, cellRenderer: (p: any) => p.value === 'delivery' ? '🛵 Delivery' : p.value === 'takeaway' ? '🥡 Takeaway' : '🍽️ Sala' },
      { field: 'total', headerName: 'Total', width: 100, valueFormatter: p => `${p.value} RON` },
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === OrderStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {p.value}
          </span>
      )},
      { headerName: 'Detalii', width: 100, cellRenderer: (p: any) => (
          <button onClick={() => setSelectedOrder(p.data)} className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"><Eye size={12}/> Vezi</button>
      )}
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ArchiveIcon className="text-indigo-600"/> Arhiva Comenzi
            </h2>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Cauta comanda..." 
                    className="pl-10 pr-4 py-2 border rounded-lg shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 ag-theme-quartz shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white">
            <AgGridReact rowData={filteredOrders} columnDefs={defs} pagination={true} paginationPageSize={20} />
        </div>

        {selectedOrder && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold">Comanda #{selectedOrder.id.slice(-6)}</h3>
                            <p className="text-sm text-slate-500">{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">Inchide</button>
                    </div>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-dashed pb-2">
                                <div>
                                    <div className="font-bold">{item.quantity} x {item.name}</div>
                                    {item.selectedModifiers && (
                                        <div className="text-xs text-slate-500">
                                            {item.selectedModifiers.map(m => `+ ${m.name}`).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="font-mono">{(item.price * item.quantity).toFixed(2)} RON</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t text-xl font-bold">
                        <span>Total Achitat</span>
                        <span className="text-emerald-600">{selectedOrder.total} RON</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
