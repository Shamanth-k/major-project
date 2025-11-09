
import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse } from '../services/aiService';
import { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! How can I assist you with your training today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessage: ChatMessage = { sender: 'bot', text: '' };
    setMessages(prev => [...prev, botMessage]);

    await streamChatResponse(messages, input, (chunk) => {
        setMessages(prev => {
            const lastMsgIndex = prev.length - 1;
            if (prev[lastMsgIndex]?.sender === 'bot') {
                const newMessages = [...prev];
                newMessages[lastMsgIndex] = { ...newMessages[lastMsgIndex], text: chunk };
                return newMessages;
            }
            return prev;
        });
    });
    
    setIsLoading(false);
  };

  return (
    <>
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'w-full max-w-md h-2/3' : 'w-16 h-16'}`}>
        {isOpen ? (
          <div className="flex flex-col w-full h-full bg-gray-800/80 backdrop-blur-lg rounded-xl border border-purple-500/50 shadow-2xl shadow-purple-900/50">
            <header className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-orbitron text-purple-300">AI Assistant</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </header>
            <div className="flex-grow p-4 overflow-y-auto no-scrollbar">
              {messages.map((msg, index) => (
                <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                    {msg.text || <span className="animate-pulse">...</span>}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="flex-grow bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-700 transition-transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default ChatBot;
