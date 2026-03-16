
export type ScaleValue = 0 | 1 | 2 | 3 | 4;
export type ESPSValue = 0 | 1 | 2 | 3;

export interface IMEScores {
  glabella: {
    frs: ScaleValue;
    fdhs: ScaleValue;
    glss: ScaleValue;
  };
  periocular: {
    frs: ScaleValue;
    fdhs: ScaleValue;
    cfss: ScaleValue;
  };
  commissure: {
    frs: ScaleValue;
    fdhs: ScaleValue;
    scale: ScaleValue;
  };
  frontalis: {
    fms: number; // 0-12mm
    flss: ScaleValue;
    esps: ESPSValue;
  };
}

export interface IMEResult {
  glabellaScore: number;
  periocularScore: number;
  commissureScore: number;
  frontalisScore: number;
  globalIME: number;
  interpretation: 'imbalance' | 'harmony' | 'optimized';
}

export interface FollowUpRecord {
  id: string;
  date: string;
  note: string;
  scores?: IMEScores;
}

export interface TreatmentPlan {
  diagnosis: string;
  recommendations: string[];
  dosage?: string;
  followUpDate?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  date: string;
  scores: IMEScores;
  result: IMEResult;
  plan?: TreatmentPlan;
  followUps: FollowUpRecord[];
}
