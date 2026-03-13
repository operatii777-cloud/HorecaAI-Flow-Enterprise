
import React, { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle, Volume2, VolumeX, Maximize } from 'lucide-react';

interface QueueMonitorProps {
  orders: Order[];
}

export const QueueMonitor: React.FC<QueueMonitorProps> = ({ orders }) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lastReadyCount, setLastReadyCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Flash effect for new ready orders
  const [flashingOrders, setFlashingOrders] = useState<string[]>([]);

  const preparing = orders
    .filter(o => o.status === OrderStatus.COOKING || o.status === OrderStatus.PENDING)
    .map(o => o.id.slice(-4));
    
  const ready = orders
    .filter(o => o.status === OrderStatus.READY_FOOD || o.status === OrderStatus.READY_BAR || o.status === OrderStatus.SERVED)
    .sort((a, b) => b.timestamp - a.timestamp) // Newest first
    .map(o => o.id.slice(-4));

  useEffect(() => {
      // Check for new ready orders to trigger sound and flash
      if (ready.length > lastReadyCount) {
          const newOrders = ready.slice(0, ready.length - lastReadyCount);
          setFlashingOrders(newOrders);
          
          if (audioEnabled) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(e => console.log("Audio autoplay blocked", e));
          }

          // Remove flash after 5 seconds
          setTimeout(() => setFlashingOrders([]), 5000);
      }
      setLastReadyCount(ready.length);
  }, [ready.length, audioEnabled]);

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setIsFullScreen(true);
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
              setIsFullScreen(false);
          }
      }
  };

  return (
    <div className="h-full bg-slate-950 text-white p-4 flex flex-col overflow-hidden relative font-sans">
       {/* Controls overlay */}
       <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-20 hover:opacity-100 transition-opacity">
           <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
               {audioEnabled ? <Volume2/> : <VolumeX/>}
           </button>
           <button onClick={toggleFullScreen} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
               <Maximize/>
           </button>
       </div>

       <div className="flex-1 flex gap-4 h-full">
           {/* Preparing Column (Left, Smaller) */}
           <div className="w-[40%] bg-slate-900 rounded-3xl p-8 flex flex-col border border-slate-800">
               <div className="flex items-center gap-4 mb-8 border-b-4 border-slate-700 pb-6">
                   <Clock className="text-amber-500 w-12 h-12 animate-spin-slow" />
                   <h1 className="text-5xl font-black text-slate-200 uppercase tracking-widest">In Lucru</h1>
               </div>
               <div className="grid grid-cols-2 gap-6 content-start overflow-hidden">
                   {preparing.slice(0, 12).map((id, i) => (
                       <div key={i} className="text-5xl font-bold text-slate-500 font-mono bg-slate-950/50 p-6 rounded-2xl text-center border border-slate-800">
                           {id}
                       </div>
                   ))}
               </div>
               {preparing.length > 12 && <div className="mt-auto text-center text-slate-500 text-xl font-bold">... si altele</div>}
           </div>

           {/* Ready Column (Right, Larger, Highlighted) */}
           <div className="w-[60%] bg-emerald-900/20 rounded-3xl p-8 flex flex-col border-2 border-emerald-500/30 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/10 to-transparent pointer-events-none"></div>
               
               <div className="flex items-center gap-4 mb-8 border-b-4 border-emerald-500 pb-6 relative z-10">
                   <CheckCircle className="text-emerald-400 w-16 h-16" />
                   <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                       Gata de Livrare
                   </h1>
               </div>
               
               <div className="grid grid-cols-2 gap-6 content-start relative z-10">
                   {ready.slice(0, 8).map((id, i) => {
                       const isFlashing = flashingOrders.includes(id);
                       return (
                           <div 
                            key={i} 
                            className={`text-8xl font-black font-mono p-8 rounded-2xl text-center border-4 transition-all duration-500 ${
                                isFlashing 
                                ? 'bg-emerald-500 text-white border-white scale-105 shadow-[0_0_50px_rgba(255,255,255,0.5)] animate-pulse' 
                                : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/50'
                            }`}
                           >
                               {id}
                           </div>
                       );
                   })}
               </div>
               {ready.length === 0 && (
                   <div className="flex-1 flex items-center justify-center text-emerald-800/30 font-black text-6xl uppercase tracking-widest text-center">
                       Pregatim<br/>Bunatati
                   </div>
               )}
           </div>
       </div>
       
       <div className="mt-4 text-center text-slate-600 text-sm font-bold uppercase tracking-[0.5em]">
           Va rugam pastrati bonul pentru ridicarea comenzii
       </div>
    </div>
  );
};
