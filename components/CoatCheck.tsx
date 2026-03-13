
import React, { useState, useEffect } from 'react';
import { CoatCheckTicket, Table } from '../types';
import { ApiService } from '../services/api';
import { Tag, Plus, User, ArrowUpRight } from 'lucide-react';

export const CoatCheck: React.FC = () => {
  const [tickets, setTickets] = useState<CoatCheckTicket[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTab, setActiveTab] = useState<'stored' | 'history'>('stored');
  const [newTicket, setNewTicket] = useState<Partial<CoatCheckTicket>>({
      type: 'Coat',
      ticketNumber: 1
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
      const load = async () => {
          const [t, tbls] = await Promise.all([ApiService.getCoatCheckTickets(), ApiService.getTables()]);
          setTickets(t);
          setTables(tbls);
          const maxNum = t.length > 0 ? Math.max(...t.map(i => i.ticketNumber)) : 0;
          setNewTicket(prev => ({ ...prev, ticketNumber: maxNum + 1 }));
      };
      load();
  }, [activeTab]);

  const refresh = async () => {
      setTickets(await ApiService.getCoatCheckTickets());
  };

  const handleCheckIn = async () => {
      const ticket: CoatCheckTicket = {
          id: Date.now().toString(),
          ticketNumber: newTicket.ticketNumber || 1,
          type: newTicket.type || 'Coat',
          tableId: newTicket.tableId,
          guestName: newTicket.guestName,
          checkInTime: Date.now(),
          status: 'Stored',
          location: newTicket.location
      };
      await ApiService.addCoatCheckTicket(ticket);
      refresh();
      setIsModalOpen(false);
      setNewTicket(prev => ({ 
          type: 'Coat', 
          ticketNumber: (prev.ticketNumber || 0) + 1,
          guestName: '',
          tableId: undefined,
          location: '' 
      }));
  };

  const handleReturn = async (id: string) => {
      if(confirm("Confirmi returnarea articolului?")) {
          await ApiService.returnCoatCheckTicket(id);
          refresh();
      }
  };

  const activeTickets = tickets.filter(t => t.status === 'Stored');
  const historyTickets = tickets.filter(t => t.status === 'Returned').sort((a,b) => (b.checkOutTime || 0) - (a.checkOutTime || 0));

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Tag className="text-indigo-600"/> Garderoba & Valet
                </h2>
                <p className="text-slate-500 text-sm">Gestioneaza haine, bagaje si chei masina.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('stored')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'stored' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Active ({activeTickets.length})</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'history' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Istoric</button>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg ml-2">
                    <Plus size={18}/> Check-In
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {activeTab === 'stored' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {activeTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-6xl text-slate-400 group-hover:scale-110 transition-transform">
                                {ticket.ticketNumber}
                            </div>
                            <div className="relative z-10">
                                <div className="text-4xl font-black text-indigo-600 mb-2">{ticket.ticketNumber}</div>
                                <div className="text-sm font-bold text-slate-800 uppercase mb-1">{ticket.type}</div>
                                {ticket.tableId && (
                                    <div className="text-xs text-slate-500 font-bold mb-1">Masa {ticket.tableId}</div>
                                )}
                                {ticket.guestName && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1"><User size={10}/> {ticket.guestName}</div>
                                )}
                                {ticket.location && (
                                    <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit mt-2 font-bold border border-amber-100">
                                        Loc: {ticket.location}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => handleReturn(ticket.id)}
                                className="mt-4 w-full py-2 bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight size={16}/> Returneaza
                            </button>
                        </div>
                    ))}
                    {activeTickets.length === 0 && (
                        <div className="col-span-full text-center text-slate-400 py-12 flex flex-col items-center">
                            <Tag size={48} className="mb-4 opacity-20"/>
                            <p>Garderoba este goala.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Nr.</th>
                                <th className="p-4">Tip</th>
                                <th className="p-4">Client / Masa</th>
                                <th className="p-4">Check-In</th>
                                <th className="p-4">Check-Out</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyTickets.map(ticket => (
                                <tr key={ticket.id} className="border-b hover:bg-slate-50">
                                    <td className="p-4 font-mono font-bold text-indigo-600">{ticket.ticketNumber}</td>
                                    <td className="p-4">{ticket.type}</td>
                                    <td className="p-4">
                                        {ticket.guestName || '-'} {ticket.tableId ? `(Masa ${ticket.tableId})` : ''}
                                    </td>
                                    <td className="p-4">{new Date(ticket.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="p-4 text-emerald-600 font-bold">{new Date(ticket.checkOutTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Check-In Articol</h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Numar Tichet</label>
                                <input type="number" className="w-full border rounded-lg p-2 mt-1 font-bold text-lg" value={newTicket.ticketNumber} onChange={e => setNewTicket({...newTicket, ticketNumber: Number(e.target.value)})}/>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Tip</label>
                                <select className="w-full border rounded-lg p-2 mt-1 font-bold" value={newTicket.type} onChange={e => setNewTicket({...newTicket, type: e.target.value as any})}>
                                    <option>Coat</option>
                                    <option>Bag</option>
                                    <option>Umbrella</option>
                                    <option>Valet Key</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Locatie (Optional)</label>
                            <input className="w-full border rounded-lg p-2 mt-1" placeholder="ex: Cuier A, Carlig 5" value={newTicket.location || ''} onChange={e => setNewTicket({...newTicket, location: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Masa (Optional)</label>
                                <select className="w-full border rounded-lg p-2 mt-1" value={newTicket.tableId || ''} onChange={e => setNewTicket({...newTicket, tableId: Number(e.target.value)})}>
                                    <option value="">--</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Nume Client</label>
                                <input className="w-full border rounded-lg p-2 mt-1" value={newTicket.guestName || ''} onChange={e => setNewTicket({...newTicket, guestName: e.target.value})}/>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-slate-500">Anuleaza</button>
                            <button onClick={handleCheckIn} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Check In</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
