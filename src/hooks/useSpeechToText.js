import { useState, useRef, useCallback } from "react";

export function useSpeechToText() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setTranscript(finalText);
    };

    recognition.onerror = (event) => {
      // Map error codes to user-friendly messages
      const errorMessages = {
        network:
          "Connection issue. Please make sure you're on a secure connection (HTTPS) and try again.",
        "not-allowed":
          "Microphone access was denied. Please allow microphone access in your browser settings and try again.",
        "no-speech": "No speech detected. Please try speaking again.",
        "audio-capture":
          "No microphone found. Please connect a microphone and try again.",
        aborted: "Recording was stopped.",
      };

      const msg =
        errorMessages[event.error] ||
        `Speech recognition error: ${event.error}`;

      // Don't show "aborted" as an error — it happens on manual stop
      if (event.error !== "aborted") {
        setError(msg);
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError("Could not start recording. Please refresh and try again.");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  return { listening, transcript, error, start, stop, reset };
}
