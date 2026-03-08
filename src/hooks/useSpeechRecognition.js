import { useMemo, useRef, useState } from 'react';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const supported = useMemo(() => Boolean(SpeechRecognitionAPI), []);

  const start = () => {
    if (!supported || isListening) {
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError('');
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      setError(event.error ?? 'Speech recognition error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript ?? '';
      setTranscript(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
  };

  const clear = () => {
    setTranscript('');
    setError('');
  };

  return {
    supported,
    transcript,
    isListening,
    error,
    start,
    stop,
    clear,
  };
};
