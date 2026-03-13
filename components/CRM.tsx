
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Client, Order } from '../types';
import { ApiService } from '../services/api';
import { Users, Search, Phone, MapPin, History, Star, Smartphone, QrCode } from 'lucide-react';

interface CRMProps {
    initialClientId?: string;
}

export const CRM: React.FC<CRMProps> = ({ initialClientId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [showWalletPass, setShowWalletPass] = useState(false);

  useEffect(() => {
    ApiService.getClients().then(setClients);
  }, []);

  useEffect(() => {
      if(initialClientId && clients.length > 0) {
          const client = clients.find(c => c.id === initialClientId);
          if(client) setSelectedClient(client);
      }
  }, [initialClientId, clients]);

  useEffect(() => {
    if(selectedClient) {
        const fetchOrders = async () => {
            const [active, archived] = await Promise.all([ApiService.getOrders(), ApiService.getArchivedOrders()]);
            const allOrders = [...active, ...archived];
            const relevant = allOrders.filter(o => o.deliveryInfo?.phone === selectedClient.phone);
            setClientOrders(relevant.sort((a,b) => b.timestamp - a.timestamp));
        };
        fetchOrders();
        setShowWalletPass(false); // Reset pass view on client change
    }
  }, [selectedClient]);

  const clientDefs: ColDef<Client>[] = [
      { field: 'name', headerName: 'Nume Client', flex: 1, filter: true },
      { field: 'phone', headerName: 'Telefon', width: 150, filter: true },
      { field: 'totalSpent', headerName: 'Total Cheltuit', width: 140, valueFormatter: p => `${p.value.toFixed(2)} RON`, sort: 'desc' },
      { field: 'ordersCount', headerName: 'Comenzi', width: 100 },
      { field: 'lastOrderDate', headerName: 'Ultima Comanda', width: 150, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString() : '-' },
      { headerName: 'Detalii', width: 100, cellRenderer: (p: any) => (
          <button onClick={() => setSelectedClient(p.data)} className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline">
              <History size={12}/> Istoric
          </button>
      )}
  ];

  return (
    <div className="h-full flex gap-6 p-6 bg-slate-50">
        {/* Client List */}
        <div className={`${selectedClient ? 'w-2/3' : 'w-full'} transition-all duration-300 flex flex-col`}>
             <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-pink-600"/> CRM & Clienti
                    </h2>
                    <p className="text-slate-500 text-sm">Baza de date clienti si istoric livrari.</p>
                 </div>
             </div>
             
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 ag-theme-quartz">
                 <AgGridReact rowData={clients} columnDefs={clientDefs} pagination={true} paginationPageSize={20} />
             </div>
        </div>

        {/* Client Details Panel */}
        {selectedClient && (
            <div className="w-1/3 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col animate-in slide-in-from-right relative overflow-hidden">
                <div className="p-6 border-b bg-slate-50 relative">
                    <button onClick={() => setSelectedClient(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-2xl mb-4">
                        {selectedClient.name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedClient.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Phone size={14}/> {selectedClient.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <MapPin size={14}/> {selectedClient.address || 'Fara adresa'}
                    </div>
                    <div className="mt-4 flex gap-2">
                        {selectedClient.tags?.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">{tag}</span>
                        ))}
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{selectedClient.ordersCount} comenzi</span>
                    </div>
                    
                    <button 
                        onClick={() => setShowWalletPass(!showWalletPass)}
                        className="w-full mt-4 py-2 border border-slate-900 text-slate-900 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                        <Smartphone size={14}/> {showWalletPass ? 'Ascunde Card' : 'Genereaza Digital Wallet'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {showWalletPass ? (
                        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden h-48 flex flex-col justify-between animate-in zoom-in duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-xs font-bold uppercase text-slate-400">Card Fidelitate</div>
                                    <div className="text-lg font-bold">HorecaAI Bistro</div>
                                </div>
                                <QrCode size={40} className="bg-white text-black p-1 rounded"/>
                            </div>
                            <div className="z-10">
                                <div className="text-xs text-slate-400 uppercase">Balanta Puncte</div>
                                <div className="text-3xl font-mono font-bold text-pink-400">{selectedClient.totalSpent.toFixed(0)}</div>
                            </div>
                            <div className="absolute bottom-4 right-4 text-[10px] text-slate-500 font-mono">
                                ID: {selectedClient.id.slice(-6).toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <>
                            <h4 className="font-bold text-slate-700 text-sm uppercase">Istoric Comenzi</h4>
                            {clientOrders.length === 0 ? (
                                <p className="text-slate-400 text-center italic py-4">Nu exista istoric.</p>
                            ) : (
                                clientOrders.map(order => (
                                    <div key={order.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-slate-700">#{order.id.slice(-6)}</span>
                                            <span className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 mb-2">
                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                            <div className="flex gap-1">
                                                {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-slate-200"/>)}
                                            </div>
                                            <span className="font-bold text-emerald-600">{order.total} RON</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
                
                <div className="p-4 border-t bg-slate-50">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Total Lifetime Value</span>
                        <span className="text-xl font-bold text-indigo-600">{selectedClient.totalSpent.toFixed(2)} RON</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
