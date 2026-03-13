
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Invoice, Supplier } from '../types';
import { ApiService } from '../services/api';
import { FileText, Plus, Download, Send, RefreshCw, Mail, CheckCircle } from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [formData, setFormData] = useState({
      clientName: '',
      clientCUI: '',
      items: [{ name: '', quantity: 1, unitPrice: 0 }]
  });

  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
      refresh();
  }, []);

  const refresh = async () => {
      const [inv, sup] = await Promise.all([
          ApiService.getInvoices(),
          ApiService.getSuppliers()
      ]);
      setInvoices(inv);
      setSuppliers(sup);
  };

  const openEmailModal = (invoice: Invoice) => {
      const supplier = suppliers.find(s => s.id === invoice.supplierId);
      const email = supplier ? supplier.email : 'office@furnizor.ro';
      
      const itemsList = invoice.items.map(i => `- ${i.quantity} x ${i.name}`).join('\n');
      
      setSelectedInvoice(invoice);
      setEmailData({
          to: email,
          subject: `Comanda Noua - ${invoice.number}`,
          body: `Buna ziua,\n\nVa rugam sa livrati urmatoarele produse conform comenzii atasate (${invoice.number}):\n\n${itemsList}\n\nMultumim,\nHorecaAI Bistro`
      });
      setIsEmailModalOpen(true);
  };

  const handleSendEmail = () => {
      if(selectedInvoice) {
          alert(`Email trimis catre ${emailData.to}!`);
          setIsEmailModalOpen(false);
      }
  };

  const defs: ColDef<Invoice>[] = [
      { field: 'number', headerName: 'Numar', width: 120, cellRenderer: (p: any) => <span className="font-bold text-slate-700">{p.value}</span> },
      { field: 'date', headerName: 'Data', width: 120, valueFormatter: p => new Date(p.value).toLocaleDateString() },
      { field: 'clientName', headerName: 'Client / Furnizor', flex: 1, valueGetter: p => p.data?.clientName || p.data?.supplierId || '' },
      { field: 'totalValue', headerName: 'Valoare Totala', width: 150, valueFormatter: p => `${p.value.toFixed(2)} RON` },
      { field: 'type', headerName: 'Tip', width: 100, cellRenderer: (p: any) => (
         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.value === 'incoming' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
             {p.value === 'incoming' ? 'NIR' : 'FACTURA'}
         </span>
      )},
      { field: 'status', headerName: 'Status', width: 100, cellRenderer: (p: any) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              p.value === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
              p.value === 'draft' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-600'
          }`}>{p.value}</span>
      )},
      { headerName: 'Actiuni', width: 140, cellRenderer: (p: any) => (
          <div className="flex gap-2">
              <button className="text-slate-400 hover:text-slate-800" title="Descarca PDF"><Download size={18}/></button>
              {p.data.type === 'incoming' && p.data.status === 'draft' && (
                  <button onClick={() => openEmailModal(p.data)} className="text-blue-500 hover:text-blue-700" title="Trimite Email Furnizor"><Mail size={18}/></button>
              )}
          </div>
      )}
  ];

  const handleCreate = async () => {
      if(!formData.clientName || formData.items.length === 0) return alert("Completeaza toate campurile!");

      const newInv: Invoice = {
          id: Date.now().toString(),
          type: 'outgoing',
          clientName: formData.clientName,
          clientCUI: formData.clientCUI,
          number: `INV-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          items: formData.items.map(i => ({...i, total: i.quantity * i.unitPrice})),
          totalValue: formData.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0),
          status: 'posted'
      };

      await ApiService.createInvoice(newInv);
      refresh();
      setIsModalOpen(false);
      setFormData({ clientName: '', clientCUI: '', items: [{ name: '', quantity: 1, unitPrice: 0 }] });
  };

  const addItem = () => {
      setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, unitPrice: 0 }] });
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Facturare & Documente</h2>
                <p className="text-slate-500 text-sm">Emite facturi fiscale, proforme si gestioneaza documentele.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={refresh} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <RefreshCw size={20}/>
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <Plus size={20}/> Factura Noua
                </button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ag-theme-quartz">
            <AgGridReact rowData={invoices} columnDefs={defs} pagination={true} paginationPageSize={20} />
        </div>

        {/* Create Invoice Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-xl font-bold">Emite Factura Noua</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nume Client</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-xl" 
                                    value={formData.clientName}
                                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CUI / CIF</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-xl" 
                                    value={formData.clientCUI}
                                    onChange={e => setFormData({...formData, clientCUI: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">Produse / Servicii</h4>
                                <button onClick={addItem} className="text-indigo-600 text-xs font-bold hover:underline">+ Adauga Rand</button>
                            </div>
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Denumire" 
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        value={item.name}
                                        onChange={e => {
                                            const newItems = [...formData.items];
                                            newItems[idx].name = e.target.value;
                                            setFormData({...formData, items: newItems});
                                        }}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Cant" 
                                        className="w-20 p-2 border rounded-lg text-sm text-center"
                                        value={item.quantity}
                                        onChange={e => {
                                            const newItems = [...formData.items];
                                            newItems[idx].quantity = Number(e.target.value);
                                            setFormData({...formData, items: newItems});
                                        }}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Pret" 
                                        className="w-24 p-2 border rounded-lg text-sm text-right"
                                        value={item.unitPrice}
                                        onChange={e => {
                                            const newItems = [...formData.items];
                                            newItems[idx].unitPrice = Number(e.target.value);
                                            setFormData({...formData, items: newItems});
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t bg-slate-50 flex justify-between items-center rounded-b-3xl">
                        <div className="text-lg font-bold">
                            Total: {formData.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toFixed(2)} RON
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold">Anuleaza</button>
                            <button onClick={handleCreate} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">Emite Factura</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Email Modal */}
        {isEmailModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Mail className="text-blue-500"/> Trimite Document</h3>
                        <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destinatar</label>
                            <input 
                                type="email" 
                                className="w-full p-3 border rounded-xl" 
                                value={emailData.to}
                                onChange={e => setEmailData({...emailData, to: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subiect</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl" 
                                value={emailData.subject}
                                onChange={e => setEmailData({...emailData, subject: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mesaj</label>
                            <textarea 
                                className="w-full p-3 border rounded-xl h-32 resize-none" 
                                value={emailData.body}
                                onChange={e => setEmailData({...emailData, body: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setIsEmailModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">Anuleaza</button>
                        <button onClick={handleSendEmail} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Send size={18}/> Trimite Email
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};