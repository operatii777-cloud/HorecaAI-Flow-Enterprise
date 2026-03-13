
import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Monitor, Activity, RefreshCw } from 'lucide-react';

export const NetworkHealth: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [latency, setLatency] = useState(0);
  const [lastCheck, setLastCheck] = useState(Date.now());
  const [uptime, setUptime] = useState(0);

  const checkHealth = async () => {
      const start = Date.now();
      try {
          const res = await fetch('http://localhost:3000/api/health');
          const data = await res.json();
          setLatency(Date.now() - start);
          setStatus('online');
          setUptime(data.uptime);
      } catch {
          setStatus('offline');
          setLatency(0);
      }
      setLastCheck(Date.now());
  };

  useEffect(() => {
      checkHealth();
      const interval = setInterval(checkHealth, 5000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full p-6 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-blue-600"/> Network Health</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">API Server Status</h3>
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full ${status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        <Server size={32}/>
                    </div>
                    <div>
                        <div className={`text-2xl font-bold uppercase ${status === 'online' ? 'text-emerald-600' : 'text-red-600'}`}>{status}</div>
                        <div className="text-sm text-slate-500">Latency: {latency}ms</div>
                        <div className="text-xs text-slate-400">Last check: {new Date(lastCheck).toLocaleTimeString()}</div>
                        <div className="text-xs text-slate-400">Uptime: {(uptime / 3600).toFixed(1)}h</div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">Local Client</h3>
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full ${navigator.onLine ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        <Monitor size={32}/>
                    </div>
                    <div>
                        <div className="text-2xl font-bold uppercase">{navigator.onLine ? 'Connected' : 'Offline'}</div>
                        <div className="text-sm text-slate-500">{window.innerWidth}x{window.innerHeight}px</div>
                        <div className="text-xs text-slate-400">{navigator.userAgent.split(')')[0]})</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
