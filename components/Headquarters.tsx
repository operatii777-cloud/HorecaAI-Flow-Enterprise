
import React, { useState } from 'react';
import { MapPin, TrendingUp, Users, AlertTriangle, ArrowUpRight, DollarSign, Activity, Globe } from 'lucide-react';
import { LocationStats } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Headquarters: React.FC = () => {
  // Mock Data for Multiple Locations
  const locations: LocationStats[] = [
      { id: 'loc1', name: 'Bucuresti (HQ)', status: 'online', salesToday: 12500, salesTarget: 15000, activeOrders: 12, staffActive: 8, alerts: 0, coordinates: { lat: 44.42, lng: 26.10 } },
      { id: 'loc2', name: 'Cluj-Napoca', status: 'online', salesToday: 9800, salesTarget: 10000, activeOrders: 8, staffActive: 6, alerts: 1, coordinates: { lat: 46.77, lng: 23.62 } },
      { id: 'loc3', name: 'Timisoara', status: 'warning', salesToday: 4200, salesTarget: 8000, activeOrders: 3, staffActive: 4, alerts: 3, coordinates: { lat: 45.74, lng: 21.20 } },
      { id: 'loc4', name: 'Iasi', status: 'offline', salesToday: 0, salesTarget: 7000, activeOrders: 0, staffActive: 0, alerts: 0, coordinates: { lat: 47.15, lng: 27.60 } },
  ];

  const totalSales = locations.reduce((acc, l) => acc + l.salesToday, 0);
  const totalTarget = locations.reduce((acc, l) => acc + l.salesTarget, 0);
  const activeStaff = locations.reduce((acc, l) => acc + l.staffActive, 0);
  const totalAlerts = locations.reduce((acc, l) => acc + l.alerts, 0);

  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);

  const chartData = locations.map(l => ({
      name: l.name.split(' ')[0],
      sales: l.salesToday,
      target: l.salesTarget
  }));

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-900 text-slate-100 overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider">
                    <Globe className="text-blue-500" size={32}/> Headquarters (HQ)
                </h2>
                <p className="text-slate-400 text-sm mt-1">Global Operations Center • Live Data</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="text-xs text-slate-500 font-bold uppercase">Total Network Revenue</div>
                    <div className="text-3xl font-bold text-emerald-400">{totalSales.toLocaleString()} RON</div>
                </div>
                <div className="h-10 w-px bg-slate-800"></div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-emerald-500">SYSTEM ONLINE</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64}/></div>
                <div className="text-sm font-bold text-slate-400 uppercase mb-2">Realizare Target Global</div>
                <div className="text-4xl font-bold text-white mb-2">{((totalSales / totalTarget) * 100).toFixed(1)}%</div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{width: `${(totalSales/totalTarget)*100}%`}}></div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Target: {totalTarget.toLocaleString()} RON</div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64}/></div>
                <div className="text-sm font-bold text-slate-400 uppercase mb-2">Staff Activ (Global)</div>
                <div className="text-4xl font-bold text-white mb-2">{activeStaff}</div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-900/30 px-2 py-1 rounded w-fit">
                    <ArrowUpRight size={12}/> Shift Coverage 92%
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64}/></div>
                <div className="text-sm font-bold text-slate-400 uppercase mb-2">Comenzi Active</div>
                <div className="text-4xl font-bold text-white mb-2">{locations.reduce((a,b) => a + b.activeOrders, 0)}</div>
                <div className="text-xs text-slate-500">Avg Ticket Time: 18 min</div>
            </div>

            <div className={`p-6 rounded-2xl border relative overflow-hidden transition-colors ${totalAlerts > 0 ? 'bg-red-900/20 border-red-900' : 'bg-slate-800 border-slate-700'}`}>
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${totalAlerts > 0 ? 'text-red-500' : 'text-slate-500'}`}><AlertTriangle size={64}/></div>
                <div className={`text-sm font-bold uppercase mb-2 ${totalAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`}>Alerte Critice</div>
                <div className={`text-4xl font-bold mb-2 ${totalAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{totalAlerts}</div>
                <div className="text-xs text-slate-500">{totalAlerts > 0 ? 'Actiune Necesara Imediata' : 'Sistem Nominal'}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
            {/* Map Visual (Mock) */}
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#475569 2px, transparent 2px)',
                    backgroundSize: '30px 30px',
                    backgroundColor: '#0f172a'
                }}></div>
                
                {/* Romania Pseudo-Map Points */}
                <div className="relative w-[80%] h-[80%]">
                    {locations.map(loc => {
                        // Normalize coords to % for demo (Rough approximation for Romania shape)
                        // Lat 44-48, Lng 20-30
                        const y = 100 - ((loc.coordinates.lat - 43.5) / (48.5 - 43.5)) * 100;
                        const x = ((loc.coordinates.lng - 20) / (30 - 20)) * 100;
                        const isSelected = selectedLoc === loc.id;

                        return (
                            <div 
                                key={loc.id}
                                className="absolute cursor-pointer group"
                                style={{ top: `${y}%`, left: `${x}%` }}
                                onClick={() => setSelectedLoc(loc.id)}
                            >
                                <div className="relative flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 shadow-[0_0_20px_currentColor] transition-all duration-300 ${
                                        loc.status === 'online' ? 'bg-emerald-500 border-emerald-300 text-emerald-500' : 
                                        loc.status === 'warning' ? 'bg-orange-500 border-orange-300 text-orange-500' : 
                                        'bg-slate-600 border-slate-400 text-slate-500'
                                    } ${isSelected ? 'scale-150' : 'group-hover:scale-125'}`}></div>
                                    
                                    {loc.status === 'warning' && <div className="absolute -top-8 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-bounce">ALERTA</div>}
                                    
                                    <div className={`mt-2 text-xs font-bold px-2 py-1 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700 whitespace-nowrap ${isSelected ? 'text-white border-blue-500' : 'text-slate-400'}`}>
                                        {loc.name}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {selectedLoc && (() => {
                    const loc = locations.find(l => l.id === selectedLoc);
                    if(!loc) return null;
                    return (
                        <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur border border-slate-600 p-4 rounded-xl w-64 animate-in slide-in-from-bottom shadow-2xl">
                            <h4 className="font-bold text-white text-lg mb-2">{loc.name}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400"><span>Status:</span> <span className={`font-bold uppercase ${loc.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>{loc.status}</span></div>
                                <div className="flex justify-between text-slate-400"><span>Vanzari:</span> <span className="text-white font-mono">{loc.salesToday} RON</span></div>
                                <div className="flex justify-between text-slate-400"><span>Target:</span> <span className="text-white font-mono">{((loc.salesToday/loc.salesTarget)*100).toFixed(0)}%</span></div>
                                <div className="flex justify-between text-slate-400"><span>Staff:</span> <span className="text-white">{loc.staffActive} pers</span></div>
                            </div>
                            <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-blue-700">
                                Acceseaza Locatie
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Performance Chart */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-400"/> Performanta Comparativa
                </h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                            <XAxis type="number" hide/>
                            <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            />
                            <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Vanzari" stackId="a" />
                            <Bar dataKey="target" fill="#334155" radius={[0, 4, 4, 0]} barSize={20} name="Target" stackId="b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};
