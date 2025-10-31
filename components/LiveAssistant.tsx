import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { decode, decodeAudioData, createBlob } from '../utils/helpers';
import { Spinner } from './Shared';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose, showAlert }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Refs to accumulate transcription chunks for a full turn
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');


  const disconnect = () => {
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => session.close());
          sessionPromiseRef.current = null;
      }
      if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
      }
      if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
      }
      if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect();
          scriptProcessorRef.current.onaudioprocess = null;
          scriptProcessorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
      }
       if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
          outputAudioContextRef.current.close();
      }

      playingSourcesRef.current.forEach(source => source.stop());
      playingSourcesRef.current.clear();
      setConnectionState('disconnected');
  };
  
  const connect = async () => {
    setConnectionState('connecting');
    setTranscript([]);
    currentInputRef.current = '';
    currentOutputRef.current = '';

    try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error("Microphone access denied:", err);
        showAlert("A permissão para acessar o microfone é necessária para usar o assistente de voz.", "Acesso Negado");
        setConnectionState('error');
        return;
    }
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'Você é Iara, uma assistente de IA amigável e especializada em marcenaria e design de interiores para o aplicativo MarcenApp. Seja concisa, prestativa e mantenha um tom conversacional.'
        },
        callbacks: {
            onopen: () => {
                setConnectionState('connected');
                sourceNodeRef.current = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    if (sessionPromiseRef.current) {
                        sessionPromiseRef.current.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    }
                };
                
                sourceNodeRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(audioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    currentInputRef.current += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.outputTranscription) {
                    currentOutputRef.current += message.serverContent.outputTranscription.text;
                }

                if (message.serverContent?.turnComplete) {
                     const fullInput = currentInputRef.current.trim();
                     const fullOutput = currentOutputRef.current.trim();
                     if (fullInput || fullOutput) {
                         setTranscript(prev => [...prev, `Você: ${fullInput}`, `Iara: ${fullOutput}`]);
                     }
                     // Reset for the next turn
                     currentInputRef.current = '';
                     currentOutputRef.current = '';
                }
                
                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audioData && outputAudioContextRef.current) {
                    const outputCtx = outputAudioContextRef.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    
                    source.addEventListener('ended', () => {
                        playingSourcesRef.current.delete(source);
                    });
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    playingSourcesRef.current.add(source);
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error("Live session error:", e);
                showAlert("Ocorreu um erro na conexão com o assistente.", "Erro de Conexão");
                setConnectionState('error');
                disconnect();
            },
            onclose: (e: CloseEvent) => {
                disconnect();
            },
        },
    });
  };

  useEffect(() => {
    return () => {
        // Cleanup on component unmount
        disconnect();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
      disconnect();
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-gray-900/90 z-50 flex flex-col justify-center items-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl h-[80vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col">
        <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e]">Conversar com Iara</h2>
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connectionState === 'connected' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] capitalize">{connectionState}</span>
                <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl ml-4">&times;</button>
            </div>
        </header>
        <main className="p-4 flex-grow overflow-y-auto space-y-4">
            {transcript.length === 0 && connectionState !== 'connected' && (
                <div className="text-center text-[#8a7e7e] dark:text-[#a89d8d] pt-10">
                    <p>Pressione "Conectar" para iniciar uma conversa por voz com a Iara.</p>
                </div>
            )}
            {transcript.map((line, index) => (
                <div key={index} className={`p-3 rounded-lg ${line.startsWith('Você:') ? 'bg-[#f0e9dc] dark:bg-[#4a4040]' : 'bg-[#fffefb] dark:bg-[#3e3535]'}`}>
                   <p className="text-[#3e3535] dark:text-[#c7bca9] whitespace-pre-wrap">{line}</p>
                </div>
            ))}
        </main>
        <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] text-center">
             {connectionState === 'idle' || connectionState === 'disconnected' || connectionState === 'error' ? (
                <button onClick={connect} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-6 rounded-lg hover:bg-[#c89f5e] transition">
                    Conectar
                </button>
            ) : connectionState === 'connecting' ? (
                 <div className="flex items-center justify-center gap-2 text-[#8a7e7e] dark:text-[#a89d8d]">
                    <Spinner size="sm" /> Conectando...
                </div>
            ) : (
                 <button onClick={disconnect} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition">
                    Desconectar
                </button>
            )}
        </footer>
      </div>
    </div>
  );
};