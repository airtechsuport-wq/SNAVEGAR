import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useRecords } from '../contexts/RecordContext';

const ChatBot: React.FC = () => {
  const { records } = useRecords(); // Dados via context
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: 'Olá! Analisei todo o seu banco de dados. Pergunte-me sobre despesas totais, desempenho da equipe, tendências de quilometragem ou problemas de entrega.' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = message;
    setMessage('');
    setHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    const response = await geminiService.chatWithBot(userMsg, records);

    setHistory(prev => [...prev, { sender: 'bot', text: response }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 md:bottom-8 right-6 md:right-8 bg-black text-white w-14 h-14 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 items-center justify-center ${isOpen ? 'hidden' : 'flex animate-bounce-subtle'}`}
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white animate-pulse"></div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-8 w-full md:w-[400px] h-full md:h-[600px] bg-white md:shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:rounded-[2.5rem] flex flex-col z-50 overflow-hidden border-none md:border md:border-black/5 animate-fade-in-up">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-md p-5 text-gray-900 flex justify-between items-center border-bottom border-black/5 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={22} />
              </div>
              <div>
                <span className="font-bold text-base block leading-tight">Assistente IA</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Online agora</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="bg-surface hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface/50 scroll-smooth" ref={scrollRef}>
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-tr-none shadow-md'
                      : 'bg-white border border-black/5 text-gray-800 rounded-tl-none shadow-soft'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-black/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-soft flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  Analisando dados
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-5 bg-white border-t border-black/5 flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo sobre os registros..."
                className="w-full bg-surface border border-black/5 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .animate-bounce-subtle {
          animation: bounceSubtle 3s infinite;
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default ChatBot;