import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

interface VoiceButtonProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  isSpeaking?: boolean;
}

const VoiceButton = ({ onCommand, isListening, onListeningChange, isSpeaking = false }: VoiceButtonProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultRef = useRef<string>('');

  // Initialize speech recognition based on platform
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isNativePlatform = platform === 'ios' || platform === 'android';
    setIsNative(isNativePlatform);

    if (isNativePlatform) {
      // Native platform setup
      initializeNativeSpeechRecognition();
    } else {
      // Web platform setup
      initializeWebSpeechRecognition();
    }
  }, []);

  const initializeNativeSpeechRecognition = async () => {
    try {
      // Check if speech recognition is available
      const available = await SpeechRecognition.available();
      if (available) {
        // Request permissions
        const permissions = await SpeechRecognition.requestPermissions();
        if (permissions.speechRecognition === 'granted') {
          setIsSupported(true);
        }
      }
    } catch (error) {
      console.error('Native speech recognition setup failed:', error);
    }
  };

  const initializeWebSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // If we have a final result, process it
        if (finalTranscript && finalTranscript !== lastResultRef.current) {
          lastResultRef.current = finalTranscript;
          onCommand(finalTranscript.toLowerCase());
          
          // Set a longer timeout for continuous listening (8 seconds)
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.log('Recognition already stopped');
              }
            }
          }, 8000);
        } else if (interimTranscript) {
          // Reset silence timer for interim results (user is still speaking)
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.log('Recognition already stopped');
              }
            }
          }, 8000);
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        onListeningChange(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (event.error !== 'no-speech') {
          onListeningChange(false);
        }
      };
    }
  };

  const startNativeListening = async () => {
    try {
      const result = await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 1,
        prompt: 'Di tu comando médico',
        partialResults: true,
        popup: false
      });

      // Handle final results from the promise
      if (result && result.matches && result.matches.length > 0) {
        const transcript = result.matches[0];
        if (transcript && transcript !== lastResultRef.current) {
          lastResultRef.current = transcript;
          onCommand(transcript.toLowerCase());
        }
      }

      // Listen for partial results while speaking
      SpeechRecognition.addListener('partialResults', (data) => {
        console.log('Partial results:', data.matches);
        // Handle interim results if needed
      });

      onListeningChange(true);
    } catch (error) {
      console.error('Failed to start native speech recognition:', error);
      onListeningChange(false);
    }
  };

  const stopNativeListening = async () => {
    try {
      await SpeechRecognition.stop();
      SpeechRecognition.removeAllListeners();
      onListeningChange(false);
    } catch (error) {
      console.error('Failed to stop native speech recognition:', error);
    }
  };

  // Auto-start/stop recognition based on isListening prop and isSpeaking state
  useEffect(() => {
    if (isSpeaking) return;

    if (isListening) {
      if (isNative) {
        startNativeListening();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.log('Recognition already active or failed to start');
        }
      }
    } else {
      if (isNative) {
        stopNativeListening();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Recognition already stopped or failed to stop');
        }
      }
    }
  }, [isListening, isSpeaking, isNative]);

  const startListening = () => {
    if (!isListening && !isSpeaking) {
      if (isNative) {
        startNativeListening();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          onListeningChange(true);
        } catch (error) {
          console.log('Failed to start recognition:', error);
        }
      }
    }
  };

  const stopListening = () => {
    if (isListening) {
      if (isNative) {
        stopNativeListening();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          onListeningChange(false);
        } catch (error) {
          console.log('Failed to stop recognition:', error);
        }
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (isNative) {
        SpeechRecognition.removeAllListeners();
      }
    };
  }, [isNative]);

  if (!isSupported) {
    return (
      <div className="text-center text-muted-foreground">
        <MicOff className="mx-auto mb-2 h-8 w-8" />
        <p>Reconocimiento de voz no soportado en este navegador</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        variant="voice"
        size="voice"
        onClick={isListening ? stopListening : startListening}
        className={cn(
          isListening && "animate-pulse shadow-voice"
        )}
      >
        {isListening ? (
          <Volume2 className="h-10 w-10" />
        ) : (
          <Mic className="h-10 w-10" />
        )}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {isListening 
          ? "Escuchando... Di tu comando médico" 
          : "Pulsa para activar el micrófono y hacer tu consulta"
        }
      </p>
    </div>
  );
};

export default VoiceButton;