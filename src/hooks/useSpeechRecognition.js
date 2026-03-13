import { useCallback, useMemo, useRef, useState } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const supported = Boolean(SpeechRecognitionAPI);

  const start = useCallback(() => {
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
  }, [isListening, supported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const clear = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  return useMemo(
    () => ({
      supported,
      transcript,
      isListening,
      error,
      start,
      stop,
      clear,
    }),
    [clear, error, isListening, start, stop, supported, transcript],
  );
};
