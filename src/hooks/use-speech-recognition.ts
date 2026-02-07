'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Define the shape of the options object
type SpeechRecognitionOptions = {
  onStop?: (transcript: string) => void;
};

// The browser's SpeechRecognition object
interface CustomSpeechRecognition extends SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

// Check for browser support
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export const useSpeechRecognition = (options?: SpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);

  // Use a ref to hold the onStop callback to avoid re-running the effect
  const onStopRef = useRef(options?.onStop);
  useEffect(() => {
    onStopRef.current = options?.onStop;
  }, [options?.onStop]);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition() as CustomSpeechRecognition;
    recognition.continuous = false; // Stop after a pause
    recognition.interimResults = true; // Get results as the user speaks
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // For now, we only care about the final transcript
      setTranscript(finalTranscript.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access was denied. Please enable it in your browser settings.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Check if there is a final transcript and a callback to call
      if (onStopRef.current && transcript) {
        onStopRef.current(transcript);
      }
    };
    
    recognitionRef.current = recognition;

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [transcript]); // Rerun effect if transcript changes to pass the latest version to the onStop callback

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will handle setting isListening to false and calling the callback
    }
  }, [isListening]);

  return { isListening, transcript, error, startListening, stopListening };
};
