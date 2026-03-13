
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { HaccpLog, CleaningTask, MaintenanceLog, Asset } from '../types';
import { ApiService } from '../services/api';
import { ClipboardCheck, Thermometer, Wrench, CheckCircle, AlertTriangle, Plus, PenTool, Monitor, Archive, Box } from 'lucide-react';

export const Compliance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'haccp' | 'cleaning' | 'maintenance' | 'assets'>('haccp');
  const [haccpLogs, setHaccpLogs] = useState<HaccpLog[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Forms
  const [tempData, setTempData] = useState({ equipment: 'Frigider Carne', temp: 3 });
  const [maintData, setMaintData] = useState({ equipment: '', issue: '' });
  const [assetForm, setAssetForm] = useState<Partial<Asset>>({});
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const refresh = async () => {
      const [haccp, cleaning, maint, asts] = await Promise.all([
          ApiService.getHaccpLogs(),
          ApiService.getCleaningTasks(),
          ApiService.getMaintenanceLogs(),
          ApiService.getAssets()
      ]);
      setHaccpLogs(haccp);
      setCleaningTasks(cleaning);
      setMaintLogs(maint);
      setAssets(asts);
  };

  useEffect(() => {
      refresh();
  }, []);

  const handleLogTemp = async () => {
      const status = (tempData.temp >= 0 && tempData.temp <= 5) ? 'ok' : 'critical';
      const log: HaccpLog = {
          id: Date.now().toString(),
          equipmentId: tempData.equipment,
          temperature: tempData.temp,
          timestamp: Date.now(),
          user: 'Staff',
          status
      };
      await ApiService.addHaccpLog(log);
      refresh();
      if(status === 'critical') alert("ALERTA: Temperatura critica inregistrata!");
  };

  const handleCompleteTask = async (id: string) => {
      await ApiService.completeCleaningTask(id, 'Staff');
      refresh();
  };

  const handleReportIssue = async () => {
      if(!maintData.equipment || !maintData.issue) return;
      const log: MaintenanceLog = {
          id: Date.now().toString(),
          equipment: maintData.equipment,
          issue: maintData.issue,
          status: 'reported',
          reportedBy: 'Staff',
          date: new Date().toISOString()
      };
      await ApiService.addMaintenanceLog(log);
      setMaintData({ equipment: '', issue: '' });
      refresh();
  };

  const handleSaveAsset = async () => {
      if(!assetForm.name || !assetForm.serialNumber) return alert("Nume si Serie obligatorii");
      
      const newAsset: Asset = {
          id: Date.now().toString(),
          name: assetForm.name,
          serialNumber: assetForm.serialNumber,
          purchaseDate: assetForm.purchaseDate || new Date().toISOString().split('T')[0],
          warrantyExpires: assetForm.warrantyExpires || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          purchasePrice: assetForm.purchasePrice || 0,
          status: assetForm.status || 'active',
          location: assetForm.location || 'Kitchen',
          notes: assetForm.notes
      };
      await ApiService.addAsset(newAsset);
      refresh();
      setIsAssetModalOpen(false);
      setAssetForm({});
  };

  // Grid Defs
  const haccpDefs: ColDef<HaccpLog>[] = [
      { field: 'timestamp', headerName: 'Data/Ora', width: 180, valueFormatter: p => new Date(p.value).toLocaleString() },
      { field: 'equipmentId', headerName: 'Echipament', flex: 1 },
      { field: 'temperature', headerName: 'Temperatura', width: 120, cellRenderer: (p: any) => (
          <span className={`font-bold ${p.value > 5 ? 'text-red-600' : 'text-emerald-600'}`}>{p.value} °C</span>
      )},
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {p.value}
          </span>
      )},
      { field: 'user', headerName: 'Verificat De', width: 120 }
  ];

  const maintDefs: ColDef<MaintenanceLog>[] = [
      { field: 'date', headerName: 'Data', width: 120, valueFormatter: p => new Date(p.value).toLocaleDateString() },
      { field: 'equipment', headerName: 'Echipament', flex: 1 },
      { field: 'issue', headerName: 'Problema', flex: 2 },
      { field: 'status', headerName: 'Status', width: 120, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === 'fixed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {p.value}
          </span>
      )}
  ];

  const assetDefs: ColDef<Asset>[] = [
      { field: 'name', headerName: 'Nume Activ', flex: 1 },
      { field: 'serialNumber', headerName: 'Serie (SN)', width: 150 },
      { field: 'location', headerName: 'Locatie', width: 120 },
      { field: 'purchaseDate', headerName: 'Achizitie', width: 120 },
      { field: 'warrantyExpires', headerName: 'Garantie', width: 120, cellStyle: (p: any) => {
          const days = Math.ceil((new Date(p.value).getTime() - Date.now()) / (1000*3600*24));
          return days < 30 ? { color: 'red', fontWeight: 'bold' } : { color: 'green', fontWeight: 'normal' };
      }},
      { field: 'status', headerName: 'Status', width: 100, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {p.value}
          </span>
      )}
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-emerald-600"/> Conformitate & HACCP
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('haccp')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'haccp' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Thermometer size={18}/> Temperaturi
                </button>
                <button onClick={() => setActiveTab('cleaning')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'cleaning' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <CheckCircle size={18}/> Curatenie
                </button>
                <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'maintenance' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Wrench size={18}/> Mentenanta
                </button>
                <button onClick={() => setActiveTab('assets')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'assets' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
                    <Box size={18}/> Active (Assets)
                </button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {activeTab === 'haccp' && (
                <div className="flex h-full">
                    <div className="w-1/3 border-r p-6 bg-slate-50">
                        <h3 className="font-bold text-lg mb-4 text-slate-700">Inregistrare Temperatura</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Echipament</label>
                                <select 
                                    className="w-full border rounded-lg p-3 mt-1" 
                                    value={tempData.equipment}
                                    onChange={e => setTempData({...tempData, equipment: e.target.value})}
                                >
                                    <option>Frigider Carne</option>
                                    <option>Frigider Legume</option>
                                    <option>Congelator 1</option>
                                    <option>Vitrina Bar</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Temperatura (°C)</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <input 
                                        type="range" min="-20" max="20" 
                                        className="flex-1"
                                        value={tempData.temp}
                                        onChange={e => setTempData({...tempData, temp: Number(e.target.value)})}
                                    />
                                    <span className={`text-2xl font-bold w-16 text-center ${tempData.temp > 5 ? 'text-red-600' : 'text-emerald-600'}`}>{tempData.temp}°</span>
                                </div>
                            </div>
                            <button onClick={handleLogTemp} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                                Inregistreaza
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 ag-theme-quartz">
                        <AgGridReact rowData={haccpLogs} columnDefs={haccpDefs} pagination={true} paginationPageSize={15}/>
                    </div>
                </div>
            )}

            {activeTab === 'cleaning' && (
                <div className="p-6 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-6 text-slate-700">Checklist Curatenie Zilnica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cleaningTasks.map(task => (
                            <div key={task.id} className={`p-4 border rounded-xl flex items-center justify-between transition-colors ${task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                <div>
                                    <div className="font-bold text-slate-800">{task.task}</div>
                                    <div className="text-xs text-slate-500 uppercase">{task.area} • {task.frequency}</div>
                                    {task.completed && <div className="text-[10px] text-emerald-600 font-bold mt-1">Facut de: {task.completedBy} la {new Date(task.completedAt!).toLocaleTimeString()}</div>}
                                </div>
                                {task.completed ? (
                                    <CheckCircle className="text-emerald-500" size={24}/>
                                ) : (
                                    <button onClick={() => handleCompleteTask(task.id)} className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-colors">
                                        <PenTool size={14} className="text-slate-400"/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="flex h-full">
                    <div className="w-1/3 border-r p-6 bg-slate-50">
                        <h3 className="font-bold text-lg mb-4 text-slate-700">Raporteaza Defectiune</h3>
                        <div className="space-y-4">
                            <input 
                                className="w-full border rounded-lg p-3" 
                                placeholder="Echipament (ex: Cuptor)"
                                value={maintData.equipment}
                                onChange={e => setMaintData({...maintData, equipment: e.target.value})}
                            />
                            <textarea 
                                className="w-full border rounded-lg p-3" 
                                rows={3}
                                placeholder="Descriere problema..."
                                value={maintData.issue}
                                onChange={e => setMaintData({...maintData, issue: e.target.value})}
                            ></textarea>
                            <button onClick={handleReportIssue} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
                                <AlertTriangle size={18}/> Raporteaza
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 ag-theme-quartz">
                        <AgGridReact rowData={maintLogs} columnDefs={maintDefs} />
                    </div>
                </div>
            )}

            {activeTab === 'assets' && (
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-700">Registru Active Fixe</h3>
                            <p className="text-xs text-slate-500">Monitorizare echipamente si garantii.</p>
                        </div>
                        <button onClick={() => setIsAssetModalOpen(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800">
                            <Plus size={16}/> Adauga Activ
                        </button>
                    </div>
                    <div className="flex-1 ag-theme-quartz">
                        <AgGridReact rowData={assets} columnDefs={assetDefs} />
                    </div>
                </div>
            )}
        </div>

        {isAssetModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Adauga Echipament</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Denumire</label>
                                <input className="w-full border rounded-lg p-2 mt-1" value={assetForm.name || ''} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Serie (SN)</label>
                                <input className="w-full border rounded-lg p-2 mt-1" value={assetForm.serialNumber || ''} onChange={e => setAssetForm({...assetForm, serialNumber: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Data Achizitie</label>
                                <input type="date" className="w-full border rounded-lg p-2 mt-1" value={assetForm.purchaseDate} onChange={e => setAssetForm({...assetForm, purchaseDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500">Expira Garantie</label>
                                <input type="date" className="w-full border rounded-lg p-2 mt-1" value={assetForm.warrantyExpires} onChange={e => setAssetForm({...assetForm, warrantyExpires: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">Pret Achizitie</label>
                            <input type="number" className="w-full border rounded-lg p-2 mt-1" value={assetForm.purchasePrice} onChange={e => setAssetForm({...assetForm, purchasePrice: Number(e.target.value)})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsAssetModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-bold">Anuleaza</button>
                            <button onClick={handleSaveAsset} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">Salveaza</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
