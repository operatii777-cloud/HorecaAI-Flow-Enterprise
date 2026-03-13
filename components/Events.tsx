
import React, { useState, useEffect } from 'react';
import { CateringEvent, EventStatus, EventType } from '../types';
import { ApiService } from '../services/api';
import { Calendar, Plus, Printer, FileText, CheckCircle, Clock, Users, DollarSign, ArrowRight, X } from 'lucide-react';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CateringEvent | null>(null);
  const [showBEO, setShowBEO] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CateringEvent>>({
      type: 'PrivateParty',
      status: 'Lead',
      pax: 20,
      budgetPerPax: 150
  });

  useEffect(() => {
      ApiService.getEvents().then(setEvents);
  }, []);

  const refresh = async () => setEvents(await ApiService.getEvents());

  const handleCreate = async () => {
      if(!formData.name || !formData.clientName) return alert("Nume Eveniment si Client sunt obligatorii.");
      
      const newEvent: CateringEvent = {
          id: Date.now().toString(),
          name: formData.name,
          type: formData.type as EventType,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          startTime: formData.startTime || '12:00',
          endTime: formData.endTime || '16:00',
          pax: formData.pax || 20,
          budgetPerPax: formData.budgetPerPax || 100,
          totalBudget: (formData.pax || 20) * (formData.budgetPerPax || 100),
          depositPaid: formData.depositPaid || 0,
          status: 'Lead',
          notes: formData.notes || '',
          beoNumber: `BEO-${Date.now().toString().slice(-6)}`,
          setupDetails: formData.setupDetails || ''
      };
      
      await ApiService.createEvent(newEvent);
      refresh();
      setIsModalOpen(false);
      setFormData({ type: 'PrivateParty', status: 'Lead', pax: 20, budgetPerPax: 150 });
  };

  const updateStatus = async (id: string, status: EventStatus) => {
      await ApiService.updateEvent(id, { status });
      refresh();
  };

  const KanbanColumn = ({ status, title, icon: Icon }: any) => {
      const items = events.filter(e => e.status === status);
      return (
          <div className="flex-1 min-w-[280px] bg-slate-100 rounded-xl p-4 flex flex-col h-full border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Icon size={18}/> {title}
                  </h3>
                  <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-slate-500 shadow-sm">{items.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {items.map(ev => (
                      <div key={ev.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group" onClick={() => { setSelectedEvent(ev); setShowBEO(true); }}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-800 text-sm">{ev.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{new Date(ev.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">{ev.clientName} • {ev.pax} Pax</div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className="font-bold text-emerald-600 text-xs">{ev.totalBudget} RON</span>
                              {status !== 'Completed' && status !== 'Cancelled' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateStatus(ev.id, getNextStatus(status)); }}
                                    className="p-1 hover:bg-slate-100 rounded-full text-blue-600"
                                    title="Move Next"
                                  >
                                      <ArrowRight size={14}/>
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const getNextStatus = (current: EventStatus): EventStatus => {
      if(current === 'Lead') return 'OfferSent';
      if(current === 'OfferSent') return 'Confirmed';
      if(current === 'Confirmed') return 'InProgress';
      if(current === 'InProgress') return 'Completed';
      return current;
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="text-pink-600"/> Management Evenimente
                </h2>
                <p className="text-slate-500 text-sm">Organizare nunti, conferinte si catering.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
                <Plus size={18}/> Eveniment Nou
            </button>
        </div>

        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 h-full min-w-max">
                <KanbanColumn status="Lead" title="Solicitari Noi" icon={Users} />
                <KanbanColumn status="OfferSent" title="Oferta Trimisa" icon={FileText} />
                <KanbanColumn status="Confirmed" title="Confirmat (Avans)" icon={CheckCircle} />
                <KanbanColumn status="InProgress" title="In Desfasurare" icon={Clock} />
                <KanbanColumn status="Completed" title="Finalizat" icon={DollarSign} />
            </div>
        </div>

        {/* Create Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Planificare Eveniment</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Nume Eveniment</label>
                            <input className="w-full border rounded-lg p-2.5 mt-1" placeholder="ex: Nunta Popescu" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Tip</label>
                                <select className="w-full border rounded-lg p-2.5 mt-1" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                    <option value="Wedding">Nunta</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Birthday">Aniversare</option>
                                    <option value="Conference">Conferinta</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Data</label>
                                <input type="date" className="w-full border rounded-lg p-2.5 mt-1" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Client</label>
                                <input className="w-full border rounded-lg p-2.5 mt-1" placeholder="Nume contact" value={formData.clientName || ''} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Telefon</label>
                                <input className="w-full border rounded-lg p-2.5 mt-1" value={formData.clientPhone || ''} onChange={e => setFormData({...formData, clientPhone: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Nr. Pax</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={formData.pax} onChange={e => setFormData({...formData, pax: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Buget/Pax</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={formData.budgetPerPax} onChange={e => setFormData({...formData, budgetPerPax: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Avans</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 mt-1" value={formData.depositPaid} onChange={e => setFormData({...formData, depositPaid: Number(e.target.value)})} />
                            </div>
                        </div>
                        
                        <button onClick={handleCreate} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 mt-2">
                            Creaza Eveniment
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* BEO Modal */}
        {showBEO && selectedEvent && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-[210mm] h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center no-print">
                        <h3 className="font-bold text-lg">Banquet Event Order (BEO)</h3>
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800">
                                <Printer size={18}/> Printeaza
                            </button>
                            <button onClick={() => setShowBEO(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold">Inchide</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-12 bg-white print-container font-serif text-slate-900">
                        <div className="flex justify-between border-b-2 border-slate-900 pb-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold uppercase tracking-widest">Function Sheet</h1>
                                <p className="text-sm font-bold text-slate-500">{selectedEvent.beoNumber}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold">HorecaAI Grand Hotel</h2>
                                <p className="text-sm">Str. Evenimentelor Nr. 1</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-slate-200 pb-8">
                            <div className="space-y-2">
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Event Name:</span> <span className="font-bold">{selectedEvent.name}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Date:</span> <span>{new Date(selectedEvent.date).toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Time:</span> <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Type:</span> <span>{selectedEvent.type}</span></div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Client:</span> <span className="font-bold">{selectedEvent.clientName}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Contact:</span> <span>{selectedEvent.clientPhone}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Guests (Pax):</span> <span className="font-bold text-xl">{selectedEvent.pax}</span></div>
                                <div className="flex justify-between"><span className="font-bold text-slate-500 uppercase text-xs">Location:</span> <span>Ballroom A</span></div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold border-b border-slate-900 mb-4 uppercase text-sm">Room Setup & Notes</h3>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded min-h-[100px] whitespace-pre-wrap text-sm">
                                {selectedEvent.setupDetails || "Setup standard. Mese rotunde de 10 persoane. Prezidiu pentru 4 persoane."}
                                <br/><br/>
                                <strong>Note Speciale:</strong> {selectedEvent.notes || "-"}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold border-b border-slate-900 mb-4 uppercase text-sm">Menu Selection</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-100 text-left">
                                        <th className="p-2">Item</th>
                                        <th className="p-2 text-right">Qty</th>
                                        <th className="p-2 text-right">Price</th>
                                        <th className="p-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-2">Meniu Standard {selectedEvent.type}</td>
                                        <td className="p-2 text-right">{selectedEvent.pax}</td>
                                        <td className="p-2 text-right">{selectedEvent.budgetPerPax.toFixed(2)}</td>
                                        <td className="p-2 text-right font-bold">{selectedEvent.totalBudget.toFixed(2)}</td>
                                    </tr>
                                    {/* Mock Extra Items */}
                                    <tr className="border-b">
                                        <td className="p-2">Tort Festiv (Extra)</td>
                                        <td className="p-2 text-right">1</td>
                                        <td className="p-2 text-right">800.00</td>
                                        <td className="p-2 text-right font-bold">800.00</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="text-lg">
                                        <td colSpan={3} className="p-2 text-right font-bold">Grand Total</td>
                                        <td className="p-2 text-right font-bold">{(selectedEvent.totalBudget + 800).toFixed(2)} RON</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="p-2 text-right text-slate-500">Deposit Paid</td>
                                        <td className="p-2 text-right text-emerald-600 font-bold">-{selectedEvent.depositPaid.toFixed(2)} RON</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t-2 border-slate-200">
                            <div className="text-center">
                                <div className="h-16 border-b border-slate-400 mb-2"></div>
                                <span className="text-xs uppercase font-bold text-slate-500">Client Signature</span>
                            </div>
                            <div className="text-center">
                                <div className="h-16 border-b border-slate-400 mb-2"></div>
                                <span className="text-xs uppercase font-bold text-slate-500">Event Manager</span>
                            </div>
                            <div className="text-center">
                                <div className="h-16 border-b border-slate-400 mb-2"></div>
                                <span className="text-xs uppercase font-bold text-slate-500">General Manager</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
