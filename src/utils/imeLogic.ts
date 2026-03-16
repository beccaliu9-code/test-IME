
import { IMEScores, IMEResult } from '../types';

export function calculateIMEResult(scores: IMEScores): IMEResult {
  /**
   * 1. Negative Valence Areas (Glabella, Periocular, Commissure)
   * We calculate "Harmony Score" (0 = Worst, 1 = Best)
   * Harmony = 1 - Severity
   */
  const calculateAreaHarmony = (frs: number, fdhs: number, lineSeverity: number) => {
    // Severity is weighted sum of resting tension (FRS), dynamic hypertonicity (FDHS) and wrinkles (Scale)
    const severity = 0.6 * ((frs + fdhs) / 8) + 0.4 * (lineSeverity / 4);
    return 1 - severity;
  };

  const glabellaScore = calculateAreaHarmony(
    scores.glabella.frs,
    scores.glabella.fdhs,
    scores.glabella.glss
  );

  const periocularScore = calculateAreaHarmony(
    scores.periocular.frs,
    scores.periocular.fdhs,
    scores.periocular.cfss
  );

  const commissureScore = calculateAreaHarmony(
    scores.commissure.frs,
    scores.commissure.fdhs,
    scores.commissure.scale
  );

  /**
   * 2. Positive Valence Area (Frontalis)
   * FMS: 0-12mm (Higher is better mobility)
   * FLSS: 0-4 (Lower is better skin quality)
   * ESPS: 0-3 (Lower is better symmetry)
   */
  const fmsNorm = Math.min(scores.frontalis.fms, 12) / 12;
  const fdSkin = 1 - (scores.frontalis.flss / 4);
  const espsSymmetry = 1 - (scores.frontalis.esps / 3);
  
  // Frontalis Harmony: Balance of mobility, skin quality and symmetry
  const frontalisScore = 0.4 * fmsNorm + 0.3 * fdSkin + 0.3 * espsSymmetry;

  /**
   * 3. Global IME (Harmony Index)
   * Weights based on clinical impact on facial harmony:
   * - Glabella: 25%
   * - Periocular: 20%
   * - Commissure: 40% (High impact on emotional expression)
   * - Frontalis: 15%
   */
  const globalIME = 100 * (
    0.25 * glabellaScore +
    0.20 * periocularScore +
    0.40 * commissureScore +
    0.15 * frontalisScore
  );

  /**
   * 4. Interpretation Logic
   * 0-60: Imbalance (Negative valence dominant)
   * 60-80: Harmony Zone (Ideal clinical target)
   * 80-100: Optimized (High positive valence / Youthful balance)
   */
  let interpretation: IMEResult['interpretation'] = 'harmony';
  if (globalIME < 60) interpretation = 'imbalance';
  else if (globalIME > 80) interpretation = 'optimized';

  return {
    glabellaScore,
    periocularScore,
    commissureScore,
    frontalisScore,
    globalIME,
    interpretation
  };
}

export const INTERPRETATION_MAP = {
  imbalance: {
    label: '表情失衡 (Imbalance)',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: '负面表情肌张力过高或动态失调，建议进行针对性肉毒毒素干预以恢复平衡。'
  },
  harmony: {
    label: '和谐区 (Harmony Zone)',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '面部肌肉处于理想的平衡状态（60-80分），表情自然且负面信号较少。'
  },
  optimized: {
    label: '正向优化 (Optimized)',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '面部呈现极佳的年轻化平衡，正向情绪表达充分，几乎无负面表情干扰。'
  }
};
