import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsType, Table, User, Role, PrinterConfig } from '../types';
import { ApiService } from '../services/api';
import { Save, Building2, Database, AlertOctagon, Layout, Users, Printer, Image, Plus, Trash2, UserPlus, RefreshCw } from 'lucide-react';

interface SettingsProps {
    tables?: Table[];
}

export const Settings: React.FC<SettingsProps> = ({ tables: initialTables = [] }) => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'tables' | 'users' | 'printers' | 'media' | 'system'>('general');
  
  // User Form
  const [newUser, setNewUser] = useState<Partial<User>>({ role: Role.WAITER, active: true, pin: '' });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Table Editor State
  const mapRef = useRef<HTMLDivElement>(null);
  const [draggedTable, setDraggedTable] = useState<number | null>(null);

  useEffect(() => {
      const load = async () => {
          const [s, t, u] = await Promise.all([
              ApiService.getSettings(),
              ApiService.getTables(),
              ApiService.getUsers()
          ]);
          setSettings(s);
          setTables(t);
          setUsers(u);
      };
      load();
  }, []);

  const handleSaveSettings = async () => {
      if(settings) {
          await ApiService.saveSettings(settings);
          alert("Configuratie salvata pe server!");
      }
  };

  const handleSaveTables = async () => {
      await ApiService.saveTables(tables);
      alert("Layout sala salvat!");
  };

  const handleAddTable = () => {
      const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
      setTables([...tables, { 
          id: newId, 
          zone: 'Interior', 
          seats: 4, 
          occupied: false, 
          reserved: false, 
          shape: 'square',
          x: 10, y: 10 
      }]);
  };

  const handleTableDragStart = (id: number) => setDraggedTable(id);
  
  const handleTableDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedTable !== null && mapRef.current) {
          const rect = mapRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          
          setTables(prev => prev.map(t => t.id === draggedTable ? { ...t, x, y } : t));
          setDraggedTable(null);
      }
  };

  const handleDeleteTable = (id: number) => {
      if(confirm("Stergi aceasta masa?")) {
          setTables(prev => prev.filter(t => t.id !== id));
      }
  };

  const handleCreateUser = async () => {
      if(!newUser.name || !newUser.pin) return alert("Nume si PIN obligatorii");
      if(newUser.pin.length !== 4) return alert("PIN-ul trebuie sa aiba 4 cifre");

      await ApiService.createUser({
          id: Date.now().toString(),
          name: newUser.name,
          pin: newUser.pin,
          role: newUser.role || Role.WAITER,
          active: true,
          tipPoints: 1
      });
      
      setUsers(await ApiService.getUsers());
      setIsUserModalOpen(false);
      setNewUser({ role: Role.WAITER, active: true, pin: '' });
  };

  const handleDeleteUser = async (id: string) => {
      if(confirm("Dezactivezi acest utilizator?")) {
          await ApiService.updateUser(id, { active: false });
          setUsers(await ApiService.getUsers());
      }
  };

  const handleAddPrinter = () => {
      if(!settings) return;
      const newPrinter: PrinterConfig = {
          id: Date.now().toString(),
          name: 'Printer Nou',
          ip: '192.168.1.200',
          type: 'receipt',
          categories: []
      };
      setSettings({
          ...settings,
          printers: [...(settings.printers || []), newPrinter]
      });
  };

  const handleFactoryReset = async () => {
      if(confirm("ATENTIE! Aceasta actiune va sterge TOATE datele din baza de date (Comenzi, Clienti, Meniu) si va restaura datele demo. Continuati?")) {
          if(confirm("Sunteti 100% sigur? Actiunea este ireversibila.")) {
              await fetch('http://localhost:3000/api/reset', { method: 'POST' });
              window.location.reload();
          }
      }
  };

  if(!settings) return <div>Loading...</div>;

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Administrare Sistem</h2>
            <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`p-2 rounded-md ${activeTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="General"><Building2 size={20}/></button>
                <button onClick={() => setActiveTab('tables')} className={`p-2 rounded-md ${activeTab === 'tables' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="Mese"><Layout size={20}/></button>
                <button onClick={() => setActiveTab('users')} className={`p-2 rounded-md ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="Utilizatori"><Users size={20}/></button>
                <button onClick={() => setActiveTab('printers')} className={`p-2 rounded-md ${activeTab === 'printers' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="Imprimante"><Printer size={20}/></button>
                <button onClick={() => setActiveTab('media')} className={`p-2 rounded-md ${activeTab === 'media' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="Media"><Image size={20}/></button>
                <button onClick={() => setActiveTab('system')} className={`p-2 rounded-md ${activeTab === 'system' ? 'bg-slate-900 text-white' : 'text-slate-500'}`} title="Sistem"><Database size={20}/></button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 overflow-y-auto">
            {activeTab === 'general' && (
                <div className="max-w-xl space-y-4">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Profil Locatie</h3>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nume Restaurant</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={settings.restaurantName} onChange={e => setSettings({...settings, restaurantName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">CUI</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={settings.cui} onChange={e => setSettings({...settings, cui: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Moneda</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mt-6 mb-4 border-b pb-2">Preferinte</h3>
                    <div className="space-y-3">
                         <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" id="allowNeg" className="w-5 h-5 text-emerald-600 rounded"
                                checked={settings.allowNegativeStock || false}
                                onChange={e => setSettings({...settings, allowNegativeStock: e.target.checked})}
                            />
                            <label htmlFor="allowNeg" className="text-sm font-medium">Permite stoc negativ</label>
                         </div>
                         <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" id="training" className="w-5 h-5 text-emerald-600 rounded"
                                checked={settings.trainingMode || false}
                                onChange={e => setSettings({...settings, trainingMode: e.target.checked})}
                            />
                            <label htmlFor="training" className="text-sm font-medium">Training Mode (Banda galbena)</label>
                         </div>
                         <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" id="maint" className="w-5 h-5 text-emerald-600 rounded"
                                checked={settings.maintenanceMode || false}
                                onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                            />
                            <label htmlFor="maint" className="text-sm font-medium">Mod Mentenanta (Blocheaza acces non-admin)</label>
                         </div>
                    </div>

                    <div className="pt-4 mt-4 border-t">
                        <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800">
                            <Save size={20}/> Salveaza
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'tables' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-lg">Editor Plan Sala (Drag & Drop)</h3>
                        <div className="flex gap-2">
                            <button onClick={handleAddTable} className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-slate-50"><Plus size={16}/> Masa Noua</button>
                            <button onClick={handleSaveTables} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 font-bold"><Save size={16}/> Salveaza Layout</button>
                        </div>
                    </div>
                    <div 
                        ref={mapRef}
                        className="flex-1 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl relative overflow-hidden"
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleTableDrop}
                    >
                        {tables.map(table => (
                            <div
                                key={table.id}
                                draggable
                                onDragStart={() => handleTableDragStart(table.id)}
                                className={`absolute flex flex-col items-center justify-center border-2 bg-white shadow-md cursor-move ${table.shape === 'round' ? 'rounded-full w-16 h-16' : 'rounded-lg w-16 h-16'} hover:border-blue-500`}
                                style={{ left: `${table.x}%`, top: `${table.y}%` }}
                            >
                                <span className="font-bold">{table.id}</span>
                                <span className="text-[10px] text-slate-500">{table.seats} loc</span>
                                <button 
                                    onClick={() => handleDeleteTable(table.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Trage mesele pentru a le pozitiona. Apasa Salveaza Layout pentru a aplica modificarile pe toate dispozitivele.</p>
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-lg">Gestiune Personal</h3>
                        <button onClick={() => setIsUserModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><UserPlus size={18}/> Adauga</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map(u => (
                            <div key={u.id} className={`p-4 border rounded-xl flex justify-between items-center ${u.active ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role === Role.ADMIN ? 'bg-red-500' : 'bg-slate-500'}`}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{u.name}</div>
                                        <div className="text-xs uppercase font-bold text-slate-500">{u.role}</div>
                                        <div className="text-xs font-mono text-slate-400 mt-1">PIN: ****</div>
                                    </div>
                                </div>
                                {u.role !== Role.ADMIN && (
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'printers' && (
                <div className="max-w-2xl">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-lg">Configurare Imprimante (IP)</h3>
                        <button onClick={handleAddPrinter} className="text-sm bg-slate-100 px-3 py-2 rounded-lg font-bold hover:bg-slate-200">+ Imprimanta</button>
                    </div>
                    <div className="space-y-4">
                        {settings.printers?.map((printer, idx) => (
                            <div key={idx} className="p-4 border rounded-xl flex gap-4 items-center bg-slate-50">
                                <Printer size={24} className="text-slate-400"/>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <input className="border p-2 rounded" value={printer.name} onChange={e => {
                                        const newPrinters = [...(settings.printers || [])];
                                        newPrinters[idx].name = e.target.value;
                                        setSettings({...settings, printers: newPrinters});
                                    }} />
                                    <input className="border p-2 rounded font-mono" value={printer.ip} onChange={e => {
                                        const newPrinters = [...(settings.printers || [])];
                                        newPrinters[idx].ip = e.target.value;
                                        setSettings({...settings, printers: newPrinters});
                                    }} />
                                </div>
                            </div>
                        ))}
                        {(!settings.printers || settings.printers.length === 0) && <p className="text-slate-400 italic">Nicio imprimanta configurata.</p>}
                    </div>
                    <div className="mt-6">
                        <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">Salveaza Config</button>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Database/> Intretinere Sistem</h3>
                    
                    <div className="space-y-6">
                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2"><RefreshCw size={18}/> Sincronizare Date</h4>
                            <p className="text-sm text-indigo-600 mb-4">Forteaza o resincronizare a stocurilor si cache-ului local.</p>
                            <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700">
                                Reload App
                            </button>
                        </div>

                        <div className="p-6 bg-red-50 border border-red-100 rounded-xl">
                            <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertOctagon size={18}/> Factory Reset</h4>
                            <p className="text-sm text-red-600 mb-4">Aceasta actiune va sterge TOATE datele din baza de date (Comenzi, Clienti, Meniu) si va restaura datele demo.</p>
                            <button onClick={handleFactoryReset} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200">
                                Reseteaza Tot
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'media' && (
                 <div className="max-w-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Image/> Media & Display</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Kiosk Screensaver URL</label>
                            <input 
                                className="w-full border rounded-lg px-3 py-2 text-sm font-mono" 
                                value={settings.media?.kioskScreensaver || ''} 
                                onChange={e => setSettings({...settings, media: {...settings.media, kioskScreensaver: e.target.value}})} 
                                placeholder="https://..."
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label>
                            <input 
                                className="w-full border rounded-lg px-3 py-2 text-sm font-mono" 
                                value={settings.media?.logoUrl || ''} 
                                onChange={e => setSettings({...settings, media: {...settings.media, logoUrl: e.target.value}})} 
                            />
                        </div>
                         <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800">
                            <Save size={20}/> Salveaza
                        </button>
                    </div>
                 </div>
            )}
        </div>

        {/* New User Modal */}
        {isUserModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Adauga Utilizator</h3>
                    <div className="space-y-4">
                        <input className="w-full border p-2 rounded" placeholder="Nume" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="PIN (4 cifre)" maxLength={4} value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} />
                        <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                            <option value={Role.WAITER}>Ospatar</option>
                            <option value={Role.CHEF}>Bucatar</option>
                            <option value={Role.BARTENDER}>Barman</option>
                            <option value={Role.MANAGER}>Manager</option>
                            <option value={Role.DRIVER}>Sofer</option>
                            <option value={Role.ADMIN}>Admin</option>
                        </select>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 border rounded font-bold text-slate-500">Anuleaza</button>
                            <button onClick={handleCreateUser} className="flex-1 py-2 bg-slate-900 text-white rounded font-bold">Creeaza</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};