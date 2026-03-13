
import React, { useState, useEffect } from 'react';
import { Table, Reservation } from '../types';
import { ApiService } from '../services/api';
import { CalendarClock, Clock, Users, ArrowRight, CheckCircle, AlertOctagon } from 'lucide-react';

export const Hostess: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewTime, setViewTime] = useState(18); // Default 18:00
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  useEffect(() => {
      const load = async () => {
          const [t, r] = await Promise.all([ApiService.getTables(), ApiService.getReservations()]);
          setTables(t);
          setReservations(r);
      };
      load();
  }, []);

  const refresh = async () => setReservations(await ApiService.getReservations());

  // Filter reservations for selected date
  const dailyReservations = reservations.filter(r => r.date === selectedDate && r.status !== 'cancelled');

  // Check table status at specific time
  const getTableStatusAtTime = (tableId: number, hour: number) => {
      const timeStr = `${hour}:00`;
      // Assume 2 hour duration
      const conflict = dailyReservations.find(r => {
          if (r.tableId !== tableId) return false;
          const resH = parseInt(r.time.split(':')[0]);
          return resH <= hour && resH + 2 > hour;
      });
      return conflict;
  };

  const handleAssignTable = async (tableId: number) => {
      if(!selectedRes) return;
      
      // Check conflict
      const existing = getTableStatusAtTime(tableId, parseInt(selectedRes.time.split(':')[0]));
      if(existing) {
          if(!confirm(`ATENTIE: Masa ${tableId} este deja rezervata de ${existing.customerName} la ora ${existing.time}. Suprapui?`)) return;
      }

      await ApiService.updateReservation(selectedRes.id, { status: 'confirmed', tableId: tableId });
      
      alert(`Rezervarea pentru ${selectedRes.customerName} a fost alocata la Masa ${tableId}`);
      
      setSelectedRes(null);
      refresh();
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarClock className="text-purple-600"/> Hostess & Planificare Sala
                </h2>
                <p className="text-slate-500 text-sm">Vizualizeaza ocuparea viitoare si aloca mese.</p>
            </div>
            <input 
                type="date" 
                className="border rounded-lg p-2 font-bold text-slate-700"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
            />
        </div>

        <div className="flex gap-6 h-full overflow-hidden">
            {/* Sidebar: Unassigned Reservations */}
            <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50">
                    <h3 className="font-bold text-slate-700">Rezervari Nealocate</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {dailyReservations.filter(r => !r.tableId).map(res => (
                        <div 
                            key={res.id}
                            onClick={() => setSelectedRes(res)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedRes?.id === res.id ? 'bg-purple-50 border-purple-500 shadow-md' : 'bg-white hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-800">{res.customerName}</span>
                                <span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded">{res.time}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Users size={14}/> {res.guests}</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> 2h</span>
                            </div>
                        </div>
                    ))}
                    {dailyReservations.filter(r => !r.tableId).length === 0 && (
                        <p className="text-center text-slate-400 py-4 italic">Toate rezervarile au masa.</p>
                    )}
                </div>
            </div>

            {/* Main Map with Time Slider */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                {/* Time Slider */}
                <div className="p-4 border-b bg-slate-900 text-white z-20">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm uppercase tracking-widest text-slate-400">Time Travel</span>
                        <span className="font-mono text-xl font-bold text-amber-400">{viewTime}:00</span>
                    </div>
                    <input 
                        type="range" 
                        min="10" 
                        max="23" 
                        step="1" 
                        value={viewTime} 
                        onChange={e => setViewTime(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                        <span>10:00</span>
                        <span>14:00</span>
                        <span>18:00</span>
                        <span>22:00</span>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                    {selectedRes && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-6 py-2 rounded-full shadow-lg z-30 font-bold animate-bounce flex items-center gap-2">
                            Selecteaza o masa pentru {selectedRes.customerName} <ArrowRight size={16}/>
                        </div>
                    )}

                    {tables.map(table => {
                        const reservationAtTime = getTableStatusAtTime(table.id, viewTime);
                        const isSelected = selectedRes?.guests && table.seats >= selectedRes.guests; // Simple logic suggestion
                        
                        return (
                            <button
                                key={table.id}
                                onClick={() => handleAssignTable(table.id)}
                                className={`absolute flex flex-col items-center justify-center font-bold border-2 shadow-md transition-all ${
                                    table.shape === 'round' ? 'rounded-full' : 'rounded-lg'
                                } ${
                                    table.shape === 'rectangle' ? 'w-24 h-16' : 'w-16 h-16'
                                } ${
                                    reservationAtTime
                                    ? 'bg-red-100 border-red-400 text-red-800' // Occupied at this time
                                    : selectedRes && isSelected
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800 scale-110 shadow-emerald-200' // Suggested
                                        : 'bg-white border-slate-300 text-slate-400'
                                }`}
                                style={{
                                    left: `${table.x || 10}%`,
                                    top: `${table.y || 10}%`
                                }}
                            >
                                <span className="text-lg">{table.id}</span>
                                <span className="text-[9px]">{table.seats} loc</span>
                                {reservationAtTime && (
                                    <div className="absolute -bottom-8 bg-red-600 text-white text-[9px] px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
                                        {reservationAtTime.customerName} ({reservationAtTime.time})
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};
