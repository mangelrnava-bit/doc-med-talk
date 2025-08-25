import { 
  calculateIdealWeight,
  calculatePredictedWeight,
  calculateWinterFormula,
  calculateMetabolicAlkalosisCompensation,
  calculateEffectiveOsmolarity,
  calculateRespiratoryRate,
  calculateGFRCKDEPI,
  calculateAnionGap,
  CalculationResult
} from './medicalCalculators';

interface VoiceCommandResult {
  result: CalculationResult | null;
  error?: string;
  needsMoreInfo?: {
    calculationType: string;
    missingParams: string[];
    collectedParams: Record<string, any>;
    prompt: string;
  };
}

interface PartialCommand {
  type: string;
  params: Record<string, any>;
  requiredParams: string[];
}

export function parseVoiceCommand(command: string, previousContext?: PartialCommand): VoiceCommandResult {
  try {
    const cmd = command.toLowerCase().trim();
    
    // Si tenemos contexto previo, intentar completar el comando
    if (previousContext) {
      return completePartialCommand(cmd, previousContext);
    }
    
    // Detectar tipo de cálculo y extraer parámetros
    const detectedCommand = detectCalculationType(cmd);
    if (!detectedCommand) {
      return { 
        result: null, 
        error: 'No reconocí el comando. Puedo calcular: peso ideal, peso predicho, fórmula de Winter, CO2 para alcalosis metabólica, osmolaridad efectiva, frecuencia respiratoria, filtrado glomerular CKD-EPI, y brecha anionica.' 
      };
    }
    
    // Verificar si tenemos todos los parámetros necesarios
    const missingParams = detectedCommand.requiredParams.filter(param => !(param in detectedCommand.params));
    
    if (missingParams.length > 0) {
      return {
        result: null,
        needsMoreInfo: {
          calculationType: detectedCommand.type,
          missingParams,
          collectedParams: detectedCommand.params,
          prompt: generatePromptForMissingParams(detectedCommand.type, missingParams)
        }
      };
    }
    
    // Ejecutar el cálculo si tenemos todos los parámetros
    return executeCalculation(detectedCommand);
    
  } catch (error) {
    console.error('Error parsing voice command:', error);
    return { 
      result: null, 
      error: 'Error procesando el comando. Por favor, inténtalo de nuevo.' 
    };
  }
}

function detectCalculationType(cmd: string): PartialCommand | null {
  const numbers = cmd.match(/\d+(?:[.,]\d+)?/g);
  const numericValues = numbers ? numbers.map(n => parseFloat(n.replace(',', '.'))) : [];
  
  // Peso ideal
  if (cmd.includes('peso ideal')) {
    const params: Record<string, any> = {};
    
    if (numericValues.length > 0) {
      params.height = numericValues[0];
    }
    
    const gender = extractGender(cmd);
    if (gender) {
      params.gender = gender;
    }
    
    return {
      type: 'pesoIdeal',
      params,
      requiredParams: ['height', 'gender']
    };
  }
  
  // Peso predicho
  if (cmd.includes('peso predicho')) {
    const params: Record<string, any> = {};
    
    if (numericValues.length > 0) {
      params.height = numericValues[0];
    }
    
    const gender = extractGender(cmd);
    if (gender) {
      params.gender = gender;
    }
    
    return {
      type: 'pesoPredicho',
      params,
      requiredParams: ['height', 'gender']
    };
  }
  
  // Winter
  if (cmd.includes('winter') || cmd.includes('acidosis metabólica')) {
    const params: Record<string, any> = {};
    if (numericValues.length > 0) {
      params.bicarbonate = numericValues[0];
    }
    
    return {
      type: 'winter',
      params,
      requiredParams: ['bicarbonate']
    };
  }
  
  // CO2 alcalosis metabólica
  if (cmd.includes('alcalosis metabólica') || cmd.includes('co2 esperado alcalosis')) {
    const params: Record<string, any> = {};
    if (numericValues.length > 0) {
      params.bicarbonate = numericValues[0];
    }
    
    return {
      type: 'co2Alcalosis',
      params,
      requiredParams: ['bicarbonate']
    };
  }
  
  // Osmolaridad efectiva
  if (cmd.includes('osmolaridad')) {
    const params: Record<string, any> = {};
    let paramIndex = 0;
    
    if (numericValues.length > paramIndex) {
      params.sodium = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.glucose = numericValues[paramIndex++];
    }
    
    return {
      type: 'osmolaridad',
      params,
      requiredParams: ['sodium', 'glucose']
    };
  }
  
  // Frecuencia respiratoria
  if (cmd.includes('frecuencia respiratoria') || cmd.includes('ajustar frecuencia')) {
    const params: Record<string, any> = {};
    let paramIndex = 0;
    
    if (numericValues.length > paramIndex) {
      params.currentCO2 = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.targetCO2 = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.currentFrequency = numericValues[paramIndex++];
    }
    
    return {
      type: 'frecuenciaRespiratoria',
      params,
      requiredParams: ['currentCO2', 'targetCO2', 'currentFrequency']
    };
  }
  
  // TFG CKD-EPI
  if (cmd.includes('filtrado glomerular') || cmd.includes('tfg') || cmd.includes('ckd')) {
    const params: Record<string, any> = {};
    let paramIndex = 0;
    
    if (numericValues.length > paramIndex) {
      params.creatinine = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.age = numericValues[paramIndex++];
    }
    
    const gender = extractGender(cmd);
    if (gender) {
      params.gender = gender;
    }
    
    return {
      type: 'tfg',
      params,
      requiredParams: ['creatinine', 'age', 'gender']
    };
  }
  
  // Brecha aniónica
  if (cmd.includes('brecha anionica') || cmd.includes('anion gap')) {
    const params: Record<string, any> = {};
    let paramIndex = 0;
    
    if (numericValues.length > paramIndex) {
      params.sodium = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.chloride = numericValues[paramIndex++];
    }
    if (numericValues.length > paramIndex) {
      params.bicarbonate = numericValues[paramIndex++];
    }
    
    return {
      type: 'brechaAnionica',
      params,
      requiredParams: ['sodium', 'chloride', 'bicarbonate']
    };
  }
  
  return null;
}

function completePartialCommand(cmd: string, context: PartialCommand): VoiceCommandResult {
  const numbers = cmd.match(/\d+(?:[.,]\d+)?/g);
  const numericValues = numbers ? numbers.map(n => parseFloat(n.replace(',', '.'))) : [];
  
  // Agregar los nuevos valores a los parámetros existentes
  const updatedParams = { ...context.params };
  const remainingParams = context.requiredParams.filter(param => !(param in updatedParams));
  
  // Intentar extraer género si es necesario
  if (remainingParams.includes('gender')) {
    const gender = extractGender(cmd);
    if (gender) {
      updatedParams.gender = gender;
    }
  }
  
  // Agregar valores numéricos a los parámetros faltantes
  const numericParams = remainingParams.filter(param => param !== 'gender');
  for (let i = 0; i < Math.min(numericValues.length, numericParams.length); i++) {
    updatedParams[numericParams[i]] = numericValues[i];
  }
  
  // Verificar si aún faltan parámetros
  const stillMissingParams = context.requiredParams.filter(param => !(param in updatedParams));
  
  if (stillMissingParams.length > 0) {
    return {
      result: null,
      needsMoreInfo: {
        calculationType: context.type,
        missingParams: stillMissingParams,
        collectedParams: updatedParams,
        prompt: generatePromptForMissingParams(context.type, stillMissingParams)
      }
    };
  }
  
  // Ejecutar el cálculo si tenemos todos los parámetros
  return executeCalculation({
    type: context.type,
    params: updatedParams,
    requiredParams: context.requiredParams
  });
}

function executeCalculation(command: PartialCommand): VoiceCommandResult {
  const { type, params } = command;
  
  try {
    switch (type) {
      case 'pesoIdeal':
        return { result: calculateIdealWeight(params.height, params.gender) };
        
      case 'pesoPredicho':
        return { result: calculatePredictedWeight(params.height, params.gender) };
        
      case 'winter':
        return { result: calculateWinterFormula(params.bicarbonate) };
        
      case 'co2Alcalosis':
        return { result: calculateMetabolicAlkalosisCompensation(params.bicarbonate) };
        
      case 'osmolaridad':
        return { result: calculateEffectiveOsmolarity(params.sodium, params.glucose) };
        
      case 'frecuenciaRespiratoria':
        return { result: calculateRespiratoryRate(params.currentCO2, params.targetCO2, params.currentFrequency) };
        
      case 'tfg':
        return { result: calculateGFRCKDEPI(params.creatinine, params.age, params.gender) };
        
      case 'brechaAnionica':
        return { result: calculateAnionGap(params.sodium, params.chloride, params.bicarbonate) };
        
      default:
        return { result: null, error: 'Tipo de cálculo no reconocido.' };
    }
  } catch (error) {
    return { result: null, error: 'Error ejecutando el cálculo.' };
  }
}

function generatePromptForMissingParams(calculationType: string, missingParams: string[]): string {
  const paramNames: Record<string, string> = {
    height: 'la altura en metros',
    gender: 'el género: hombre o mujer',
    bicarbonate: 'el valor de bicarbonato',
    sodium: 'el valor de sodio',
    glucose: 'el valor de glucosa',
    chloride: 'el valor de cloro',
    creatinine: 'el valor de creatinina',
    age: 'la edad en años',
    currentCO2: 'el CO2 actual',
    targetCO2: 'el CO2 objetivo',
    currentFrequency: 'la frecuencia respiratoria actual'
  };
  
  if (missingParams.length === 1) {
    const nextParam = missingParams[0];
    const paramName = paramNames[nextParam] || nextParam;
    return `Por favor, dime ${paramName}.`;
  } else {
    const paramList = missingParams.map(param => paramNames[param] || param).join(', ');
    return `Necesito los siguientes valores: ${paramList}. Dime el primero.`;
  }
}

// Extract gender from text
function extractGender(text: string): 'hombre' | 'mujer' | null {
  if (text.includes('hombre') || text.includes('masculino') || text.includes('varón')) {
    return 'hombre';
  }
  if (text.includes('mujer') || text.includes('femenino') || text.includes('fémina')) {
    return 'mujer';
  }
  return null;
}