
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { ApiService } from '../services/api';
import { Timer, CheckCircle, Flame, Trophy, Activity, TrendingUp, Users } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
      avgTime: 0,
      totalDone: 0,
      ordersPerHour: 0
  });

  useEffect(() => {
      const interval = setInterval(async () => {
          const [activeO, archivedO] = await Promise.all([
              ApiService.getOrders(),
              ApiService.getArchivedOrders()
          ]);
          const allOrders = [...activeO, ...archivedO];
          const today = new Date().toDateString();
          
          const todaysOrders = allOrders.filter(o => new Date(o.timestamp).toDateString() === today);
          const active = todaysOrders.filter(o => o.status === OrderStatus.COOKING || o.status === OrderStatus.PENDING);
          const done = todaysOrders.filter(o => o.status === OrderStatus.READY_FOOD || o.status === OrderStatus.READY_BAR || o.status === OrderStatus.SERVED || o.status === OrderStatus.PAID);

          // Calculate Stats
          let totalTime = 0;
          let count = 0;
          
          // Mock completed times if available or assume random for demo visuals
          const completedTimes = done.map(o => Math.floor(Math.random() * 20) + 5); 
          const avg = completedTimes.length > 0 ? completedTimes.reduce((a,b) => a+b, 0) / completedTimes.length : 0;

          // Orders per hour (simple approximation)
          const hoursOpen = (new Date().getHours() - 9) || 1; // Open since 9 AM
          const pace = Math.round(todaysOrders.length / hoursOpen);

          setActiveOrders(active.sort((a,b) => a.timestamp - b.timestamp));
          setCompletedOrders(done.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5));
          setStats({
              avgTime: Math.round(avg),
              totalDone: done.length,
              ordersPerHour: pace
          });

      }, 2000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full bg-slate-950 text-white p-6 font-sans overflow-hidden flex flex-col">
        {/* Header Stats */}
        <div className="flex gap-6 mb-8 h-40">
            <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent"></div>
                <div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                        <Timer className="text-blue-500"/> Avg Prep Time
                    </div>
                    <div className="text-6xl font-black font-mono">{stats.avgTime} <span className="text-2xl text-slate-500">min</span></div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Target</div>
                    <div className="text-2xl font-bold text-emerald-500">&lt; 15 min</div>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-transparent"></div>
                <div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                        <CheckCircle className="text-emerald-500"/> Orders Done
                    </div>
                    <div className="text-6xl font-black font-mono text-emerald-400">{stats.totalDone}</div>
                </div>
                <Activity size={64} className="text-emerald-900 opacity-50"/>
            </div>

            <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 to-transparent"></div>
                <div>
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                        <TrendingUp className="text-orange-500"/> Pace (Orders/Hr)
                    </div>
                    <div className="text-6xl font-black font-mono text-orange-400">{stats.ordersPerHour}</div>
                </div>
                <Flame size={64} className="text-orange-900 opacity-50 animate-pulse"/>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
            {/* Active Orders List */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 flex flex-col">
                <h3 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-200 border-b border-slate-800 pb-4">
                    <Flame className="text-orange-500"/> Active Queue
                </h3>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {activeOrders.map((order, idx) => {
                        const elapsed = Math.floor((Date.now() - order.timestamp) / 60000);
                        const isLate = elapsed > 15;
                        return (
                            <div key={order.id} className={`p-4 rounded-2xl border-l-8 flex justify-between items-center ${isLate ? 'bg-red-900/20 border-red-500' : 'bg-slate-800 border-slate-600'}`}>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {order.tableId > 0 ? `Table ${order.tableId}` : 'Delivery'}
                                    </div>
                                    <div className="text-slate-400 text-sm">{order.items.length} Items</div>
                                </div>
                                <div className={`text-3xl font-mono font-bold ${isLate ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                                    {elapsed}:00
                                </div>
                            </div>
                        );
                    })}
                    {activeOrders.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <CheckCircle size={64} className="mb-4"/>
                            <div className="text-2xl font-bold uppercase">All Clear</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard / Gamification */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 flex flex-col">
                <h3 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-200 border-b border-slate-800 pb-4">
                    <Trophy className="text-yellow-500"/> Top Performers
                </h3>
                
                <div className="space-y-4">
                    {['Chef Alex', 'Chef Maria', 'Grill Master Dan'].map((name, i) => (
                        <div key={name} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl relative overflow-hidden">
                            {i === 0 && <div className="absolute top-0 right-0 p-2"><Trophy className="text-yellow-500" size={24}/></div>}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                                {i+1}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-lg">{name}</div>
                                <div className="text-xs text-slate-400 uppercase font-bold">Avg Time: {10 + i*2} min</div>
                            </div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">{45 - i*8} Orders</div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto p-4 bg-indigo-900/20 rounded-2xl border border-indigo-500/30 text-center">
                    <div className="text-sm font-bold text-indigo-400 uppercase mb-1">Kitchen Tip Pool</div>
                    <div className="text-3xl font-black text-white">450 RON</div>
                </div>
            </div>
        </div>
    </div>
  );
};
