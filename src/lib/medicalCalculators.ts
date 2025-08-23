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
  // Convertir a metros si está en centímetros
  let heightInM = height > 3 ? height / 100 : height;
  
  // Validación de altura realista
  if (heightInM < 1.0 || heightInM > 2.5) {
    throw new Error('La altura debe estar entre 1.0 y 2.5 metros');
  }
  
  const heightInCm = heightInM * 100;
  let idealWeight: number;
  
  if (gender === 'hombre') {
    idealWeight = 52 + 1.9 * ((heightInCm - 152.4) / 2.54);
  } else {
    idealWeight = 49 + 1.7 * ((heightInCm - 152.4) / 2.54);
  }
  
  // Validación de peso realista
  if (idealWeight > 150) {
    throw new Error('Resultado poco realista. Verifica la altura ingresada.');
  }
  
  return {
    result: Math.round(idealWeight * 10) / 10,
    unit: 'kg',
    formula: gender === 'hombre' 
      ? 'Peso ideal (hombre) = 52 + 1.9 × ((altura en cm - 152.4) / 2.54)'
      : 'Peso ideal (mujer) = 49 + 1.7 × ((altura en cm - 152.4) / 2.54)',
    explanation: `Para ${gender} de ${heightInM}m: ${idealWeight.toFixed(1)} kg`,
    interpretation: 'Fórmula de Robinson para peso corporal ideal'
  };
};

// Peso predicho (PBW - Predicted Body Weight)
export const calculatePredictedWeight = (height: number, gender: 'hombre' | 'mujer'): CalculationResult => {
  // Convertir a centímetros si está en metros
  let heightInCm = height > 3 ? height : height * 100;
  
  // Validación de altura realista
  if (heightInCm < 100 || heightInCm > 250) {
    throw new Error('La altura debe estar entre 100 y 250 centímetros');
  }
  
  let predictedWeight: number;
  
  if (gender === 'hombre') {
    predictedWeight = 50 + 2.3 * ((heightInCm - 152.4) / 2.54);
  } else {
    predictedWeight = 45.5 + 2.3 * ((heightInCm - 152.4) / 2.54);
  }
  
  // Validación de peso realista
  if (predictedWeight > 150) {
    throw new Error('Resultado poco realista. Verifica la altura ingresada.');
  }
  
  return {
    result: Math.round(predictedWeight * 10) / 10,
    unit: 'kg',
    formula: gender === 'hombre' 
      ? 'Peso predicho (hombre) = 50 + 2.3 × ((altura en cm - 152.4) / 2.54)'
      : 'Peso predicho (mujer) = 45.5 + 2.3 × ((altura en cm - 152.4) / 2.54)',
    explanation: `Para ${gender} de ${heightInCm}cm: ${predictedWeight.toFixed(1)} kg`,
    interpretation: 'Peso corporal predicho para ventilación mecánica'
  };
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

// Anion Gap calculation
export const calculateAnionGap = (sodium: number, chloride: number, bicarbonate: number): CalculationResult => {
  if (sodium < 120 || sodium > 160) {
    throw new Error('El sodio debe estar entre 120 y 160 mEq/L');
  }
  
  if (chloride < 80 || chloride > 120) {
    throw new Error('El cloro debe estar entre 80 y 120 mEq/L');
  }
  
  if (bicarbonate < 5 || bicarbonate > 35) {
    throw new Error('El bicarbonato debe estar entre 5 y 35 mEq/L');
  }
  
  const anionGap = sodium - (chloride + bicarbonate);
  
  let interpretation = '';
  if (anionGap < 8) {
    interpretation = 'Anion gap bajo';
  } else if (anionGap >= 8 && anionGap <= 12) {
    interpretation = 'Anion gap normal';
  } else {
    interpretation = 'Anion gap elevado';
  }
  
  return {
    result: Math.round(anionGap * 10) / 10,
    unit: 'mEq/L',
    formula: 'Anion Gap = Na⁺ - (Cl⁻ + HCO₃⁻)',
    explanation: `Anion Gap = ${sodium} - (${chloride} + ${bicarbonate}) = ${anionGap.toFixed(1)} mEq/L`,
    interpretation
  };
};