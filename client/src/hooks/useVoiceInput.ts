import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window for cross-browser Speech Recognition
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  setLang: (lang: string) => void;
  lang: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Please allow microphone access in your browser settings.',
  'no-speech': 'No speech was detected. Please try again.',
  'audio-capture': 'Microphone not found. Please connect a microphone.',
  'network': 'Network error during speech recognition. Check your internet connection.',
  'aborted': '',
  'service-not-allowed': 'Speech recognition service is not allowed. Try using Chrome or Edge.',
};

const AUTO_STOP_MS = 10000;

export function useVoiceInput(initialLang = 'en-IN'): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState(initialLang);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = !!getSpeechRecognition();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) setInterimTranscript(interim);
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = ERROR_MESSAGES[event.error] || `Speech recognition error: ${event.error}`;
      if (msg) setError(msg);
      setIsListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, AUTO_STOP_MS);
    } catch (err: any) {
      setError('Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  }, [lang, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
    setLang,
    lang,
  };
}
