
import React, { useState } from 'react';
import { Smile, Meh, Frown, ThumbsUp, Star } from 'lucide-react';
import { ApiService } from '../services/api';

export const FeedbackKiosk: React.FC = () => {
    const [step, setStep] = useState<'rate' | 'thanks'>('rate');

    const handleRate = async (rating: number) => {
        await ApiService.addFeedback({
            id: Date.now().toString(),
            rating,
            comment: 'Kiosk Entry',
            timestamp: Date.now()
        });
        setStep('thanks');
        setTimeout(() => setStep('rate'), 3000);
    };

    if (step === 'thanks') {
        return (
            <div className="h-screen w-full bg-emerald-500 text-white flex flex-col items-center justify-center animate-in zoom-in">
                <ThumbsUp size={120} className="mb-8 animate-bounce"/>
                <h1 className="text-6xl font-black mb-4">Multumim!</h1>
                <p className="text-2xl font-light">Parerea ta conteaza.</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-12">
            <h1 className="text-5xl font-black text-slate-800 mb-16 text-center">Cum a fost experienta ta azi?</h1>
            
            <div className="flex gap-8 w-full justify-center">
                <button 
                    onClick={() => handleRate(5)}
                    className="flex-1 aspect-square bg-emerald-500 hover:bg-emerald-600 rounded-3xl flex flex-col items-center justify-center text-white transition-transform hover:scale-105 shadow-xl border-b-8 border-emerald-700"
                >
                    <Smile size={120}/>
                    <span className="text-3xl font-bold mt-4">Excelent</span>
                </button>
                <button 
                    onClick={() => handleRate(3)}
                    className="flex-1 aspect-square bg-yellow-400 hover:bg-yellow-500 rounded-3xl flex flex-col items-center justify-center text-white transition-transform hover:scale-105 shadow-xl border-b-8 border-yellow-600"
                >
                    <Meh size={120}/>
                    <span className="text-3xl font-bold mt-4">OK</span>
                </button>
                <button 
                    onClick={() => handleRate(1)}
                    className="flex-1 aspect-square bg-red-500 hover:bg-red-600 rounded-3xl flex flex-col items-center justify-center text-white transition-transform hover:scale-105 shadow-xl border-b-8 border-red-700"
                >
                    <Frown size={120}/>
                    <span className="text-3xl font-bold mt-4">Slab</span>
                </button>
            </div>
            
            <div className="mt-16 text-slate-400 text-sm font-bold uppercase tracking-widest">HorecaAI Feedback Terminal</div>
        </div>
    );
};
