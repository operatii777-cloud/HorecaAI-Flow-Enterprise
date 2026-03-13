
import React, { useState, useEffect } from 'react';
import { MenuItem, User, QuizResult, Skill } from '../types';
import { ApiService } from '../services/api';
import { GraduationCap, ArrowRight, BrainCircuit, RotateCcw, CheckCircle, XCircle, Award, LayoutGrid, UserCheck } from 'lucide-react';

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export const StaffTraining: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz' | 'cert' | 'matrix'>('learn');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [user, setUser] = useState<User | null>(null); // Mock current user context

  // Certs & Skills
  const [results, setResults] = useState<QuizResult[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
      const load = async () => {
          const [m, r, s, u] = await Promise.all([
              ApiService.getMenu(),
              ApiService.getQuizResults(),
              ApiService.getSkills(),
              ApiService.getUsers()
          ]);
          setMenu(m);
          setResults(r);
          setSkills(s);
          setAllUsers(u);
          if (u.length > 0) setUser(u[1] || u[0]); // Default waiter
      };
      load();
  }, [activeTab]); 

  const startQuiz = () => {
      // Generate Questions
      const questions: Question[] = [];
      const menuSample = [...menu].sort(() => 0.5 - Math.random()).slice(0, 5);

      menuSample.forEach(item => {
          // Question Type 1: Price
          const wrongPrice1 = Math.round(item.price * 0.8);
          const wrongPrice2 = Math.round(item.price * 1.2);
          const options = [`${wrongPrice1} RON`, `${item.price} RON`, `${wrongPrice2} RON`].sort(() => 0.5 - Math.random());
          questions.push({
              text: `Cat costa produsul "${item.name}"?`,
              options,
              correctIndex: options.indexOf(`${item.price} RON`),
              explanation: `Pretul corect este ${item.price} RON.`
          });

          // Question Type 2: Allergen
          if (item.allergens && item.allergens.length > 0) {
              const allergen = item.allergens[0];
              const safeItem = menu.find(i => !i.allergens?.includes(allergen))?.name || 'Apa';
              const qOptions = [item.name, safeItem].sort(() => 0.5 - Math.random());
              questions.push({
                  text: `Care dintre aceste produse contine ${allergen}?`,
                  options: qOptions,
                  correctIndex: qOptions.indexOf(item.name),
                  explanation: `${item.name} contine ${allergen}.`
              });
          }
      });

      setQuizQuestions(questions.slice(0, 5));
      setCurrentQuestionIdx(0);
      setScore(0);
      setQuizFinished(false);
      setActiveTab('quiz');
  };

  const handleAnswer = (idx: number) => {
      if (idx === quizQuestions[currentQuestionIdx].correctIndex) {
          setScore(score + 1);
      }
      
      if (currentQuestionIdx < quizQuestions.length - 1) {
          setCurrentQuestionIdx(currentQuestionIdx + 1);
      } else {
          finishQuiz();
      }
  };

  const finishQuiz = async () => {
      setQuizFinished(true);
      if (user) {
          const finalScore = score + (quizQuestions[currentQuestionIdx].correctIndex === -1 ? 0 : 0); // Simplified logic
          
          const result: QuizResult = {
              id: Date.now().toString(),
              userId: user.id,
              userName: user.name,
              score: Math.round((score / quizQuestions.length) * 100),
              totalQuestions: quizQuestions.length,
              date: new Date().toISOString(),
              topic: 'Menu Knowledge'
          };
          
          await ApiService.saveQuizResult(result);
          setResults(await ApiService.getQuizResults());
      }
  };

  const handleAssignSkill = async (userId: string, skillId: string) => {
      await ApiService.assignSkill(userId, skillId);
      setAllUsers(await ApiService.getUsers());
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 bg-slate-50">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-indigo-600"/> Training Academy
                </h2>
                <p className="text-slate-500 text-sm">Platforma de invatare si certificare pentru angajati.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('learn')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'learn' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Invata Meniul</button>
                <button onClick={startQuiz} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'quiz' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Quiz Test</button>
                <button onClick={() => setActiveTab('cert')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'cert' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Certificari</button>
                <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'matrix' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>Matrice HR</button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {activeTab === 'learn' && menu.length > 0 && (
                <div className="w-full max-w-md perspective-1000">
                    <div 
                        className={`relative w-full h-96 transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-slate-900 text-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl border-4 border-slate-800">
                            <h3 className="text-3xl font-bold text-center mb-4">{menu[currentCardIndex].name}</h3>
                            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-white/20">
                                <img src={menu[currentCardIndex].image} className="w-full h-full object-cover"/>
                            </div>
                            <p className="text-sm uppercase tracking-widest text-slate-400">Apasa pentru detalii</p>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white text-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl border-4 border-indigo-500">
                            <div className="text-center space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Pret</span>
                                    <div className="text-3xl font-black text-indigo-600">{menu[currentCardIndex].price} RON</div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Ingrediente Cheie</span>
                                    <p className="text-sm font-medium">{menu[currentCardIndex].description}</p>
                                </div>
                                {menu[currentCardIndex].allergens && (
                                    <div>
                                        <span className="text-xs font-bold text-red-400 uppercase">Alergeni</span>
                                        <div className="flex flex-wrap gap-2 justify-center mt-1">
                                            {menu[currentCardIndex].allergens?.map(a => (
                                                <span key={a} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => { setCurrentCardIndex(Math.max(0, currentCardIndex - 1)); setIsFlipped(false); }} disabled={currentCardIndex === 0} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-50"><ArrowRight className="rotate-180"/></button>
                        <span className="font-bold text-slate-400 flex items-center">{currentCardIndex + 1} / {menu.length}</span>
                        <button onClick={() => { setCurrentCardIndex(Math.min(menu.length - 1, currentCardIndex + 1)); setIsFlipped(false); }} disabled={currentCardIndex === menu.length - 1} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-50"><ArrowRight/></button>
                    </div>
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="w-full max-w-lg">
                    {!quizFinished ? (
                        <>
                            <div className="mb-8">
                                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                    <span>Intrebarea {currentQuestionIdx + 1} / {quizQuestions.length}</span>
                                    <span>Score: {score}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{width: `${((currentQuestionIdx+1)/quizQuestions.length)*100}%`}}></div>
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center">{quizQuestions[currentQuestionIdx]?.text}</h3>
                            
                            <div className="space-y-4">
                                {quizQuestions[currentQuestionIdx]?.options.map((opt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        className="w-full p-4 text-left border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 font-bold transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center animate-in zoom-in">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award size={48}/>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Quiz Finalizat!</h2>
                            <p className="text-xl text-slate-500 mb-8">Scor final: <span className="text-indigo-600 font-bold">{score} / {quizQuestions.length}</span></p>
                            
                            <button onClick={startQuiz} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto hover:bg-slate-800">
                                <RotateCcw size={18}/> Incearca din nou
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'cert' && (
                <div className="w-full max-w-2xl overflow-y-auto h-full">
                    <h3 className="font-bold text-lg text-slate-700 mb-4">Istoric Rezultate</h3>
                    <div className="space-y-3">
                        {results.map(res => (
                            <div key={res.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow bg-white">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${res.score >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {res.score >= 80 ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{res.topic}</div>
                                        <div className="text-xs text-slate-500">{new Date(res.date).toLocaleString()} • {res.userName}</div>
                                    </div>
                                </div>
                                <div className={`text-2xl font-black ${res.score >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {res.score}%
                                </div>
                            </div>
                        ))}
                        {results.length === 0 && <p className="text-center text-slate-400 py-10">Niciun rezultat inregistrat.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'matrix' && (
                <div className="w-full h-full overflow-hidden flex flex-col">
                    <div className="mb-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-indigo-900 text-lg">Matrice Competente (Skills Matrix)</h3>
                            <p className="text-sm text-indigo-700">Vizualizare certificari per angajat. Competentele se deblocheaza automat prin Quiz-uri sau manual.</p>
                        </div>
                        <LayoutGrid className="text-indigo-400" size={32}/>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-left font-bold text-slate-600 border-b">Angajat / Rol</th>
                                    {skills.map(skill => (
                                        <th key={skill.id} className="p-4 text-center font-bold text-slate-600 border-b w-32" title={skill.description}>
                                            {skill.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-xs text-slate-500 uppercase">{u.role}</div>
                                        </td>
                                        {skills.map(skill => {
                                            const hasSkill = u.skills?.includes(skill.id);
                                            return (
                                                <td key={skill.id} className="p-4 text-center border-l">
                                                    {hasSkill ? (
                                                        <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full">
                                                            <CheckCircle size={18}/>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-300 rounded-full cursor-pointer hover:bg-slate-200"
                                                            onClick={() => handleAssignSkill(u.id, skill.id)}
                                                            title="Atribuie Manual"
                                                        >
                                                            <UserCheck size={14}/>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
