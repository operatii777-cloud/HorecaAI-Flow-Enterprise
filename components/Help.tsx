
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Book, LayoutGrid, PackageOpen, Settings } from 'lucide-react';

export const Help: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>('pos');

  const sections = [
    {
      id: 'pos',
      title: 'POS & Vanzare',
      icon: LayoutGrid,
      items: [
        { q: 'Cum preiau o comanda noua?', a: 'Selecteaza o masa libera (alba) din planul salii. Adauga produse din meniu. Apasa "Trimite (F9)" pentru a trimite comanda la sectii (Bar/Bucatarie).' },
        { q: 'Cum incasez o nota (Cash/Card)?', a: 'Selecteaza masa ocupata. Apasa butonul "Incasare (F4)". Introdu suma primita si selecteaza metoda de plata. Poti introduce si bacsisul.' },
        { q: 'Cum impart nota (Split Bill)?', a: 'In ecranul comenzii, apasa butonul "SPLIT". Poti imparti "La Egalitate" (ex: la 4 persoane) sau "Pe Articole" (selectand ce plateste fiecare).' },
        { q: 'Cum fac o comanda de Livrare?', a: 'Apasa butonul "Delivery / Comanda Noua" din ecranul principal POS. Cauta clientul dupa telefon sau introdu datele manual.' }
      ]
    },
    {
      id: 'inv',
      title: 'Stocuri & Gestiune',
      icon: PackageOpen,
      items: [
        { q: 'Cum fac receptia marfii (NIR)?', a: 'Mergi la Stocuri > Receptie (NIR). Selecteaza furnizorul si adauga produsele primite cu pret si cantitate. Stocul se actualizeaza automat.' },
        { q: 'Ce este "Smart Restock"?', a: 'Este o functie care analizeaza stocurile sub limita minima si genereaza automat o lista de cumparaturi, pe care o poti transforma in comenzi Draft.' },
        { q: 'Cum reglez diferentele de inventar?', a: 'Mergi la tab-ul "Inventar Faptic". Introdu cantitatile reale gasite pe raft. Sistemul va calcula diferenta si va ajusta stocul scriptic.' }
      ]
    },
    {
      id: 'admin',
      title: 'Administrare',
      icon: Settings,
      items: [
        { q: 'Cum adaug un angajat nou?', a: 'In Setari > Utilizatori, apasa "+ Adauga User". Seteaza Numele, Rolul si un PIN de 4 cifre pentru acces.' },
        { q: 'Cum configurez planul meselor?', a: 'In Setari > Configurare Sala, poti adauga mese si le poti muta folosind "Drag & Drop" pe harta vizuala.' },
        { q: 'Cum vad profitul real (P&L)?', a: 'Modulul "Financiar" calculeaza automat Profitul Net scazand Costul Marfii (COGS), Salariile si Cheltuielile din Incasari.' }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50 overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <HelpCircle size={32}/>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Centrul de Ajutor</h2>
            <p className="text-slate-500 text-sm">Manual de utilizare si intrebari frecvente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
          {/* Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
              <h3 className="font-bold text-slate-700 mb-4 px-2 uppercase text-xs tracking-wider">Categorii</h3>
              <div className="space-y-2">
                  {sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeSection === section.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                          <section.icon size={18}/>
                          <span className="font-bold text-sm">{section.title}</span>
                          {activeSection === section.id && <ChevronRight size={16} className="ml-auto"/>}
                      </button>
                  ))}
              </div>
              
              <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2"><Book size={16}/> Scurtaturi Rapide</h4>
                  <ul className="text-xs text-amber-700 space-y-1 font-mono">
                      <li>F4 - Incasare</li>
                      <li>F9 - Trimite Comanda</li>
                      <li>ESC - Anulare / Inchide</li>
                  </ul>
              </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 overflow-y-auto">
              {activeSection ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-2xl font-bold text-slate-800 border-b pb-4 mb-6">
                          {sections.find(s => s.id === activeSection)?.title}
                      </h3>
                      
                      <div className="space-y-4">
                          {sections.find(s => s.id === activeSection)?.items.map((item, idx) => (
                              <div key={idx} className="border border-slate-100 rounded-xl p-5 hover:bg-slate-50 transition-colors group">
                                  <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                                      <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5">?</span>
                                      {item.q}
                                  </h4>
                                  <p className="text-slate-600 text-sm pl-8 leading-relaxed">
                                      {item.a}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Book size={64} className="mb-4 opacity-20"/>
                      <p>Selecteaza o categorie pentru a vedea detaliile.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
