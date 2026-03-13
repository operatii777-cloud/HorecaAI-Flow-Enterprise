
import React, { useState } from 'react';
import { Settings, Role } from '../types';
import { ApiService } from '../services/api';
import { Rocket, CheckCircle, ArrowRight, Settings as SettingsIcon, Database, User as UserIcon } from 'lucide-react';

interface SetupWizardProps {
    onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Settings>>({
        restaurantName: 'Restaurantul Meu',
        currency: 'RON',
        vatRate: 9
    });
    const [adminData, setAdminData] = useState({ name: 'Admin', pin: '0000' });
    const [dataMode, setDataMode] = useState<'empty' | 'demo'>('empty');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleNext = () => setStep(step + 1);

    const handleFinish = async () => {
        setIsProcessing(true);
        try {
            // 1. Save Settings
            const current = await ApiService.getSettings();
            await ApiService.saveSettings({ 
                ...current, 
                ...formData,
                setupCompleted: true 
            });

            // 2. Create/Update Admin
            const users = await ApiService.getUsers();
            const admin = users.find(u => u.role === Role.ADMIN);
            if (admin) {
                await ApiService.updateUser(admin.id, { ...admin, name: adminData.name, pin: adminData.pin });
            } else {
                await ApiService.createUser({
                    id: 'admin',
                    name: adminData.name,
                    pin: adminData.pin,
                    role: Role.ADMIN,
                    active: true,
                    tipPoints: 0
                });
            }

            // 3. Seed Data
            if (dataMode === 'demo') {
                await ApiService.seedData();
                window.location.reload();
            } else {
                onComplete();
            }
        } catch (e) {
            alert("Eroare la configurare.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex items-center justify-center p-6 text-slate-800">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in duration-300">
                <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Rocket className="text-emerald-400"/> HorecaAI Setup
                        </h1>
                        <p className="text-slate-400">Configurare initiala sistem</p>
                    </div>
                    <div className="flex gap-2">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${s <= step ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon/> Detalii Restaurant</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Nume Locatie</label>
                                    <input className="w-full border rounded-xl p-4 text-lg font-bold" value={formData.restaurantName} onChange={e => setFormData({...formData, restaurantName: e.target.value})} autoFocus/>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Moneda</label>
                                        <select className="w-full border rounded-xl p-4" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                                            <option value="RON">RON (Lei)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Cota TVA (Standard)</label>
                                        <input type="number" className="w-full border rounded-xl p-4" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: Number(e.target.value)})}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><UserIcon/> Cont Administrator</h2>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Nume Administrator</label>
                                    <input className="w-full border rounded-xl p-4" value={adminData.name} onChange={e => setAdminData({...adminData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 uppercase mb-1">PIN Securitate (4 Cifre)</label>
                                    <input type="number" maxLength={4} className="w-full border rounded-xl p-4 text-2xl tracking-[1em] font-mono text-center" value={adminData.pin} onChange={e => setAdminData({...adminData, pin: e.target.value.slice(0,4)})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><Database/> Date Initiale</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <button 
                                    onClick={() => setDataMode('empty')}
                                    className={`p-6 rounded-2xl border-4 text-left transition-all ${dataMode === 'empty' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="text-3xl mb-2">📄</div>
                                    <h3 className="font-bold text-lg">Clean Start</h3>
                                    <p className="text-sm text-slate-500 mt-2">Incepe de la zero. Ideal pentru productie reala.</p>
                                </button>
                                <button 
                                    onClick={() => setDataMode('demo')}
                                    className={`p-6 rounded-2xl border-4 text-left transition-all ${dataMode === 'demo' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="text-3xl mb-2">🚀</div>
                                    <h3 className="font-bold text-lg">Demo Data</h3>
                                    <p className="text-sm text-slate-500 mt-2">Populeaza cu date fictive (comenzi, stocuri) pentru testare.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-12">
                            <CheckCircle size={80} className="text-emerald-500 mx-auto mb-6 animate-bounce"/>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Gata de start!</h2>
                            <p className="text-slate-500 text-lg mb-8">Sistemul este configurat si pregatit.</p>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between">
                    <button 
                        onClick={() => setStep(Math.max(1, step - 1))} 
                        disabled={step === 1 || isProcessing}
                        className="px-6 py-3 font-bold text-slate-500 disabled:opacity-50"
                    >
                        Inapoi
                    </button>
                    {step < 4 ? (
                        <button onClick={handleNext} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800">
                            Continua <ArrowRight size={18}/>
                        </button>
                    ) : (
                        <button 
                            onClick={handleFinish} 
                            disabled={isProcessing}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50"
                        >
                            {isProcessing ? 'Initializare...' : 'Lanseaza Aplicatia'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
