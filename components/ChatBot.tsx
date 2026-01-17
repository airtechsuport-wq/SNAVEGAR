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
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-40 ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-24 md:right-8 w-full md:w-96 h-[80vh] md:h-[600px] bg-white shadow-2xl rounded-t-2xl md:rounded-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <span className="font-semibold">Assistente IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-600 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-500 text-xs px-3 py-2 rounded-lg animate-pulse">
                  Analisando dados...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Quanto gastamos em combustível?"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="bg-primary text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;