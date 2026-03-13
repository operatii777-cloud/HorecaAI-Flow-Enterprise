import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { Lock, Delete, ChevronRight, UtensilsCrossed } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
      ApiService.getUsers().then(setUsers).catch(console.error);
  }, []);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleLogin = () => {
    const user = users.find(u => u.pin === pin && u.active);
    if (user) {
      onLogin(user);
    } else {
      setError('PIN Incorect sau utilizator inactiv');
      setPin('');
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20">
        <div className="p-10 text-center relative">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white">
            <UtensilsCrossed className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">HORECA AI</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Enterprise Edition</p>
        </div>

        <div className="px-10 pb-10 flex flex-col items-center">
          <div className="w-full flex justify-center gap-4 mb-8">
             {[0, 1, 2, 3].map(i => (
               <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i ? 'bg-slate-900 border-slate-900 scale-125' : 'bg-transparent border-slate-300'}`}></div>
             ))}
          </div>

          {error && <div className="text-red-500 font-bold text-sm mb-6 animate-pulse bg-red-50 px-4 py-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumClick(num.toString())}
                className="h-16 rounded-2xl bg-white border border-slate-100 text-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm hover:shadow-md"
              >
                {num}
              </button>
            ))}
            <button onClick={handleDelete} className="h-16 rounded-2xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all">
              <Delete size={24} />
            </button>
            <button onClick={() => handleNumClick('0')} className="h-16 rounded-2xl bg-white border border-slate-100 text-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              0
            </button>
            <button onClick={handleLogin} className="h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};