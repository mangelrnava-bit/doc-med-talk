import { useCallback, useEffect, useState } from "react";

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const {
    lang = 'es-ES',
    rate = 1,
    pitch = 1,
    volume = 1
  } = options;

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const updateVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      updateVoices();
      speechSynthesis.addEventListener('voiceschanged', updateVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Try to find a Spanish voice
    const spanishVoice = voices.find(voice => 
      voice.lang.startsWith('es') || voice.name.toLowerCase().includes('spanish')
    );
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [isSupported, voices, lang, rate, pitch, volume]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
    voices
  };
};