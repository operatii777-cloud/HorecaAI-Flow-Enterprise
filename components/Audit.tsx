
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { AuditLog, BackupJob } from '../types';
import { ApiService } from '../services/api';
import { ShieldCheck, Database, HardDrive, RotateCcw, AlertOctagon } from 'lucide-react';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<BackupJob[]>([]);

  useEffect(() => {
    const load = async () => {
        const [l, b] = await Promise.all([ApiService.getAuditLogs(), ApiService.getBackups()]);
        setLogs(l);
        setBackups(b);
    };
    load();
  }, []);

  const logDefs: ColDef<AuditLog>[] = [
    { field: 'timestamp', headerName: 'Data/Ora', width: 180, valueFormatter: p => new Date(p.value).toLocaleString(), sort: 'desc' },
    { field: 'user', headerName: 'Utilizator', width: 120, filter: true },
    { field: 'action', headerName: 'Actiune', width: 150, filter: true, cellRenderer: (p: any) => (
        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded">{p.value}</span>
    )},
    { field: 'details', headerName: 'Detalii', flex: 1 }
  ];

  const backupDefs: ColDef<BackupJob>[] = [
    { field: 'date', headerName: 'Data Backup', flex: 1, valueFormatter: p => new Date(p.value).toLocaleString() },
    { field: 'type', headerName: 'Tip', width: 100, cellRenderer: (p: any) => p.value === 'daily' ? 'Automat' : 'Manual' },
    { field: 'size', headerName: 'Marime', width: 100 },
    { field: 'status', headerName: 'Status', width: 100, cellRenderer: (p: any) => (
        <span className={p.value === 'success' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{p.value}</span>
    )},
    { headerName: 'Actiuni', width: 120, cellRenderer: () => (
        <button className="text-blue-600 hover:underline font-bold text-xs flex items-center gap-1"><RotateCcw size={12}/> Restore</button>
    )}
  ];

  const handleBackup = async () => {
      await ApiService.createBackup();
      alert("Backup initiated.");
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600"/> Audit & Securitate
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left: Audit Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Jurnal Activitate (Logs)</h3>
                    <span className="text-xs text-slate-500">{logs.length} inregistrari</span>
                </div>
                <div className="flex-1 ag-theme-quartz">
                    <AgGridReact rowData={logs} columnDefs={logDefs} pagination={true} paginationPageSize={15} />
                </div>
            </div>

            {/* Right: Backups */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Database size={16}/> Backup & Restore</h3>
                    <button onClick={handleBackup} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1">
                        <HardDrive size={12}/> Backup Manual
                    </button>
                </div>
                
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex gap-3 text-sm text-amber-800">
                    <AlertOctagon className="flex-shrink-0"/>
                    <p>Backup-ul automat este configurat sa ruleze zilnic la ora 03:00 AM. Asigurati-va ca serverul este pornit.</p>
                </div>

                <div className="flex-1 ag-theme-quartz">
                    <AgGridReact rowData={backups} columnDefs={backupDefs} />
                </div>
            </div>
        </div>
    </div>
  );
};
