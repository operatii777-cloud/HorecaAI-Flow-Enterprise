
import React from 'react';
import { AlertOctagon, Wrench, Lock } from 'lucide-react';

export const Maintenance: React.FC = () => {
    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white text-center p-8">
            <div className="bg-red-600/20 p-8 rounded-full mb-8 animate-pulse">
                <AlertOctagon size={120} className="text-red-500"/>
            </div>
            <h1 className="text-6xl font-black mb-4 uppercase tracking-widest">Sistem in Mentenanta</h1>
            <p className="text-xl text-slate-400 max-w-lg mb-8">
                Administratorul a blocat accesul pentru actualizari critice sau inventar. 
                Te rugam sa astepti.
            </p>
            <div className="flex items-center gap-2 text-sm font-mono text-slate-500 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <Lock size={14}/> SYSTEM_LOCK_ENGAGED
            </div>
        </div>
    );
};
