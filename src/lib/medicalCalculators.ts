// Medical calculators in Spanish

export interface CalculationResult {
  result: number;
  unit: string;
  formula: string;
  explanation: string;
  interpretation?: string;
}

// Peso ideal (Fórmula de Robinson)
export const calculateIdealWeight = (height: number, gender: 'hombre' | 'mujer'): CalculationResult => {
  const heightInCm = height * 100; // Convert meters to cm
  let idealWeight: number;
  
  if (gender === 'hombre') {
    idealWeight = 52 + 1.9 * ((heightInCm - 152.4) / 2.54);
  } else {
    idealWeight = 49 + 1.7 * ((heightInCm - 152.4) / 2.54);
  }
  
  return {
    result: Math.round(idealWeight * 10) / 10,
    unit: 'kg',
    formula: gender === 'hombre' 
      ? 'Peso ideal (hombre) = 52 + 1.9 × ((altura en cm - 152.4) / 2.54)'
      : 'Peso ideal (mujer) = 49 + 1.7 × ((altura en cm - 152.4) / 2.54)',
    explanation: `Para ${gender} de ${height}m: ${idealWeight.toFixed(1)} kg`,
    interpretation: 'Fórmula de Robinson para peso corporal ideal'
  };
};

// Peso predicho (IBW - Ideal Body Weight)
export const calculatePredictedWeight = (height: number, gender: 'hombre' | 'mujer'): CalculationResult => {
  return calculateIdealWeight(height, gender);
};

// Fórmula de Winter para CO2 esperado en acidosis metabólica
export const calculateWinterFormula = (bicarbonate: number): CalculationResult => {
  const expectedCO2 = 1.5 * bicarbonate + 8;
  const lowerLimit = expectedCO2 - 2;
  const upperLimit = expectedCO2 + 2;
  
  return {
    result: Math.round(expectedCO2 * 10) / 10,
    unit: 'mmHg',
    formula: 'CO2 esperado = 1.5 × HCO3- + 8 (±2)',
    explanation: `Para HCO3- de ${bicarbonate} mEq/L: CO2 esperado ${expectedCO2.toFixed(1)} mmHg (rango: ${lowerLimit.toFixed(1)}-${upperLimit.toFixed(1)})`,
    interpretation: 'Compensación respiratoria esperada en acidosis metabólica'
  };
};

// CO2 esperado para alcalosis metabólica
export const calculateMetabolicAlkalosisCompensation = (bicarbonate: number): CalculationResult => {
  const expectedCO2 = 0.7 * bicarbonate + 21;
  const lowerLimit = expectedCO2 - 1.5;
  const upperLimit = expectedCO2 + 1.5;
  
  return {
    result: Math.round(expectedCO2 * 10) / 10,
    unit: 'mmHg',
    formula: 'CO2 esperado = 0.7 × HCO3- + 21 (±1.5)',
    explanation: `Para HCO3- de ${bicarbonate} mEq/L: CO2 esperado ${expectedCO2.toFixed(1)} mmHg (rango: ${lowerLimit.toFixed(1)}-${upperLimit.toFixed(1)})`,
    interpretation: 'Compensación respiratoria esperada en alcalosis metabólica'
  };
};

// Osmolaridad efectiva
export const calculateEffectiveOsmolarity = (sodium: number, glucose: number): CalculationResult => {
  const osmolarity = 2 * sodium + (glucose / 18);
  
  return {
    result: Math.round(osmolarity * 10) / 10,
    unit: 'mOsm/kg',
    formula: 'Osmolaridad efectiva = 2 × Na+ + (Glucosa / 18)',
    explanation: `Para Na+ ${sodium} mEq/L y glucosa ${glucose} mg/dL: ${osmolarity.toFixed(1)} mOsm/kg`,
    interpretation: osmolarity < 280 ? 'Hipoosmolar' : osmolarity > 295 ? 'Hiperosmolar' : 'Normal'
  };
};

// Ajuste de frecuencia respiratoria para CO2 esperado
export const calculateRespiratoryRate = (currentCO2: number, targetCO2: number, currentRR: number): CalculationResult => {
  const ratio = currentCO2 / targetCO2;
  const newRR = currentRR * ratio;
  
  return {
    result: Math.round(newRR),
    unit: 'rpm',
    formula: 'FR nueva = FR actual × (CO2 actual / CO2 objetivo)',
    explanation: `Para cambiar CO2 de ${currentCO2} a ${targetCO2} mmHg con FR actual ${currentRR} rpm: nueva FR ${Math.round(newRR)} rpm`,
    interpretation: 'Ajuste de frecuencia respiratoria para alcanzar CO2 objetivo'
  };
};

// Tasa de filtrado glomerular CKD-EPI
export const calculateGFRCKDEPI = (creatinine: number, age: number, gender: 'hombre' | 'mujer', race: 'afroamericano' | 'otro' = 'otro'): CalculationResult => {
  const isFemale = gender === 'mujer';
  const isBlack = race === 'afroamericano';
  
  let gfr: number;
  
  if (isFemale) {
    if (creatinine <= 0.7) {
      gfr = 144 * Math.pow(creatinine / 0.7, -0.329) * Math.pow(0.993, age);
    } else {
      gfr = 144 * Math.pow(creatinine / 0.7, -1.209) * Math.pow(0.993, age);
    }
  } else {
    if (creatinine <= 0.9) {
      gfr = 141 * Math.pow(creatinine / 0.9, -0.411) * Math.pow(0.993, age);
    } else {
      gfr = 141 * Math.pow(creatinine / 0.9, -1.209) * Math.pow(0.993, age);
    }
  }
  
  if (isBlack) {
    gfr *= 1.159;
  }
  
  return {
    result: Math.round(gfr),
    unit: 'mL/min/1.73m²',
    formula: 'CKD-EPI: GFR = 141 × min(Scr/κ,1)^α × max(Scr/κ,1)^-1.209 × 0.993^edad × [1.018 si mujer] × [1.159 si afroamericano]',
    explanation: `Para creatinina ${creatinine} mg/dL, ${gender}, ${age} años: TFG ${Math.round(gfr)} mL/min/1.73m²`,
    interpretation: gfr >= 90 ? 'Normal' : gfr >= 60 ? 'Leve disminución' : gfr >= 30 ? 'Moderada disminución' : 'Severa disminución'
  };
};