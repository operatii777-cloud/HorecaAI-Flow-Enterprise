
import React from 'react';
import { CheckCircle, ArrowRight, ShieldCheck, Zap, BarChart3, Users, ChefHat, Globe, Star, Play } from 'lucide-react';

export const LandingPage: React.FC<{onLoginClick: () => void}> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">H</div>
            <span className="text-2xl font-black tracking-tight">HorecaAI <span className="text-indigo-600">Flow</span></span>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-sm text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Functionalitati</a>
            <a href="#benefits" className="hover:text-indigo-600 transition-colors">Beneficii</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Preturi</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </div>
          <button onClick={onLoginClick} className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-transform hover:scale-105 shadow-xl">
            Acceseaza Platforma
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-100">
              <Star size={14} fill="currentColor"/> Numarul 1 in Romania pentru Horeca
            </div>
            <h1 className="text-6xl font-black leading-tight tracking-tight">
              Transforma haosul in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Profit Predictibil</span>.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
              Primul ERP Horeca din lume alimentat de Gemini AI. Gestioneaza comenzi, stocuri, angajati si clienti dintr-o singura platforma. Fara erori. Fara pierderi.
            </p>
            <div className="flex gap-4">
              <button onClick={onLoginClick} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2">
                Incepe Demo Gratuit <ArrowRight size={20}/>
              </button>
              <button className="px-8 py-4 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                <Play size={20}/> Vezi Video
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> Setup in 30 min</span>
              <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> Fara card necesar</span>
              <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> Suport 24/7</span>
            </div>
          </div>
          <div className="relative animate-in slide-in-from-right duration-700 delay-200">
             <div className="relative z-10 bg-slate-900 rounded-3xl shadow-2xl border-8 border-slate-900 overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500">
                <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Dashboard" className="opacity-80"/>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white text-center">
                        <div className="text-4xl font-bold mb-2">+32%</div>
                        <div className="text-sm uppercase tracking-widest">Crestere Profit</div>
                    </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500 rounded-full blur-[100px] -z-10 opacity-30"></div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black mb-4">Un singur sistem. Posibilitati infinite.</h2>
            <p className="text-slate-500 text-lg">Inlocuieste 5 aplicatii separate cu HorecaAI Flow. Economiseste timp si bani din prima zi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'POS & Vanzare Rapida', desc: 'Interfata intuitiva pentru ospatari. Comenzi preluate in secunde, trimise instant la bucatarie.', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: ChefHat, title: 'KDS Inteligent', desc: 'Display pentru bucatarie care sorteaza comenzile pe statii si monitorizeaza timpii de preparare.', color: 'text-orange-500', bg: 'bg-orange-50' },
              { icon: BarChart3, title: 'Stocuri & Cost Control', desc: 'Scadere automata din retetar. Alerte stoc critic si generare automata lista de cumparaturi.', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Users, title: 'CRM & Loialitate', desc: 'Cunoaste-ti clientii. Ofera puncte, vouchere si experiente personalizate.', color: 'text-pink-500', bg: 'bg-pink-50' },
              { icon: Globe, title: 'Website & Rezervari', desc: 'Widget de rezervari inclus. Meniu digital QR code cu traducere automata.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: ShieldCheck, title: 'Audit & Securitate', desc: 'Log-uri detaliate pentru orice actiune. Previne furturile si erorile operationale.', color: 'text-slate-500', bg: 'bg-slate-200' },
            ].map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feat.bg}`}>
                  <feat.icon size={28} className={feat.color}/>
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h2 className="text-3xl font-bold mb-12">Peste 500+ locatii folosesc HorecaAI</h2>
           <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
               {/* Mock Logos */}
               <div className="text-2xl font-serif font-bold">Bistro V</div>
               <div className="text-2xl font-mono font-bold">URBAN.EATS</div>
               <div className="text-2xl font-sans font-black">COFFEE+</div>
               <div className="text-2xl font-serif italic">La Trattoria</div>
               <div className="text-2xl font-bold">BURGER KINGDOM</div>
           </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-black mb-4">Investitie transparenta</h2>
             <p className="text-slate-500">Alege planul care se potriveste afacerii tale. Fara costuri ascunse.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter */}
              <div className="p-8 rounded-3xl border border-slate-200 bg-white">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Starter</div>
                  <div className="text-4xl font-black mb-6">€49 <span className="text-lg font-normal text-slate-400">/luna</span></div>
                  <ul className="space-y-4 mb-8 text-slate-600">
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> 1 POS Terminal</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> Gestiune Stocuri Basic</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> Rapoarte Zilnice</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> Meniu Digital</li>
                  </ul>
                  <button className="w-full py-3 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50">Alege Starter</button>
              </div>

              {/* Pro - Highlighted */}
              <div className="p-8 rounded-3xl border-2 border-indigo-600 bg-slate-900 text-white relative transform md:-translate-y-4 shadow-2xl">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Popular</div>
                  <div className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">Professional</div>
                  <div className="text-4xl font-black mb-6">€99 <span className="text-lg font-normal text-slate-400">/luna</span></div>
                  <ul className="space-y-4 mb-8 text-slate-300">
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-400"/> <strong>Nelimitat</strong> POS & KDS</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-400"/> Gestiune Avansata (Retetar)</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-400"/> CRM & Fidelizare</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-400"/> <strong>AI Assistant (Gemini)</strong></li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-400"/> API Access</li>
                  </ul>
                  <button onClick={onLoginClick} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">Incepe Gratuit 14 Zile</button>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-3xl border border-slate-200 bg-white">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Enterprise</div>
                  <div className="text-4xl font-black mb-6">Custom</div>
                  <ul className="space-y-4 mb-8 text-slate-600">
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> Multi-Locatie (Franciza)</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> White-label App</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> Manager Dedicat</li>
                      <li className="flex gap-2"><CheckCircle size={18} className="text-emerald-500"/> SLA Garantat</li>
                  </ul>
                  <button className="w-full py-3 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50">Contacteaza-ne</button>
              </div>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
              <div>
                  <h3 className="font-black text-lg mb-4">HorecaAI</h3>
                  <p className="text-slate-500 text-sm">Solutia completa pentru ospitalitatea viitorului.</p>
              </div>
              <div>
                  <h4 className="font-bold mb-4">Produs</h4>
                  <ul className="space-y-2 text-sm text-slate-500">
                      <li><a href="#">Functionalitati</a></li>
                      <li><a href="#">Integrari</a></li>
                      <li><a href="#">Hardware</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold mb-4">Companie</h4>
                  <ul className="space-y-2 text-sm text-slate-500">
                      <li><a href="#">Despre Noi</a></li>
                      <li><a href="#">Cariere</a></li>
                      <li><a href="#">Contact</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-slate-500">
                      <li><a href="#">Termeni si Conditii</a></li>
                      <li><a href="#">GDPR</a></li>
                  </ul>
              </div>
          </div>
          <div className="text-center mt-12 text-xs text-slate-400">
              © 2024 HorecaAI Solutions SRL. Toate drepturile rezervate.
          </div>
      </footer>
    </div>
  );
};
