import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './Shared';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  showAlert: (message: string, title?: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, showAlert }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Don't show an alert on load, just disable the feature.
      // The button's disabled state will handle user feedback.
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onTranscript(transcript);
    };

    // Add speech detection events
    recognition.onspeechstart = () => setIsSpeaking(true);
    recognition.onspeechend = () => setIsSpeaking(false);

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      setIsSpeaking(false); // Ensure reset on end
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      let errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = "A permissão para usar o microfone foi negada. Verifique as configurações do seu navegador.";
      } else if (event.error === 'no-speech') {
        errorMessage = "Nenhuma fala foi detectada. Tente falar mais perto do microfone.";
      }
      showAlert(errorMessage, "Erro de Gravação");
      setIsRecording(false);
      setIsSpeaking(false); // Ensure reset on error
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, showAlert]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      showAlert("O reconhecimento de voz não é suportado pelo seu navegador.", "Funcionalidade Indisponível");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // This can happen if the user clicks the button again quickly before the 'end' event fires.
        if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
           console.error("Could not start speech recognition:", error);
           showAlert("Não foi possível iniciar a gravação. Tente novamente.", "Erro");
        }
      }
    }
  };

  const isSupported = !!recognitionRef.current;

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={!isSupported}
      className={`p-2 rounded-full transition-colors duration-300 flex items-center justify-center ${
        isRecording
          ? 'bg-red-500 animate-pulse-scale'
          : 'bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={!isSupported ? "Reconhecimento de voz não suportado" : (isRecording ? 'Parar gravação' : 'Gravar descrição por voz')}
    >
      <MicIcon isRecording={isRecording} isSpeaking={isSpeaking} />
    </button>
  );
};