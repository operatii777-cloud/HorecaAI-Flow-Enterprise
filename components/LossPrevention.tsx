
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { AuditLog, Order, OrderStatus } from '../types';
import { ApiService } from '../services/api';
import { ShieldAlert, Camera, Eye, AlertTriangle, Search, FileText, User } from 'lucide-react';

export const LossPrevention: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
      const load = async () => {
          // Aggregate Suspicious Data
          const [logs, activeOrders, archivedOrders] = await Promise.all([
              ApiService.getAuditLogs(),
              ApiService.getOrders(),
              ApiService.getArchivedOrders()
          ]);
          const orders = [...activeOrders, ...archivedOrders];
          
          const suspiciousLogs = logs.filter(l => 
              l.action.includes('VOID') || 
              l.action.includes('DELETE') || 
              l.details.includes('Discount') ||
              l.action.includes('SETTINGS')
          ).map(l => ({
              id: l.id,
              type: 'LOG',
              timestamp: l.timestamp,
              summary: l.action,
              details: l.details,
              user: l.user,
              riskLevel: l.action.includes('VOID') ? 'HIGH' : 'MEDIUM'
          }));

          const suspiciousOrders = orders.filter(o => 
              (o.discount && o.discount > 50) || // > 50 RON discount
              o.status === OrderStatus.CANCELLED ||
              (o.items.length === 0 && o.total > 0) // Ghost order
          ).map(o => ({
              id: o.id,
              type: 'ORDER',
              timestamp: o.timestamp,
              summary: o.status === OrderStatus.CANCELLED ? 'ORDER CANCELLED' : 'HIGH DISCOUNT',
              details: `Total: ${o.total} RON. Discount: ${o.discount}`,
              user: o.waiterId || 'Unknown',
              riskLevel: 'MEDIUM'
          }));

          const allEvents = [...suspiciousLogs, ...suspiciousOrders].sort((a,b) => b.timestamp - a.timestamp);
          setEvents(allEvents);
      };
      load();
  }, []);

  const defs: ColDef[] = [
      { field: 'timestamp', headerName: 'Ora', width: 160, valueFormatter: p => new Date(p.value).toLocaleString() },
      { field: 'riskLevel', headerName: 'Risk', width: 100, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold ${p.value === 'HIGH' ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
              {p.value}
          </span>
      )},
      { field: 'summary', headerName: 'Eveniment', flex: 1, filter: true, cellRenderer: (p: any) => <span className="font-bold text-slate-700">{p.value}</span> },
      { field: 'user', headerName: 'Angajat', width: 120 },
      { headerName: 'CCTV', width: 100, cellRenderer: (p: any) => (
          <button onClick={() => setSelectedEvent(p.data)} className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded">
              <Camera size={14}/> View
          </button>
      )}
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="text-red-600"/> Loss Prevention
                </h2>
                <p className="text-slate-500 text-sm">Monitorizare tranzactii suspecte si integrare CCTV.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-bold text-slate-600">
                {events.length} Incidente Detectate
            </div>
        </div>

        <div className="flex gap-6 h-full overflow-hidden">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ag-theme-quartz">
                <AgGridReact rowData={events} columnDefs={defs} pagination={true} paginationPageSize={20}/>
            </div>

            {selectedEvent && (
                <div className="w-[400px] bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
                    <div className="relative h-64 bg-black">
                        {/* Mock CCTV Feed */}
                        <img 
                            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80" 
                            className="w-full h-full object-cover opacity-60 grayscale"
                            alt="CCTV"
                        />
                        <div className="absolute top-4 left-4 text-green-500 font-mono text-xs flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> REC
                        </div>
                        <div className="absolute bottom-4 right-4 text-white font-mono text-sm font-bold bg-black/50 px-2 rounded">
                            {new Date(selectedEvent.timestamp).toLocaleString()}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-red-500/50 w-32 h-32 rounded-full"></div>
                        </div>
                    </div>

                    <div className="p-6 text-slate-300 flex-1">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
                            <div className="p-3 bg-red-900/30 rounded-full text-red-500">
                                <AlertTriangle size={24}/>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">{selectedEvent.summary}</h3>
                                <p className="text-xs text-slate-500 uppercase font-bold">{selectedEvent.riskLevel} RISK EVENT</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Detalii Tranzactie</label>
                                <div className="bg-slate-800 p-3 rounded-lg font-mono text-slate-300 border border-slate-700">
                                    {selectedEvent.details}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-500"/>
                                    <span className="font-bold">{selectedEvent.user}</span>
                                </div>
                                <button className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1">
                                    <FileText size={12}/> Vezi Istoric Angajat
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 flex gap-3">
                            <button onClick={() => setSelectedEvent(null)} className="flex-1 py-3 border border-slate-600 rounded-lg font-bold hover:bg-slate-800">Inchide</button>
                            <button className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Marcheaza Incident</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
