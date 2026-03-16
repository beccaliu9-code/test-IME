/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Camera, 
  ClipboardCheck, 
  LayoutDashboard, 
  History,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { IMEScores, PatientRecord, TreatmentPlan, FollowUpRecord } from './types';
import { calculateIMEResult, INTERPRETATION_MAP } from './utils/imeLogic';

// --- Components ---
import ScanStep from './components/ScanStep';
import ScoreStep from './components/ScoreStep';
import ResultStep from './components/ResultStep';
import FeedbackStep from './components/FeedbackStep';

const STEPS = [
  { id: 'scan', title: '智能扫描', icon: Camera },
  { id: 'score', title: '自动化评分', icon: ClipboardCheck },
  { id: 'result', title: '结果与方案', icon: LayoutDashboard },
  { id: 'feedback', title: '随访追踪', icon: History },
];

const INITIAL_SCORES: IMEScores = {
  glabella: { frs: 0, fdhs: 0, glss: 0 },
  periocular: { frs: 0, fdhs: 0, cfss: 0 },
  commissure: { frs: 0, fdhs: 0, scale: 0 },
  frontalis: { fms: 0, flss: 0, esps: 0 },
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<IMEScores>(INITIAL_SCORES);
  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>([null, null, null, null, null]);
  const [history, setHistory] = useState<PatientRecord[]>([]);

  const result = useMemo(() => calculateIMEResult(scores), [scores]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSaveRecord = (plan: TreatmentPlan, followUps: FollowUpRecord[]) => {
    const newRecord: PatientRecord = {
      id: Date.now().toString(),
      name: '患者 A', // Mock name
      date: new Date().toLocaleDateString(),
      scores: { ...scores },
      result: { ...result },
      plan,
      followUps
    };
    setHistory((prev) => [newRecord, ...prev]);
    setCurrentStep(3); // Go to feedback
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">IME Harmony Tracker</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Muscular Equilibrium Framework</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentStep === idx 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <step.icon size={16} />
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Step Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {currentStep === 0 && (
                  <ScanStep 
                    onNext={nextStep} 
                    onScoresAnalyzed={(analyzedScores, images) => {
                      setScores(analyzedScores);
                      setUploadedImages(images);
                    }} 
                  />
                )}
                {currentStep === 1 && (
                  <ScoreStep 
                    scores={scores} 
                    setScores={setScores} 
                    uploadedImages={uploadedImages}
                    onNext={nextStep} 
                    onPrev={prevStep} 
                  />
                )}
                {currentStep === 2 && (
                  <ResultStep 
                    result={result} 
                    scores={scores}
                    onSave={handleSaveRecord} 
                    onPrev={prevStep} 
                  />
                )}
                {currentStep === 3 && (
                  <FeedbackStep 
                    history={history} 
                    onNewAssessment={() => {
                      setScores(INITIAL_SCORES);
                      setCurrentStep(0);
                    }} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Summary / Status */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                实时评估状态
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-500">全局 IME 指数</span>
                    <span className={`text-2xl font-bold ${INTERPRETATION_MAP[result.interpretation].color}`}>
                      {result.globalIME.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        result.interpretation === 'imbalance' ? 'bg-red-500' :
                        result.interpretation === 'harmony' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${result.globalIME}%` }}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${INTERPRETATION_MAP[result.interpretation].borderColor} ${INTERPRETATION_MAP[result.interpretation].bgColor}`}>
                  <p className={`text-sm font-bold mb-1 ${INTERPRETATION_MAP[result.interpretation].color}`}>
                    {INTERPRETATION_MAP[result.interpretation].label}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {INTERPRETATION_MAP[result.interpretation].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-2">IME 临床决策支持</h3>
              <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                基于肌肉平衡指数框架，系统将自动识别优先干预区域。
              </p>
              <button 
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
              >
                查看干预计划
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
