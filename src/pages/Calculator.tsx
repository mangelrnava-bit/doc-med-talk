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

interface PartialCommand {
  type: string;
  params: Record<string, any>;
  requiredParams: string[];
}

const Calculator = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [partialCommand, setPartialCommand] = useState<PartialCommand | null>(null);
  const [collectingInfo, setCollectingInfo] = useState(false);
  const [waitingForTidalVolumeResponse, setWaitingForTidalVolumeResponse] = useState(false);
  const [waitingForTidalVolumeFactor, setWaitingForTidalVolumeFactor] = useState(false);
  const [tidalVolumeResult, setTidalVolumeResult] = useState<number | null>(null);
  const { speak, isSpeaking } = useSpeechSynthesis();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVoiceCommand = async (command: string) => {
    console.log("Comando recibido:", command);
    
    // Check if user is responding to tidal volume question
    if (waitingForTidalVolumeResponse) {
      setWaitingForTidalVolumeResponse(false);
      if (command.toLowerCase().includes('sí') || command.toLowerCase().includes('si') || command.toLowerCase().includes('yes')) {
        setWaitingForTidalVolumeFactor(true);
        speak("Dime el factor multiplicador entre 4 y 10 mililitros por kilogramo.", {
          onEnd: () => {
            setIsListening(true);
          }
        });
      } else {
        setWaitingForResponse(true);
        speak("¿Quieres que te muestre la fórmula y el resultado?", {
          onEnd: () => {
            setIsListening(true);
          }
        });
      }
      return;
    }

    // Check if user is providing tidal volume factor
    if (waitingForTidalVolumeFactor) {
      setWaitingForTidalVolumeFactor(false);
      const factor = parseFloat(command.replace(/[^\d.,]/g, '').replace(',', '.'));
      
      if (isNaN(factor) || factor < 4 || factor > 10) {
        speak("Lo siento, solo estoy programada para calcular el Volumen Corriente con valores entre 4 y 10 mililitros por peso.", {
          onEnd: () => {
            setWaitingForTidalVolumeResponse(true);
            setIsListening(true);
          }
        });
        return;
      }
      
      if (currentResult) {
        const tidalVolume = Math.round(currentResult.result * factor);
        setTidalVolumeResult(tidalVolume);
        speak(`El Volumen Tidal sería ${tidalVolume} mililitros. ¿Quieres que te muestre la fórmula y el resultado?`, {
          onEnd: () => {
            setWaitingForResponse(true);
            setIsListening(true);
          }
        });
      }
      return;
    }
    
    // Check if user is responding to "¿quieres ver el cálculo?"
    if (waitingForResponse) {
      setWaitingForResponse(false);
      if (command.toLowerCase().includes('sí') || command.toLowerCase().includes('si') || command.toLowerCase().includes('yes')) {
        setShowFormula(true);
        speak("Aquí tienes la fórmula y el cálculo detallado.");
      } else {
        setCurrentResult(null);
        setShowFormula(false);
        setTidalVolumeResult(null);
        speak("De acuerdo, ¿en qué más puedo ayudarte?");
      }
      return;
    }

    try {
      const { result, error, needsMoreInfo } = parseVoiceCommand(command, partialCommand || undefined);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        speak(error);
        setPartialCommand(null);
        setCollectingInfo(false);
        return;
      }
      
      if (needsMoreInfo) {
        // Guardar el estado del comando parcial
        setPartialCommand({
          type: needsMoreInfo.calculationType,
          params: needsMoreInfo.collectedParams,
          requiredParams: needsMoreInfo.missingParams
        });
        setCollectingInfo(true);
        
        // Hablar el prompt y continuar escuchando
        speak(needsMoreInfo.prompt, {
          onEnd: () => {
            setIsListening(true);
          }
        });
        
        toast({
          title: "Información adicional",
          description: needsMoreInfo.prompt,
        });
        return;
      }
      
      if (result) {
        setCurrentResult(result);
        setShowFormula(false);
        setPartialCommand(null);
        setCollectingInfo(false);
        
        // Check if this is a weight calculation for tidal volume suggestion
        const calculationType = partialCommand?.type || (result.formula.includes('Peso ideal') ? 'pesoIdeal' : result.formula.includes('Peso predicho') ? 'pesoPredicho' : '');
        const isWeightCalculation = calculationType === 'pesoIdeal' || calculationType === 'pesoPredicho';
        
        // Improve pronunciation of units
        let unitPronunciation = result.unit;
        if (result.unit === 'mmHg') {
          unitPronunciation = 'milímetros de mercurio';
        } else if (result.unit === 'kg') {
          unitPronunciation = 'kilogramos';
        }
        
        let response = `El resultado es ${result.result} ${unitPronunciation}`;
        
        // Add tidal volume suggestion for weight calculations
        if (isWeightCalculation) {
          const tidalVolume = Math.round(result.result * 6);
          response += `. Si lo multiplicas por 6 mililitros tendrías un Volumen Tidal de ${tidalVolume} mililitros. ¿Quieres que calcule el Volumen Tidal usando otro factor multiplicador?`;
          
          speak(response, { 
            onEnd: () => {
              setWaitingForTidalVolumeResponse(true);
              setIsListening(true);
            }
          });
        } else {
          response += '. ¿Quieres ver el cálculo y la fórmula?';
          speak(response, { 
            onEnd: () => {
              setWaitingForResponse(true);
              setIsListening(true);
            }
          });
        }
        
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
      setPartialCommand(null);
      setCollectingInfo(false);
    }
  };

  const resetCalculation = () => {
    setCurrentResult(null);
    setShowFormula(false);
    setWaitingForResponse(false);
    setPartialCommand(null);
    setCollectingInfo(false);
    setWaitingForTidalVolumeResponse(false);
    setWaitingForTidalVolumeFactor(false);
    setTidalVolumeResult(null);
    speak("¿Qué cálculo médico necesitas realizar?");
  };

  const getCalculationDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      pesoIdeal: 'Peso Ideal',
      pesoPredicho: 'Peso Predicho',
      winter: 'Fórmula de Winter',
      co2Alcalosis: 'CO2 en Alcalosis Metabólica',
      osmolaridad: 'Osmolaridad Efectiva',
      frecuenciaRespiratoria: 'Frecuencia Respiratoria',
      tfg: 'Filtrado Glomerular (TFG)',
      brechaAnionica: 'Brecha Aniónica'
    };
    return names[type] || type;
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
              isSpeaking={isSpeaking}
            />
            
            {(waitingForResponse || waitingForTidalVolumeResponse) && (
              <div className="bg-muted rounded-lg p-4 text-center max-w-md">
                <p className="text-sm text-muted-foreground">
                  Esperando tu respuesta... Di "sí" o "no"
                </p>
              </div>
            )}
            
            {waitingForTidalVolumeFactor && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center max-w-md">
                <p className="text-sm text-blue-600 font-medium">
                  Esperando factor multiplicador (4-10 mL/kg)
                </p>
              </div>
            )}
            
            {collectingInfo && partialCommand && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center max-w-md">
                <p className="text-sm text-blue-600 font-medium mb-2">
                  Recolectando información para: {getCalculationDisplayName(partialCommand.type)}
                </p>
                <p className="text-xs text-blue-500">
                  Esperando valores... Tómate tu tiempo para dictar cada valor.
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
                {tidalVolumeResult && (
                  <div className="text-lg mt-2 opacity-90">
                    Volumen Tidal: {tidalVolumeResult} mL
                  </div>
                )}
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
                <h4 className="font-semibold text-medical-blue">Electrolitos:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Brecha aniónica</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-medical-blue">Ejemplos de uso:</h4>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• "Peso ideal hombre 1.74 metros"</li>
                  <li>• "Winter bicarbonato 15"</li>
                  <li>• "TFG creatinina 1.2 edad 65 mujer"</li>
                  <li>• "Brecha anionica sodio 140 cloro 100 bicarbonato 24"</li>
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