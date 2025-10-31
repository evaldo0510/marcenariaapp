import React, { useState, useEffect, useRef } from 'react';
import { generateGroundedResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { Spinner, LogoIcon, SearchIcon } from './Shared';
import { convertMarkdownToHtml } from '../utils/helpers';

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

type LocationState = { latitude: number; longitude: number } | null;

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({ isOpen, onClose, showAlert }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<LocationState>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Request location when the assistant is opened
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation permission denied:", error.message);
                    // Handle denial gracefully, the app will still work without it
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
             if (messages.length === 0) {
                setMessages([{
                    id: 'initial',
                    role: 'model',
                    text: 'Olá! Sou a Iara, sua assistente de pesquisa. Posso buscar informações atualizadas na web e em mapas. O que você gostaria de saber?'
                }]);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isLoading) return;

        const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);
        
        try {
            const { text, sources } = await generateGroundedResponse(trimmedInput, location);
            const newModelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', text, sources };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            console.error('Grounded response error:', error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'model',
                text: `Desculpe, ocorreu um erro ao processar sua pergunta: ${error instanceof Error ? error.message : 'Erro desconhecido.'}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-gray-900/90 z-50 flex flex-col justify-center items-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl h-[80vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col">
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><SearchIcon /> Pesquisar com Iara</h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                <main className="p-4 flex-grow overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 bg-[#d4ac6e] rounded-full flex items-center justify-center"><LogoIcon className="text-[#3e3535]" /></div>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-[#f0e9dc] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8]'}`}>
                                <div className="prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(msg.text) }} />
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-[#e6ddcd] dark:border-[#5a4f4f]">
                                        <h4 className="text-xs font-semibold text-[#8a7e7e] dark:text-[#a89d8d] mb-1">Fontes:</h4>
                                        <ul className="text-xs space-y-1">
                                            {msg.sources.map((source, index) => (
                                                <li key={index}>
                                                    <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-500 hover:underline truncate block">
                                                        {source.web?.title || source.maps?.title || 'Link'}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex gap-3">
                             <div className="w-8 h-8 flex-shrink-0 bg-[#d4ac6e] rounded-full flex items-center justify-center"><LogoIcon className="text-[#3e3535]" /></div>
                            <div className="p-3 rounded-lg bg-[#f0e9dc] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                                <Spinner size="sm" /> <span>Pesquisando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Pergunte sobre tendências, fornecedores..."
                            className="flex-grow bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                        <button onClick={handleSendMessage} disabled={isLoading} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isLoading ? <Spinner size="sm" /> : 'Enviar'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};