
import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { ApiService } from '../services/api';

export const PublicReservation: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      pax: 2,
      name: '',
      phone: '',
      email: '',
      notes: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const handleCheck = () => {
      setIsChecking(true);
      setTimeout(() => {
          const hour = parseInt(formData.time.split(':')[0]);
          const isOk = hour >= 12 && hour <= 22; 
          setIsAvailable(isOk);
          setIsChecking(false);
      }, 1000);
  };

  const handleBook = async () => {
      await ApiService.addReservation({
          id: Date.now().toString(),
          customerName: formData.name,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          guests: formData.pax,
          status: 'pending',
          notes: formData.notes
      });
      setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')] bg-cover opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-serif font-bold mb-2">HorecaAI Bistro</h1>
                    <p className="text-slate-300 text-sm uppercase tracking-widest">Rezerva o Masa</p>
                </div>
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                            <div className="flex items-center border rounded-xl p-3 bg-slate-50">
                                <Calendar className="text-slate-400 mr-3" size={20}/>
                                <input type="date" className="bg-transparent outline-none w-full font-bold text-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ora</label>
                                <div className="flex items-center border rounded-xl p-3 bg-slate-50">
                                    <Clock className="text-slate-400 mr-3" size={20}/>
                                    <select className="bg-transparent outline-none w-full font-bold text-slate-700" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                                        <option>12:00</option><option>13:00</option><option>14:00</option><option>19:00</option><option>20:00</option><option>21:00</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Persoane</label>
                                <div className="flex items-center border rounded-xl p-3 bg-slate-50">
                                    <Users className="text-slate-400 mr-3" size={20}/>
                                    <input type="number" min="1" max="20" className="bg-transparent outline-none w-full font-bold text-slate-700" value={formData.pax} onChange={e => setFormData({...formData, pax: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>

                        {isAvailable === false && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-bold">
                                Ne pare rau, nu avem mese disponibile la aceasta ora.
                            </div>
                        )}

                        <button 
                            onClick={handleCheck} 
                            disabled={isChecking}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-all"
                        >
                            {isChecking ? 'Verific...' : isAvailable ? 'Continua' : 'Cauta Masa'} {isAvailable && <ChevronRight size={20}/>}
                        </button>
                        
                        {isAvailable && (
                            <button onClick={() => setStep(2)} className="w-full text-center text-sm font-bold text-blue-600 hover:underline animate-in fade-in">
                                Masa este libera! Mergi la pasul urmator.
                            </button>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Detaliile Tale</h3>
                        <input className="w-full border rounded-xl p-3" placeholder="Nume Complet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input className="w-full border rounded-xl p-3" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        <input className="w-full border rounded-xl p-3" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <textarea className="w-full border rounded-xl p-3" placeholder="Cerinte speciale (alergeni, scaun copil)..." rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(1)} className="px-6 py-3 border rounded-xl font-bold text-slate-500">Inapoi</button>
                            <button onClick={handleBook} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                                Confirma Rezervarea
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-8 animate-in zoom-in">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40}/>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Rezervare Trimisa!</h2>
                        <p className="text-slate-500 mb-8">Veti primi confirmarea prin SMS/Email in scurt timp.</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block text-left text-sm text-slate-600 space-y-1 mb-8">
                            <div><strong>Nume:</strong> {formData.name}</div>
                            <div><strong>Data:</strong> {formData.date} @ {formData.time}</div>
                            <div><strong>Persoane:</strong> {formData.pax}</div>
                        </div>
                        <button onClick={() => { setStep(1); setIsAvailable(null); }} className="block w-full py-3 text-blue-600 font-bold hover:bg-blue-50 rounded-xl">
                            Rezerva din nou
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
