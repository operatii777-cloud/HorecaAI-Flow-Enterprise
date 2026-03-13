
import React, { useState, useEffect } from 'react';
import { SystemNotification } from '../types';
import { ApiService } from '../services/api';
import { Bell, AlertTriangle, AlertOctagon, Info, CheckCircle, ArrowRight } from 'lucide-react';

interface NotificationsProps {
    onNavigate: (tab: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNavigate }) => {
    const [alerts, setAlerts] = useState<SystemNotification[]>([]);

    useEffect(() => {
        const load = async () => {
            const notes = await ApiService.getNotifications();
            setAlerts(notes);
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch(type) {
            case 'critical': return <AlertOctagon size={24} className="text-red-500"/>;
            case 'warning': return <AlertTriangle size={24} className="text-orange-500"/>;
            case 'success': return <CheckCircle size={24} className="text-emerald-500"/>;
            default: return <Info size={24} className="text-blue-500"/>;
        }
    };

    const getBgColor = (type: string) => {
        switch(type) {
            case 'critical': return 'bg-red-50 border-red-100';
            case 'warning': return 'bg-orange-50 border-orange-100';
            case 'success': return 'bg-emerald-50 border-emerald-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="h-full p-6 bg-slate-50 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="text-slate-600"/> Centru Notificari & Alerte
                </h2>
                <div className="text-sm font-bold text-slate-500">
                    {alerts.length} Probleme Active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                    {alerts.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <CheckCircle size={64} className="mb-4 text-emerald-200"/>
                            <p className="text-lg font-bold">Toate sistemele operationale</p>
                            <p className="text-sm">Nu exista alerte active.</p>
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <div key={alert.id} className={`p-4 rounded-xl border shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${getBgColor(alert.type)}`}>
                                <div className="mt-1">{getIcon(alert.type)}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800">{alert.category.toUpperCase()}</h4>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 mt-1">{alert.message}</p>
                                </div>
                                {alert.actionLink && (
                                    <button 
                                        onClick={() => onNavigate(alert.actionLink!)}
                                        className="bg-white border px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-1 self-center"
                                    >
                                        {alert.actionLabel || 'Vezi'} <ArrowRight size={12}/>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">Sumar Alerte</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <span className="font-bold text-red-700 text-sm">Critice (Stoc/HACCP)</span>
                            <span className="bg-white px-2 py-1 rounded text-red-700 font-bold shadow-sm border border-red-100">
                                {alerts.filter(a => a.type === 'critical').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                            <span className="font-bold text-orange-700 text-sm">Avertismente</span>
                            <span className="bg-white px-2 py-1 rounded text-orange-700 font-bold shadow-sm border border-orange-100">
                                {alerts.filter(a => a.type === 'warning').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="font-bold text-blue-700 text-sm">Informari</span>
                            <span className="bg-white px-2 py-1 rounded text-blue-700 font-bold shadow-sm border border-blue-100">
                                {alerts.filter(a => a.type === 'info').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
