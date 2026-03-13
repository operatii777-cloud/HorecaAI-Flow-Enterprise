
import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { MenuItem, ProductCategory, ModifierGroup, ModifierOption, KitchenStation, Ingredient } from '../types';
import { ApiService } from '../services/api';
import { ALLERGENS_LIST } from '../constants';
import { Plus, Edit, Trash2, Search, Filter, Download, Sparkles, Loader2, List, X, CheckSquare, AlertCircle, Printer, BookOpen } from 'lucide-react';
import { generateMenuItemDetails } from '../services/geminiService';

interface CatalogProps {
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ menuItems, onAddMenuItem, onUpdateMenuItem }) => {
  const [filterText, setFilterText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Modifiers State (Local to modal)
  const [activeTab, setActiveTab] = useState<'details' | 'modifiers'>('details');

  // Menu Print State
  const [isMenuPreviewOpen, setIsMenuPreviewOpen] = useState(false);

  useEffect(() => {
      ApiService.getInventory().then(setIngredients);
  }, []);

  // Helper to check stock status directly in Catalog
  const getRowStyle = (params: RowClassParams) => {
      const item = params.data as MenuItem;
      if (item.recipe && item.recipe.length > 0) {
          const isLowStock = item.recipe.some(rItem => {
              const ing = ingredients.find(i => i.id === rItem.ingredientId);
              return ing && ing.currentStock < rItem.quantity;
          });
          if (isLowStock) return { background: '#fee2e2' }; // Red-100 for Out of Stock
      }
      return undefined;
  };

  // AG Grid Definitions
  const columnDefs: ColDef<MenuItem>[] = [
    { field: 'name', headerName: 'Produs', flex: 2, filter: true, checkboxSelection: true, cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
            {params.value}
            {params.data.recipe && params.data.recipe.some((r: any) => {
                const ing = ingredients.find((i: Ingredient) => i.id === r.ingredientId);
                return ing && ing.currentStock < r.quantity;
            }) && <AlertCircle size={14} className="text-red-600" />}
        </div>
    )},
    { field: 'category', headerName: 'Categorie', flex: 1, filter: true },
    { field: 'price', headerName: 'Pret (RON)', flex: 1, type: 'numericColumn', editable: true },
    { field: 'station', headerName: 'Statie KDS', width: 100 },
    { field: 'active', headerName: 'Activ', width: 100, cellRenderer: (params: any) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${params.value ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {params.value ? 'DA' : 'NU'}
      </span>
    )},
    { field: 'modifiers', headerName: 'Optiuni', width: 100, cellRenderer: (params: any) => (
        <span className="text-xs font-bold text-slate-500">{params.value?.length || 0} Grupuri</span>
    )},
    { 
      headerName: 'Actiuni', 
      width: 120,
      cellRenderer: (params: any) => (
        <button onClick={() => handleEdit(params.data)} className="text-blue-600 font-bold hover:underline">Editeaza</button>
      )
    }
  ];

  const handleEdit = (item: MenuItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item))); // Deep copy
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleAI = async () => {
      if(!editingItem.name) return alert("Introdu un nume pentru a genera detalii.");
      setIsGenerating(true);
      const details = await generateMenuItemDetails(editingItem.name, "generic ingredients");
      setIsGenerating(false);
      if(details) {
          setEditingItem(prev => ({...prev, description: details.description, pairing: details.pairing}));
      }
  };

  const handleSave = async () => {
    if (!editingItem.name || !editingItem.price) return alert("Nume si Pret obligatorii");
    
    // Auto-AI if description missing
    if (!editingItem.description) {
        await handleAI();
    }

    const newItem: MenuItem = {
        id: editingItem.id || Date.now().toString(),
        name: editingItem.name,
        price: Number(editingItem.price),
        category: editingItem.category || ProductCategory.FOOD,
        description: editingItem.description || '',
        active: editingItem.active ?? true,
        recipe: editingItem.recipe || [],
        modifiers: editingItem.modifiers || [],
        isVegetarian: editingItem.isVegetarian || false,
        allergens: editingItem.allergens || [],
        image: editingItem.image || `https://picsum.photos/200/200?random=${Date.now()}`,
        vatRate: Number(editingItem.vatRate) || 9,
        station: editingItem.station
    };

    if (editingItem.id) {
        onUpdateMenuItem(newItem);
    } else {
        onAddMenuItem(newItem);
    }
    setIsModalOpen(false);
    setEditingItem({});
  };

  // Modifier Logic
  const addModifierGroup = () => {
      const newGroup: ModifierGroup = {
          id: Date.now().toString(),
          name: 'Grup Nou',
          minSelection: 0,
          maxSelection: 1,
          options: []
      };
      setEditingItem(prev => ({
          ...prev,
          modifiers: [...(prev.modifiers || []), newGroup]
      }));
  };

  const removeModifierGroup = (groupId: string) => {
      setEditingItem(prev => ({
          ...prev,
          modifiers: prev.modifiers?.filter(g => g.id !== groupId)
      }));
  };

  const updateModifierGroup = (groupId: string, field: keyof ModifierGroup, value: any) => {
      setEditingItem(prev => ({
          ...prev,
          modifiers: prev.modifiers?.map(g => g.id === groupId ? { ...g, [field]: value } : g)
      }));
  };

  const addOptionToGroup = (groupId: string) => {
      const newOption: ModifierOption = {
          id: Date.now().toString(),
          name: 'Optiune Noua',
          price: 0
      };
      setEditingItem(prev => ({
          ...prev,
          modifiers: prev.modifiers?.map(g => g.id === groupId ? { ...g, options: [...g.options, newOption] } : g)
      }));
  };

  const removeOptionFromGroup = (groupId: string, optionId: string) => {
      setEditingItem(prev => ({
          ...prev,
          modifiers: prev.modifiers?.map(g => g.id === groupId ? { ...g, options: g.options.filter(o => o.id !== optionId) } : g)
      }));
  };

  const updateOption = (groupId: string, optionId: string, field: keyof ModifierOption, value: any) => {
      setEditingItem(prev => ({
          ...prev,
          modifiers: prev.modifiers?.map(g => {
              if (g.id !== groupId) return g;
              return {
                  ...g,
                  options: g.options.map(o => o.id === optionId ? { ...o, [field]: value } : o)
              };
          })
      }));
  };

  const toggleAllergen = (allergen: string) => {
      const current = editingItem.allergens || [];
      if(current.includes(allergen)) {
          setEditingItem({...editingItem, allergens: current.filter(a => a !== allergen)});
      } else {
          setEditingItem({...editingItem, allergens: [...current, allergen]});
      }
  };

  // Menu Print Logic
  const groupedMenu = useMemo(() => {
      const activeItems = menuItems.filter(i => i.active);
      const foodCategories = [ProductCategory.FOOD, ProductCategory.DESSERT];
      const drinkCategories = [ProductCategory.DRINKS, ProductCategory.ALCOHOL, ProductCategory.COFFEE];

      const foodItems = activeItems.filter(i => foodCategories.includes(i.category));
      const drinkItems = activeItems.filter(i => drinkCategories.includes(i.category));

      const groupByCat = (items: MenuItem[]) => {
          return items.reduce((acc, item) => {
              if(!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
          }, {} as Record<string, MenuItem[]>);
      };

      return {
          food: groupByCat(foodItems),
          drinks: groupByCat(drinkItems)
      };
  }, [menuItems]);

  const handlePrintMenu = () => {
      window.print();
  };

  return (
    <div className="h-full flex flex-col p-6 gap-4 bg-slate-50">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Catalog Produse</h2>
            <p className="text-slate-500 text-sm">Gestiune completa meniu & preturi</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsMenuPreviewOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                <BookOpen size={18}/> Meniu Printabil
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-50">
                <Download size={18}/> Export CSV
            </button>
            <button onClick={() => { setEditingItem({}); setActiveTab('details'); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                <Plus size={18}/> Produs Nou
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center">
         <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
             <input 
                type="text" 
                placeholder="Cauta produs..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
             />
         </div>
         <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><Filter size={18}/></button>
      </div>

      <div className="flex-1 ag-theme-quartz shadow-sm rounded-xl overflow-hidden border border-slate-200">
         <AgGridReact
            rowData={menuItems.filter(i => i.name.toLowerCase().includes(filterText.toLowerCase()))}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={20}
            rowSelection="multiple"
            getRowStyle={getRowStyle}
         />
      </div>

      {/* Menu Preview Modal */}
      {isMenuPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
              <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Previzualizare Meniu Printabil</h3>
                      <div className="flex gap-3">
                          <button onClick={handlePrintMenu} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800">
                              <Printer size={18}/> Printeaza
                          </button>
                          <button onClick={() => setIsMenuPreviewOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold">Inchide</button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
                      {/* Printable Area Wrapper */}
                      <div className="print-container bg-white w-[210mm] min-h-[297mm] shadow-xl p-[15mm] text-slate-900">
                           <div className="text-center mb-12 border-b-2 border-slate-900 pb-6">
                               <h1 className="text-4xl font-serif font-bold mb-2 tracking-widest uppercase">HorecaAI Bistro</h1>
                               <p className="text-slate-500 italic font-serif">Arta Culinara & Experiente</p>
                           </div>

                           <div className="grid grid-cols-2 gap-12">
                               {/* Food Column */}
                               <div>
                                   <h2 className="text-2xl font-serif font-bold border-b border-amber-500 pb-2 mb-6 uppercase tracking-wider text-amber-600">Meniu Preparate</h2>
                                   {Object.entries(groupedMenu.food).map(([cat, items]: [string, MenuItem[]]) => (
                                       <div key={cat} className="mb-8 break-inside-avoid">
                                           <h3 className="font-bold text-lg mb-4 text-slate-800 uppercase border-l-4 border-slate-200 pl-3">{cat}</h3>
                                           <div className="space-y-4">
                                               {items.map(item => (
                                                   <div key={item.id} className="flex justify-between items-baseline group">
                                                       <div className="flex-1 pr-4">
                                                           <div className="flex items-baseline">
                                                               <span className="font-bold text-slate-800">{item.name}</span>
                                                               <span className="flex-1 border-b border-dotted border-slate-300 mx-2"></span>
                                                           </div>
                                                           <p className="text-xs text-slate-500 italic mt-0.5 leading-tight">{item.description}</p>
                                                       </div>
                                                       <span className="font-bold text-slate-800 whitespace-nowrap">{item.price} Lei</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   ))}
                               </div>

                               {/* Drinks Column */}
                               <div>
                                   <h2 className="text-2xl font-serif font-bold border-b border-slate-500 pb-2 mb-6 uppercase tracking-wider text-slate-600">Bar & Bauturi</h2>
                                   {Object.entries(groupedMenu.drinks).map(([cat, items]: [string, MenuItem[]]) => (
                                       <div key={cat} className="mb-8 break-inside-avoid">
                                           <h3 className="font-bold text-lg mb-4 text-slate-800 uppercase border-l-4 border-slate-200 pl-3">{cat}</h3>
                                           <div className="space-y-4">
                                               {items.map(item => (
                                                   <div key={item.id} className="flex justify-between items-baseline">
                                                       <div className="flex-1 pr-4">
                                                           <div className="flex items-baseline">
                                                               <span className="font-bold text-slate-800">{item.name}</span>
                                                               <span className="flex-1 border-b border-dotted border-slate-300 mx-2"></span>
                                                           </div>
                                                            <p className="text-xs text-slate-500 italic mt-0.5 leading-tight">{item.description}</p>
                                                       </div>
                                                       <span className="font-bold text-slate-800 whitespace-nowrap">{item.price} Lei</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                           
                           <div className="mt-12 text-center text-xs text-slate-400 font-serif border-t pt-4">
                               <p>Alergenii sunt marcati in meniul digital sau pot fi solicitati ospatarului.</p>
                               <p>Preturile includ TVA.</p>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Editare */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                      <h3 className="text-xl font-bold">{editingItem.id ? 'Editare Produs' : 'Produs Nou'}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  
                  <div className="flex border-b">
                      <button 
                        onClick={() => setActiveTab('details')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                      >
                          Detalii Generale
                      </button>
                      <button 
                        onClick={() => setActiveTab('modifiers')} 
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'modifiers' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                      >
                          Optiuni & Modificatori
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1">
                      {activeTab === 'details' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nume</label>
                                    <input className="w-full border rounded-lg px-3 py-2" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pret</label>
                                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TVA %</label>
                                        <select className="w-full border rounded-lg px-3 py-2" value={editingItem.vatRate || 9} onChange={e => setEditingItem({...editingItem, vatRate: Number(e.target.value)})}>
                                            <option value={9}>9%</option>
                                            <option value={19}>19%</option>
                                            <option value={5}>5%</option>
                                            <option value={0}>0%</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descriere</label>
                                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                                <button 
                                    onClick={handleAI} 
                                    disabled={isGenerating}
                                    className="absolute right-2 bottom-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-indigo-100"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} Genereaza AI
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categorie</label>
                                    <select className="w-full border rounded-lg px-3 py-2" value={editingItem.category || ProductCategory.FOOD} onChange={e => setEditingItem({...editingItem, category: e.target.value as ProductCategory})}>
                                        {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Statie KDS (Route)</label>
                                    <select 
                                        className="w-full border rounded-lg px-3 py-2" 
                                        value={editingItem.station || ''} 
                                        onChange={e => setEditingItem({...editingItem, station: e.target.value as KitchenStation})}
                                    >
                                        <option value="">Fara (Default)</option>
                                        <option value="Grill">Grill</option>
                                        <option value="Pizza">Pizza</option>
                                        <option value="Pasta">Pasta</option>
                                        <option value="Salad">Salad</option>
                                        <option value="Fryer">Fryer</option>
                                        <option value="Dessert">Dessert</option>
                                        <option value="Pass">Pass (Expeditie)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="veg" 
                                    className="w-5 h-5 text-emerald-600 rounded"
                                    checked={editingItem.isVegetarian || false} 
                                    onChange={e => setEditingItem({...editingItem, isVegetarian: e.target.checked})} 
                                />
                                <label htmlFor="veg" className="text-sm font-medium">Vegetarian / Vegan</label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><AlertCircle size={14}/> Alergeni (Conform UE)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ALLERGENS_LIST.map(alg => (
                                        <button 
                                            key={alg}
                                            onClick={() => toggleAllergen(alg)}
                                            className={`text-xs px-2 py-1.5 rounded-md border text-left transition-colors ${
                                                editingItem.allergens?.includes(alg) 
                                                ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {alg}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-slate-700">Grupuri de Optiuni</h4>
                                  <button onClick={addModifierGroup} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                                      <Plus size={14}/> Adauga Grup
                                  </button>
                              </div>

                              {(!editingItem.modifiers || editingItem.modifiers.length === 0) && (
                                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                      <List className="mx-auto text-slate-300 mb-2"/>
                                      <p className="text-slate-400 text-sm">Nu exista optiuni configurate.</p>
                                  </div>
                              )}

                              {editingItem.modifiers?.map((group, gIdx) => (
                                  <div key={group.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                                      <div className="flex justify-between items-start mb-4">
                                          <div className="flex-1 grid grid-cols-3 gap-3">
                                              <div className="col-span-1">
                                                  <label className="text-[10px] font-bold uppercase text-slate-500">Nume Grup</label>
                                                  <input 
                                                    className="w-full border rounded p-1.5 text-sm font-bold" 
                                                    value={group.name} 
                                                    onChange={e => updateModifierGroup(group.id, 'name', e.target.value)}
                                                    placeholder="ex: Sosuri"
                                                  />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold uppercase text-slate-500">Minim</label>
                                                  <input 
                                                    type="number" className="w-full border rounded p-1.5 text-sm" 
                                                    value={group.minSelection} 
                                                    onChange={e => updateModifierGroup(group.id, 'minSelection', Number(e.target.value))}
                                                  />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold uppercase text-slate-500">Maxim</label>
                                                  <input 
                                                    type="number" className="w-full border rounded p-1.5 text-sm" 
                                                    value={group.maxSelection} 
                                                    onChange={e => updateModifierGroup(group.id, 'maxSelection', Number(e.target.value))}
                                                  />
                                              </div>
                                          </div>
                                          <button onClick={() => removeModifierGroup(group.id)} className="ml-2 text-red-400 hover:text-red-600 p-1">
                                              <Trash2 size={16}/>
                                          </button>
                                      </div>

                                      <div className="bg-white border rounded-lg p-3">
                                          <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                                              <span>Optiuni</span>
                                              <span>Pret Extra (RON)</span>
                                          </div>
                                          <div className="space-y-2">
                                              {group.options.map(opt => (
                                                  <div key={opt.id} className="flex gap-2 items-center">
                                                      <input 
                                                        className="flex-1 border rounded p-1.5 text-sm" 
                                                        value={opt.name}
                                                        onChange={e => updateOption(group.id, opt.id, 'name', e.target.value)}
                                                        placeholder="Nume optiune"
                                                      />
                                                      <input 
                                                        type="number" className="w-20 border rounded p-1.5 text-sm text-right" 
                                                        value={opt.price}
                                                        onChange={e => updateOption(group.id, opt.id, 'price', Number(e.target.value))}
                                                        placeholder="0"
                                                      />
                                                      <button onClick={() => removeOptionFromGroup(group.id, opt.id)} className="text-slate-400 hover:text-red-500">
                                                          <X size={14}/>
                                                      </button>
                                                  </div>
                                              ))}
                                          </div>
                                          <button onClick={() => addOptionToGroup(group.id)} className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                              <Plus size={12}/> Adauga Optiune
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Anuleaza</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-md">
                          Salveaza Produs
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
