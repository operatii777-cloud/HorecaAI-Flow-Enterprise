
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Package, User, ShoppingBag, MapPin, Hash } from 'lucide-react';
import { ApiService } from '../services/api';
import { Order, MenuItem, Client, Table } from '../types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, params?: any) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{type: string, id: string, label: string, subLabel?: string, icon: any, action: () => void}[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
        setQuery('');
        setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
        setResults([]);
        return;
    }

    const lowerQuery = query.toLowerCase();
    
    const search = async () => {
        const [menu, clients, activeOrders, archivedOrders, tables] = await Promise.all([
            ApiService.getMenu(),
            ApiService.getClients(),
            ApiService.getOrders(),
            ApiService.getArchivedOrders(),
            ApiService.getTables()
        ]);

        const searchResults: any[] = [];

        // 1. Search Menu
        menu.forEach(item => {
            if (item.name.toLowerCase().includes(lowerQuery)) {
                searchResults.push({
                    type: 'menu',
                    id: item.id,
                    label: item.name,
                    subLabel: `${item.price} RON - ${item.category}`,
                    icon: Package,
                    action: () => onNavigate('catalog') 
                });
            }
        });

        // 2. Search Clients
        clients.forEach(client => {
            if (client.name.toLowerCase().includes(lowerQuery) || client.phone.includes(lowerQuery)) {
                searchResults.push({
                    type: 'client',
                    id: client.id,
                    label: client.name,
                    subLabel: client.phone,
                    icon: User,
                    action: () => onNavigate('crm', { itemId: client.id })
                });
            }
        });

        // 3. Search Orders
        const orders = [...activeOrders, ...archivedOrders];
        orders.forEach(order => {
            if (order.id.toLowerCase().includes(lowerQuery) || (order.deliveryInfo?.customerName.toLowerCase().includes(lowerQuery))) {
                searchResults.push({
                    type: 'order',
                    id: order.id,
                    label: `Comanda #${order.id.slice(-4)}`,
                    subLabel: `${new Date(order.timestamp).toLocaleDateString()} - ${order.total} RON`,
                    icon: ShoppingBag,
                    action: () => onNavigate('archive', { itemId: order.id })
                });
            }
        });

        // 4. Search Tables
        tables.forEach(table => {
            if (table.id.toString().includes(lowerQuery)) {
                searchResults.push({
                    type: 'table',
                    id: table.id.toString(),
                    label: `Masa ${table.id}`,
                    subLabel: `${table.seats} locuri - ${table.zone}`,
                    icon: MapPin,
                    action: () => onNavigate('pos') 
                });
            }
        });

        setResults(searchResults.slice(0, 8)); // Limit results
        setSelectedIndex(0);
    };

    search();

  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
          setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
          if (results[selectedIndex]) {
              results[selectedIndex].action();
              onClose();
          }
      } else if (e.key === 'Escape') {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
        <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <Search className="text-slate-400" size={20}/>
                <input 
                    ref={inputRef}
                    className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-300"
                    placeholder="Cauta comenzi, produse, clienti..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex gap-1">
                    <kbd className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-500 border border-slate-200">ESC</kbd>
                </div>
            </div>
            
            {results.length > 0 ? (
                <div className="py-2">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Rezultate</div>
                    {results.map((res, idx) => (
                        <div 
                            key={`${res.type}-${res.id}`}
                            onClick={() => { res.action(); onClose(); }}
                            className={`px-4 py-3 flex items-center gap-4 cursor-pointer ${idx === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                <res.icon size={18}/>
                            </div>
                            <div className="flex-1">
                                <div className={`font-bold text-sm ${idx === selectedIndex ? 'text-indigo-900' : 'text-slate-700'}`}>{res.label}</div>
                                {res.subLabel && <div className="text-xs text-slate-400">{res.subLabel}</div>}
                            </div>
                            {idx === selectedIndex && <ArrowRight size={16} className="text-indigo-400"/>}
                        </div>
                    ))}
                </div>
            ) : query ? (
                <div className="p-8 text-center text-slate-400">
                    <Hash size={48} className="mx-auto mb-2 opacity-20"/>
                    <p>Nu am gasit rezultate pentru "{query}"</p>
                </div>
            ) : (
                <div className="p-8 text-center text-slate-400">
                    <Command size={48} className="mx-auto mb-2 opacity-20"/>
                    <p>Tasteaza pentru a cauta in tot sistemul...</p>
                </div>
            )}
            
            <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-end gap-4 text-[10px] text-slate-400 font-medium px-4">
                <span className="flex items-center gap-1"><ArrowRight size={10}/> Selecteaza</span>
                <span className="flex items-center gap-1"><Command size={10}/> Navigheaza</span>
            </div>
        </div>
    </div>
  );
};
