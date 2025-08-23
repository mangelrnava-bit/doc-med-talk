import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  isSpeaking?: boolean;
}

const VoiceButton = ({ onCommand, isListening, onListeningChange, isSpeaking = false }: VoiceButtonProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        onCommand(transcript);
      };

      recognition.onend = () => {
        onListeningChange(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
      };
    }
  }, [onCommand, onListeningChange]);

  // Auto-start/stop recognition based on isListening prop and isSpeaking state
  useEffect(() => {
    if (!recognitionRef.current || isSpeaking) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Recognition already active or failed to start');
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped or failed to stop');
      }
    }
  }, [isListening, isSpeaking]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
        onListeningChange(true);
      } catch (error) {
        console.log('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        onListeningChange(false);
      } catch (error) {
        console.log('Failed to stop recognition:', error);
      }
    }
  };

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