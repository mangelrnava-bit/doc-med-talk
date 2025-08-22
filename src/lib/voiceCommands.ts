import { 
  calculateIdealWeight,
  calculatePredictedWeight,
  calculateWinterFormula,
  calculateMetabolicAlkalosisCompensation,
  calculateEffectiveOsmolarity,
  calculateRespiratoryRate,
  calculateGFRCKDEPI,
  CalculationResult
} from './medicalCalculators';

export interface ParsedCommand {
  type: string;
  parameters: any;
  success: boolean;
  error?: string;
}

// Extract numbers from text
const extractNumber = (text: string): number | null => {
  const match = text.match(/\d+(?:[.,]\d+)?/);
  if (match) {
    return parseFloat(match[0].replace(',', '.'));
  }
  return null;
};

// Extract gender from text
const extractGender = (text: string): 'hombre' | 'mujer' | null => {
  if (text.includes('hombre') || text.includes('masculino') || text.includes('varón')) {
    return 'hombre';
  }
  if (text.includes('mujer') || text.includes('femenino') || text.includes('fémina')) {
    return 'mujer';
  }
  return null;
};

// Parse voice commands and execute calculations
export const parseVoiceCommand = (command: string): { result: CalculationResult | null; error?: string } => {
  const cmd = command.toLowerCase().trim();
  
  try {
    // Peso ideal
    if (cmd.includes('peso ideal')) {
      const height = extractNumber(cmd);
      const gender = extractGender(cmd);
      
      if (!height) {
        return { result: null, error: 'No pude entender la altura. Por favor, especifica la altura.' };
      }
      
      if (!gender) {
        return { result: null, error: 'No pude determinar el género. Especifica hombre o mujer.' };
      }
      
      return { result: calculateIdealWeight(height, gender) };
    }
    
    // Peso predicho
    if (cmd.includes('peso predicho')) {
      const height = extractNumber(cmd);
      const gender = extractGender(cmd);
      
      if (!height || !gender) {
        return { result: null, error: 'Necesito la altura y el género (hombre o mujer).' };
      }
      
      return { result: calculatePredictedWeight(height, gender) };
    }
    
    // Fórmula de Winter
    if (cmd.includes('winter') || cmd.includes('acidosis metabólica')) {
      const bicarbonate = extractNumber(cmd);
      
      if (!bicarbonate) {
        return { result: null, error: 'Necesito el valor de bicarbonato en mEq/L.' };
      }
      
      return { result: calculateWinterFormula(bicarbonate) };
    }
    
    // CO2 para alcalosis metabólica
    if (cmd.includes('alcalosis metabólica') || cmd.includes('co2 esperado alcalosis')) {
      const bicarbonate = extractNumber(cmd);
      
      if (!bicarbonate) {
        return { result: null, error: 'Necesito el valor de bicarbonato en mEq/L.' };
      }
      
      return { result: calculateMetabolicAlkalosisCompensation(bicarbonate) };
    }
    
    // Osmolaridad efectiva
    if (cmd.includes('osmolaridad')) {
      const numbers = cmd.match(/\d+(?:[.,]\d+)?/g);
      
      if (!numbers || numbers.length < 2) {
        return { result: null, error: 'Necesito los valores de sodio y glucosa. Ejemplo: "osmolaridad sodio 140 glucosa 100".' };
      }
      
      const sodium = parseFloat(numbers[0].replace(',', '.'));
      const glucose = parseFloat(numbers[1].replace(',', '.'));
      
      return { result: calculateEffectiveOsmolarity(sodium, glucose) };
    }
    
    // Frecuencia respiratoria
    if (cmd.includes('frecuencia respiratoria') || cmd.includes('ajustar frecuencia')) {
      const numbers = cmd.match(/\d+(?:[.,]\d+)?/g);
      
      if (!numbers || numbers.length < 3) {
        return { result: null, error: 'Necesito CO2 actual, CO2 objetivo y frecuencia respiratoria actual.' };
      }
      
      const currentCO2 = parseFloat(numbers[0].replace(',', '.'));
      const targetCO2 = parseFloat(numbers[1].replace(',', '.'));
      const currentRR = parseFloat(numbers[2].replace(',', '.'));
      
      return { result: calculateRespiratoryRate(currentCO2, targetCO2, currentRR) };
    }
    
    // TFG CKD-EPI
    if (cmd.includes('filtrado glomerular') || cmd.includes('tfg') || cmd.includes('ckd')) {
      const numbers = cmd.match(/\d+(?:[.,]\d+)?/g);
      const gender = extractGender(cmd);
      
      if (!numbers || numbers.length < 2 || !gender) {
        return { result: null, error: 'Necesito creatinina, edad y género. Ejemplo: "TFG creatinina 1.2 edad 65 mujer".' };
      }
      
      const creatinine = parseFloat(numbers[0].replace(',', '.'));
      const age = parseInt(numbers[1]);
      
      return { result: calculateGFRCKDEPI(creatinine, age, gender) };
    }
    
    return { 
      result: null, 
      error: 'No reconocí el comando. Puedo calcular: peso ideal, peso predicho, fórmula de Winter, CO2 para alcalosis metabólica, osmolaridad efectiva, frecuencia respiratoria, y filtrado glomerular CKD-EPI.' 
    };
    
  } catch (error) {
    return { 
      result: null, 
      error: 'Error al procesar el comando. Inténtalo de nuevo.' 
    };
  }
};