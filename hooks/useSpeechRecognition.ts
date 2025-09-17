// Fix: Import React types
import { useState, useEffect, useRef } from 'react';

// Fix: Add custom type definitions for the Web Speech API to resolve TypeScript errors.
// These types are not always present in default TypeScript DOM libraries and are needed
// for cross-browser compatibility with vendor-prefixed implementations.

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [key: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

// Main interface for the SpeechRecognition instance. A custom name `ISpeechRecognition`
// is used to avoid a name collision with the `SpeechRecognition` variable declared below.
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

// Define the constructor type for SpeechRecognition.
type SpeechRecognitionConstructor = new () => ISpeechRecognition;

// Extend the global Window interface to let TypeScript know about
// SpeechRecognition and its vendor-prefixed variant.
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}


// Polyfill for cross-browser compatibility
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = (onTranscriptChange: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  // Fix: Use the custom ISpeechRecognition interface to type the ref, avoiding the name collision.
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onTranscriptChange(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // If it stops unexpectedly, try to restart it.
        // Some browsers have time limits.
        try {
          recognition.start();
        } catch(e) {
          console.error("Recognition restart failed", e);
          setIsListening(false);
        }
      }
    };
    
    recognitionRef.current = recognition;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscriptChange, isListening]);
  
  // This effect manages starting/stopping based on isListening state
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Could not start recognition:", e);
        setIsListening(false);
      }
    } else {
      try {
        recognition.stop();
      } catch(e) {
        console.error("Could not stop recognition:", e);
      }
    }
  }, [isListening]);


  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening, hasSupport: !!SpeechRecognitionAPI };
};
