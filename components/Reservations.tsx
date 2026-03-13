
import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Reservation, Table, WaitlistEntry } from '../types';
import { ApiService } from '../services/api';
import { CalendarDays, Plus, Users, Clock, CheckCircle, X, BarChartHorizontal, List, CreditCard, UserPlus, Timer, LogIn, Sparkles } from 'lucide-react';

interface ReservationsProps {
    onCheckIn?: (reservation: Reservation) => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ onCheckIn }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'waitlist'>('list');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  
  const [newRes, setNewRes] = useState<Partial<Reservation>>({
      guests: 2,
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      status: 'confirmed',
      depositAmount: 0
  });

  const [newWait, setNewWait] = useState<Partial<WaitlistEntry>>({
      partySize: 2,
      estimatedWaitTime: 15
  });

  // Force refresh for waitlist timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
      return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
      const [res, wait, tbls] = await Promise.all([
          ApiService.getReservations(),
          ApiService.getWaitlist(),
          ApiService.getTables()
      ]);
      setReservations(res);
      setWaitlist(wait);
      setTables(tbls);
  };

  useEffect(() => {
      refresh();
  }, []);

  const handleCreate = async () => {
      if(!newRes.customerName || !newRes.phone) return alert("Nume si Telefon obligatorii");
      
      const res: Reservation = {
          id: Date.now().toString(),
          customerName: newRes.customerName,
          phone: newRes.phone,
          date: newRes.date || '',
          time: newRes.time || '',
          guests: newRes.guests || 2,
          tableId: newRes.tableId,
          status: 'confirmed',
          notes: newRes.notes,
          depositAmount: newRes.depositAmount
      };

      await ApiService.addReservation(res);
      refresh();
      setIsModalOpen(false);
      setNewRes({ guests: 2, date: new Date().toISOString().split('T')[0], time: '19:00', status: 'confirmed', depositAmount: 0 });
  };

  const handleAddWaitlist = async () => {
      if(!newWait.customerName) return alert("Nume obligatoriu");
      
      const entry: WaitlistEntry = {
          id: Date.now().toString(),
          customerName: newWait.customerName,
          partySize: newWait.partySize || 2,
          addedAt: Date.now(),
          phone: newWait.phone,
          estimatedWaitTime: newWait.estimatedWaitTime,
          status: 'waiting'
      };
      
      await ApiService.addToWaitlist(entry);
      refresh();
      setIsWaitlistModalOpen(false);
      setNewWait({ partySize: 2, estimatedWaitTime: 15 });
  };

  const handleCheckInAction = (res: Reservation) => {
      if(onCheckIn) {
          onCheckIn(res);
          refresh(); 
      }
  };

  const handleSeatWalkIn = async (entry: WaitlistEntry) => {
      // Find a table
      const availableTable = tables.find(t => !t.occupied && t.seats >= entry.partySize && !t.reserved);
      const tableId = availableTable ? availableTable.id : Number(prompt("Introdu numar masa pentru alocare:"));
      
      if(tableId) {
          await ApiService.updateWaitlistStatus(entry.id, 'seated');
          // Create dummy reservation to trigger standard check-in flow
          const dummyRes: Reservation = {
              id: entry.id,
              customerName: entry.customerName,
              phone: entry.phone || '',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString(),
              guests: entry.partySize,
              status: 'confirmed',
              tableId: tableId
          };
          if(onCheckIn) onCheckIn(dummyRes);
          refresh();
      }
  };

  const handleWaitlistStatus = async (id: string, status: string) => {
      await ApiService.updateWaitlistStatus(id, status);
      refresh();
  };

  const defs: ColDef<Reservation>[] = [
      { field: 'customerName', headerName: 'Nume Client', flex: 1 },
      { field: 'phone', headerName: 'Telefon', width: 150 },
      { field: 'date', headerName: 'Data', width: 120, filter: true },
      { field: 'time', headerName: 'Ora', width: 100 },
      { field: 'guests', headerName: 'Persoane', width: 100, cellRenderer: (p: any) => <span className="font-bold flex items-center gap-1"><Users size={14}/> {p.value}</span> },
      { field: 'tableId', headerName: 'Masa', width: 100, cellRenderer: (p: any) => p.value ? `Masa ${p.value}` : <span className="text-slate-400 text-xs italic">Nealocata</span> },
      { field: 'depositAmount', headerName: 'Avans', width: 100, cellRenderer: (p: any) => p.value ? <span className="text-emerald-600 font-bold">+{p.value} RON</span> : '-' },
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              p.value === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
              p.value === 'seated' ? 'bg-blue-100 text-blue-700' : 
              p.value === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>{p.value}</span>
      )},
      { headerName: 'Actiuni', width: 120, cellRenderer: (p: any) => {
          if (p.data.status === 'confirmed') {
              return (
                  <button 
                    onClick={() => handleCheckInAction(p.data)}
                    className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
                  >
                      <CheckCircle size={12}/> Check-In
                  </button>
              );
          }
          return null;
      }}
  ];

  // Timeline Logic
  const startHour = 12;
  const endHour = 24;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const getReservationStyle = (res: Reservation) => {
      const [h, m] = res.time.split(':').map(Number);
      const startOffset = (h - startHour) + (m / 60);
      const duration = 2; // Assume 2 hours per reservation
      
      return {
          left: `${(startOffset / (endHour - startHour)) * 100}%`,
          width: `${(duration / (endHour - startHour)) * 100}%`
      };
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysReservations = reservations.filter(r => r.date === today);
  const activeWaitlist = waitlist.filter(w => w.status === 'waiting');

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="text-amber-500"/> Rezervari & Host
            </h2>
            <div className="flex gap-4">
                <div className="flex bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                        <List size={16}/> Lista
                    </button>
                    <button onClick={() => setViewMode('timeline')} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                        <BarChartHorizontal size={16}/> Timeline
                    </button>
                    <button onClick={() => setViewMode('waitlist')} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode === 'waitlist' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                        <Timer size={16}/> Lista Asteptare ({activeWaitlist.length})
                    </button>
                </div>
                {viewMode === 'waitlist' ? (
                    <button onClick={() => setIsWaitlistModalOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-200">
                        <UserPlus size={18}/> Walk-In / Waitlist
                    </button>
                ) : (
                    <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                        <Plus size={18}/> Rezervare Noua
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-3 bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                {viewMode === 'list' && (
                    <div className="ag-theme-quartz h-full w-full">
                        <AgGridReact rowData={reservations} columnDefs={defs} />
                    </div>
                )}
                
                {viewMode === 'timeline' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Timeline Azi ({new Date().toLocaleDateString()})</h3>
                            <div className="flex gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Rezervat</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Confirmat</div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4">
                            <div className="min-w-[800px]">
                                {/* Header Hours */}
                                <div className="flex mb-2 pl-24">
                                    {hours.map(h => (
                                        <div key={h} className="flex-1 text-xs text-slate-400 font-bold border-l border-slate-200 pl-1">
                                            {h}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Rows */}
                                <div className="space-y-2">
                                    {tables.map(table => (
                                        <div key={table.id} className="flex h-12 relative bg-slate-50 rounded border border-slate-100 group hover:bg-slate-100">
                                            <div className="w-24 flex-shrink-0 flex flex-col justify-center items-center border-r border-slate-200 bg-white font-bold text-slate-700 text-sm z-10 sticky left-0">
                                                <span>Masa {table.id}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">{table.seats} locuri</span>
                                            </div>
                                            
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 left-24 flex pointer-events-none">
                                                {hours.map(h => (
                                                    <div key={h} className="flex-1 border-r border-slate-200/50"></div>
                                                ))}
                                            </div>

                                            {/* Reservations Bars */}
                                            <div className="flex-1 relative mx-1">
                                                {todaysReservations.filter(r => r.tableId === table.id).map(res => (
                                                    <div
                                                        key={res.id}
                                                        className={`absolute top-2 bottom-2 rounded-md shadow-sm border flex items-center justify-center text-xs font-bold text-white overflow-hidden whitespace-nowrap px-2 cursor-pointer hover:brightness-110 transition-all ${
                                                            res.status === 'confirmed' ? 'bg-emerald-500 border-emerald-600' : 'bg-blue-500 border-blue-600'
                                                        }`}
                                                        style={getReservationStyle(res)}
                                                        title={`${res.customerName} (${res.guests} pers) - ${res.time}`}
                                                        onClick={() => {
                                                            if(confirm(`Check-in pentru ${res.customerName}?`)) handleCheckInAction(res);
                                                        }}
                                                    >
                                                        {res.customerName}
                                                        {res.depositAmount && res.depositAmount > 0 && <span className="ml-1 text-[8px] bg-white text-emerald-600 px-1 rounded-sm">$</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'waitlist' && (
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeWaitlist.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-400">
                                    <Timer size={48} className="mb-2 opacity-20"/>
                                    <p>Lista de asteptare este goala.</p>
                                </div>
                            ) : (
                                activeWaitlist.map(entry => {
                                    const waitedMin = Math.floor((now - entry.addedAt) / 60000);
                                    const isOverdue = entry.estimatedWaitTime && waitedMin > entry.estimatedWaitTime;
                                    
                                    return (
                                        <div key={entry.id} className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                            {isOverdue && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg animate-pulse"></div>}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">{entry.customerName}</h3>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1"><Users size={12}/> {entry.partySize} pers</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold font-mono ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {waitedMin}'
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">Est: {entry.estimatedWaitTime}'</div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex gap-2">
                                                <button 
                                                    onClick={() => handleWaitlistStatus(entry.id, 'cancelled')}
                                                    className="p-2 border rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <X size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleSeatWalkIn(entry)}
                                                    className="flex-1 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800"
                                                >
                                                    <LogIn size={16}/> Aloca Masa
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-bold text-slate-800 mb-4">Statistici Azi</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-xl">
                        <div className="text-xs text-indigo-500 font-bold uppercase">Total Rezervari</div>
                        <div className="text-2xl font-bold text-indigo-700">{todaysReservations.length}</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                        <div className="text-xs text-emerald-500 font-bold uppercase">Oaspeti Estimati</div>
                        <div className="text-2xl font-bold text-emerald-700">{todaysReservations.reduce((a,b) => a + b.guests, 0)}</div>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-bold mb-2">Urmeaza (1h)</h4>
                        {todaysReservations
                            .filter(r => {
                                const h = Number(r.time.split(':')[0]);
                                const nowH = new Date().getHours();
                                return h >= nowH && h <= nowH + 1;
                            })
                            .map(r => (
                            <div key={r.id} className="flex items-center gap-3 py-2 text-sm">
                                <Clock size={16} className="text-slate-400"/>
                                <span className="font-bold">{r.time}</span>
                                <span className="truncate">{r.customerName}</span>
                            </div>
                        ))}
                        {todaysReservations.length === 0 && <p className="text-xs text-slate-400 italic">Fara rezervari azi.</p>}
                    </div>
                </div>
            </div>
        </div>

        {/* New Reservation Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Rezervare Noua</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Nume Client</label>
                                <input className="w-full border rounded-lg p-2.5 mt-1" value={newRes.customerName || ''} onChange={e => setNewRes({...newRes, customerName: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Telefon</label>
                                <input className="w-full border rounded-lg p-2.5 mt-1" value={newRes.phone || ''} onChange={e => setNewRes({...newRes, phone: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Data</label>
                                <input type="date" className="w-full border rounded-lg p-2.5 mt-1" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Ora</label>
                                <input type="time" className="w-full border rounded-lg p-2.5 mt-1" value={newRes.time} onChange={e => setNewRes({...newRes, time: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Persoane</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={newRes.guests} onChange={e => setNewRes({...newRes, guests: Number(e.target.value)})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Alocare Masa</label>
                                <select className="w-full border rounded-lg p-2.5 mt-1" value={newRes.tableId || ''} onChange={e => setNewRes({...newRes, tableId: Number(e.target.value)})}>
                                    <option value="">-- Fara alocare --</option>
                                    {tables.map(t => {
                                        // Simple heuristic for best fit
                                        const isBestFit = !t.occupied && !t.reserved && t.seats >= (newRes.guests || 2) && t.seats <= (newRes.guests || 2) + 2;
                                        return (
                                            <option key={t.id} value={t.id}>
                                                {isBestFit ? '✨ ' : ''}Masa {t.id} ({t.seats} loc) {isBestFit ? '- RECOMANDAT' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><CreditCard size={12}/> Avans (RON)</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={newRes.depositAmount} onChange={e => setNewRes({...newRes, depositAmount: Number(e.target.value)})} placeholder="0.00" />
                            </div>
                        </div>
                        
                        <div>
                             <label className="text-xs font-bold uppercase text-slate-500">Note Speciale</label>
                             <textarea className="w-full border rounded-lg p-2.5 mt-1 text-sm" rows={2} value={newRes.notes || ''} onChange={e => setNewRes({...newRes, notes: e.target.value})} placeholder="ex: Scaun copil, Alergii..."></textarea>
                        </div>

                        <button onClick={handleCreate} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 mt-2">
                            Salveaza Rezervare
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Waitlist Modal */}
        {isWaitlistModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Adauga Walk-In</h3>
                        <button onClick={() => setIsWaitlistModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Nume Client</label>
                            <input className="w-full border rounded-lg p-2.5 mt-1" value={newWait.customerName || ''} onChange={e => setNewWait({...newWait, customerName: e.target.value})} autoFocus/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Nr. Persoane</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={newWait.partySize} onChange={e => setNewWait({...newWait, partySize: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Timp Estimat (min)</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={newWait.estimatedWaitTime} onChange={e => setNewWait({...newWait, estimatedWaitTime: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Telefon (pt. SMS - Optional)</label>
                            <input className="w-full border rounded-lg p-2.5 mt-1" value={newWait.phone || ''} onChange={e => setNewWait({...newWait, phone: e.target.value})} placeholder="07..."/>
                        </div>
                        <button onClick={handleAddWaitlist} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 mt-2">
                            Adauga in Lista
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
