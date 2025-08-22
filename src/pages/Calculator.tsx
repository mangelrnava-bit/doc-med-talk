import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, Heart, Info } from "lucide-react";
import VoiceButton from "@/components/VoiceButton";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { parseVoiceCommand } from "@/lib/voiceCommands";
import { CalculationResult } from "@/lib/medicalCalculators";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Calculator = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { speak, isSpeaking } = useSpeechSynthesis();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVoiceCommand = async (command: string) => {
    console.log("Comando recibido:", command);
    
    // Check if user is responding to "¿quieres ver el cálculo?"
    if (waitingForResponse) {
      setWaitingForResponse(false);
      if (command.toLowerCase().includes('sí') || command.toLowerCase().includes('si') || command.toLowerCase().includes('yes')) {
        setShowFormula(true);
        speak("Aquí tienes la fórmula y el cálculo detallado.");
      } else {
        setCurrentResult(null);
        setShowFormula(false);
        speak("De acuerdo, ¿en qué más puedo ayudarte?");
      }
      return;
    }

    try {
      const { result, error } = parseVoiceCommand(command);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        speak(error);
        return;
      }
      
      if (result) {
        setCurrentResult(result);
        setShowFormula(false);
        
        const response = `El resultado es ${result.result} ${result.unit}. ¿Quieres ver el cálculo y la fórmula?`;
        speak(response);
        setWaitingForResponse(true);
        
        // Keep listening for the response
        setTimeout(() => {
          if (!isListening) {
            setIsListening(true);
          }
        }, 3000); // Wait 3 seconds then start listening again
        
        toast({
          title: "Cálculo completado",
          description: `${result.result} ${result.unit}`,
        });
      }
    } catch (error) {
      const errorMessage = "Error en el cálculo. Por favor, verifica los valores ingresados.";
      toast({
        title: "Error de cálculo",
        description: errorMessage,
        variant: "destructive"
      });
      speak(errorMessage);
    }
  };

  const resetCalculation = () => {
    setCurrentResult(null);
    setShowFormula(false);
    setWaitingForResponse(false);
    speak("¿Qué cálculo médico necesitas realizar?");
  };

  const handleLogout = () => {
    navigate("/");
    toast({
      title: "Sesión cerrada",
      description: "Has salido de la aplicación",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">MediCalc Voice</h1>
              <p className="text-sm text-muted-foreground">Calculadora médica inteligente</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Voice Interface */}
        <Card className="shadow-medical">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-medical-blue" />
              Asistente Médico por Voz
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <VoiceButton
              onCommand={handleVoiceCommand}
              isListening={isListening}
              onListeningChange={setIsListening}
            />
            
            {waitingForResponse && (
              <div className="bg-muted rounded-lg p-4 text-center max-w-md">
                <p className="text-sm text-muted-foreground">
                  Esperando tu respuesta... Di "sí" o "no"
                </p>
              </div>
            )}
            
            {isSpeaking && (
              <div className="bg-accent/10 rounded-lg p-3 text-center">
                <p className="text-sm text-accent-foreground">🔊 Reproduciendo respuesta...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Display */}
        {currentResult && (
          <Card className="shadow-medical">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-medical-green" />
                Resultado del Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-medical text-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {currentResult.result} {currentResult.unit}
                </div>
                {currentResult.interpretation && (
                  <div className="text-sm mt-2 opacity-90">
                    {currentResult.interpretation}
                  </div>
                )}
              </div>
              
              {showFormula && (
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Fórmula:</h4>
                    <code className="text-sm bg-background p-2 rounded block">
                      {currentResult.formula}
                    </code>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Cálculo:</h4>
                    <p className="text-sm">{currentResult.explanation}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setShowFormula(!showFormula)}
                  variant="outline"
                >
                  {showFormula ? "Ocultar" : "Ver"} Fórmula
                </Button>
                <Button
                  onClick={resetCalculation}
                  variant="medical"
                >
                  Nuevo Cálculo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Calculations */}
        <Card className="shadow-medical">
          <CardHeader>
            <CardTitle>Cálculos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-medical-blue">Antropometría:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Peso ideal</li>
                  <li>• Peso predicho</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-medical-blue">Gases Arteriales:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Fórmula de Winter</li>
                  <li>• CO2 en alcalosis metabólica</li>
                  <li>• Ajuste de frecuencia respiratoria</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-medical-blue">Función Renal:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• TFG CKD-EPI</li>
                  <li>• Osmolaridad efectiva</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-medical-blue">Ejemplos de uso:</h4>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• "Peso ideal hombre 1.74 metros"</li>
                  <li>• "Winter bicarbonato 15"</li>
                  <li>• "TFG creatinina 1.2 edad 65 mujer"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculator;