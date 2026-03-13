
import React, { useState, useEffect } from 'react';
import { MenuItem, Ingredient, RecipeItem } from '../types';
import { ApiService } from '../services/api';
import { Scale, FileText, Plus, X, MonitorPlay, Minimize, ListChecks, Printer, Sparkles } from 'lucide-react';

interface RecipesProps {
  menuItems: MenuItem[];
  onUpdateRecipe: (itemId: string, recipe: RecipeItem[]) => void;
}

export const Recipes: React.FC<RecipesProps> = ({ menuItems, onUpdateRecipe }) => {
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeItem[]>([]);
  const [currentInstructions, setCurrentInstructions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  
  useEffect(() => {
    ApiService.getInventory().then(setIngredients);
  }, []);

  const handleSelectProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setCurrentRecipe(item.recipe || []);
    setCurrentInstructions(item.instructions || []);
    setActiveTab('ingredients');
  };

  const handleAddIngredient = (ingId: string) => {
    if (!currentRecipe.find(r => r.ingredientId === ingId)) {
        setCurrentRecipe([...currentRecipe, { ingredientId: ingId, quantity: 1, lossPercentage: 0 }]);
    }
  };

  const handleSave = async () => {
      if(selectedProduct) {
          const updatedItem = { 
              ...selectedProduct, 
              recipe: currentRecipe, 
              instructions: currentInstructions
          };
          await ApiService.saveMenuItem(updatedItem);
          onUpdateRecipe(updatedItem.id, currentRecipe);
          alert('Fisa tehnica salvata!');
      }
  };

  return (
    <div className="h-full flex gap-6 p-6 bg-slate-50 relative">
       <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="p-4 border-b bg-slate-50">
               <h3 className="font-bold text-slate-800">Selectie Produs</h3>
           </div>
           <div className="flex-1 overflow-y-auto">
               {menuItems.map(item => (
                   <div 
                    key={item.id} 
                    onClick={() => handleSelectProduct(item)}
                    className={`p-3 border-b flex justify-between items-center cursor-pointer hover:bg-slate-50 ${selectedProduct?.id === item.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}`}
                   >
                       <span className="font-medium text-sm text-slate-700">{item.name}</span>
                   </div>
               ))}
           </div>
       </div>

       <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
           {selectedProduct ? (
               <div className="flex flex-col h-full">
                   <div className="p-6 border-b bg-slate-50 flex justify-between items-start">
                       <div>
                           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                               <FileText size={20} className="text-amber-600"/> 
                               Fisa Tehnica: {selectedProduct.name}
                           </h2>
                       </div>
                       <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">Salveaza</button>
                   </div>
                   
                   <div className="flex-1 p-6 overflow-y-auto">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase">Adauga Ingredient</label>
                            <select className="w-full mt-1 p-2 border rounded-lg" onChange={(e) => { if(e.target.value) handleAddIngredient(e.target.value); e.target.value = ''; }}>
                                <option value="">-- Selecteaza --</option>
                                {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                            </select>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 text-left">Ingredient</th><th className="p-2 text-right">Cantitate</th><th className="p-2 text-right">Cost</th></tr></thead>
                            <tbody>
                                {currentRecipe.map(item => {
                                    const ing = ingredients.find(i => i.id === item.ingredientId);
                                    return ing ? (
                                        <tr key={item.ingredientId} className="border-b">
                                            <td className="p-2 font-medium">{ing.name}</td>
                                            <td className="p-2 text-right font-bold">{item.quantity} {ing.unit}</td>
                                            <td className="p-2 text-right font-bold text-slate-600">{(item.quantity * ing.costPerUnit).toFixed(2)} RON</td>
                                        </tr>
                                    ) : null;
                                })}
                            </tbody>
                        </table>
                   </div>
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <FileText size={64} className="mb-4 opacity-20"/>
                   <p>Selecteaza un produs</p>
               </div>
           )}
       </div>
    </div>
  );
};
