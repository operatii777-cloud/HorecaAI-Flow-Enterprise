
import React, { useState, useEffect, useRef } from 'react';
import { Department, ChatMessage } from '../types';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';
import { Send } from 'lucide-react';

export const InternalChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentDept, setCurrentDept] = useState<Department>(Department.ADMIN);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
        const history = await ApiService.getChatHistory();
        setMessages(history);
    };
    load();

    const socket = socketService.connect();
    socket.on('new_message', (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
    });

    return () => {
        socket.off('new_message');
    };
  }, []);

  useEffect(() => {
      if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if(!inputText.trim()) return;
    const msg: ChatMessage = {
        id: Date.now().toString(),
        from: currentDept,
        text: inputText,
        timestamp: Date.now()
    };
    await ApiService.sendMessage(msg);
    setInputText('');
  };

  return (
    <div className="h-full flex gap-4 p-6">
       <div className="w-1/4 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2">
           <h3 className="font-bold text-slate-700 mb-4">Departament</h3>
           {Object.values(Department).map(d => (
               <button 
                key={d}
                onClick={() => setCurrentDept(d)}
                className={`p-3 rounded-xl text-left font-medium transition-colors ${currentDept === d ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
               >
                   {d}
               </button>
           ))}
       </div>

       <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
                <h2 className="font-bold text-slate-800">Canal Comunicare Interna</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.from === currentDept ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.from === currentDept ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                            {msg.from !== currentDept && <div className="text-xs font-bold mb-1 opacity-70">{msg.from}</div>}
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
                <input 
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Scrie un mesaj..."
                />
                <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors">
                    <Send size={20}/>
                </button>
            </div>
       </div>
    </div>
  );
};
