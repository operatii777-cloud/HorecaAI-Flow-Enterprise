
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, X } from 'lucide-react';

interface VoiceInputProps {
  onCommand: (text: string) => void;
  isListening: boolean;
  toggleListening: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onCommand, isListening, toggleListening }) => {
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ro-RO';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setTranscript(finalTranscript);
            onCommand(finalTranscript);
            toggleListening(); // Auto stop after command
          } else {
            interimTranscript += event.results[i][0].transcript;
            setTranscript(interimTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toggleListening();
      };

      recognition.onend = () => {
        if (isListening) {
           // Optional: Auto restart if we wanted continuous
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isListening, onCommand, toggleListening]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch(e) {
        console.warn("Already started");
      }
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white px-6 py-4 rounded-full shadow-2xl z-[60] flex items-center gap-4 backdrop-blur-md animate-in slide-in-from-bottom-10 fade-in border border-slate-700">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-red-600 p-2 rounded-full">
            <Mic size={24} className="text-white"/>
        </div>
      </div>
      
      <div className="flex flex-col min-w-[200px]">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">HorecaAI Assistant</span>
          <span className="font-medium text-lg whitespace-nowrap">{transcript || "Ascult..."}</span>
      </div>

      <div className="h-8 w-px bg-slate-700 mx-2"></div>

      <button onClick={toggleListening} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <X size={20}/>
      </button>
    </div>
  );
};
