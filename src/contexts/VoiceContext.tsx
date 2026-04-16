import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isVoiceSupported: boolean;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const VAPI_PUBLIC_KEY = process.env.REACT_APP_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = process.env.REACT_APP_VAPI_ASSISTANT_ID || '';

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isVoiceSupported] = useState(true); // VAPI is supported in modern browsers

  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    // Initialize VAPI client
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    // Event Listeners
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onCallStart = () => setIsListening(true);
    const onCallEnd = () => setIsListening(false);

    const onMessage = (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final' && message.role === 'user') {
        setTranscript(message.transcript);
      }
    };

    const onError = (error: any) => {
      console.error('VAPI Error:', error);
      setIsListening(false);
      setIsSpeaking(false);
    };

    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('error', onError);

    // Cleanup
    return () => {
      vapi.stop();
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('error', onError);
    };
  }, []);

  const startListening = () => {
    if (vapiRef.current && !isListening) {
      setTranscript('');
      vapiRef.current.start(VAPI_ASSISTANT_ID);
    }
  };

  const stopListening = () => {
    if (vapiRef.current && isListening) {
      vapiRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const speak = (text: string) => {
    if (vapiRef.current && isListening) {
      setIsSpeaking(true);
      try {
        vapiRef.current.say(text, false);
      } catch (err) {
        console.warn('VAPI speak failed:', err);
        setIsSpeaking(false);
      }
    } else {
      console.warn('VoiceContext: Cannot speak, call not active or starting.');
    }
  };

  const stopSpeaking = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      setIsSpeaking(false);
    }
  };

  const value: VoiceContextType = {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
    speak,
    stopSpeaking,
    isVoiceSupported,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

