
import React, { useState } from 'react';
import { IMEScores, ScaleValue, ESPSValue } from '../types';
import { ChevronLeft, ChevronRight, Info, Camera } from 'lucide-react';

interface ScoreStepProps {
  scores: IMEScores;
  setScores: React.Dispatch<React.SetStateAction<IMEScores>>;
  uploadedImages: (string | null)[];
  onNext: () => void;
  onPrev: () => void;
}

const REGIONS = [
  { id: 'glabella', label: '眉间 (Glabella)', imageIndex: 1 },
  { id: 'periocular', label: '眼周 (Periocular)', imageIndex: 3 },
  { id: 'commissure', label: '口角 (Commissure)', imageIndex: 2 },
  { id: 'frontalis', label: '额肌-眉毛 (Frontalis)', imageIndex: 4 },
];

const EVALUATION_GUIDE = {
  glabella: [
    {
      name: '静态张力 (FRS - Facial Resting Score)',
      criteria: [
        '0级: 肌肉完全放松，无可见张力',
        '1级: 隐约可见轻微肌肉收缩迹象',
        '2级: 静态下可见明确的肌肉紧张度',
        '3级: 肌肉明显隆起或紧绷',
        '4级: 极度紧张，伴有明显的组织堆积'
      ]
    },
    {
      name: '动态高张力 (FDHS - Facial Dynamic Hypertonicity Score)',
      criteria: [
        '0级: 动态下无过度收缩',
        '1级: 轻微过度活跃',
        '2级: 中度过度活跃，表情略显僵硬',
        '3级: 重度高张力，表情受限',
        '4级: 极高张力，导致面部表情扭曲'
      ]
    },
    {
      name: '皱纹深度 (GLSS - Glabellar Line Severity Scale)',
      criteria: [
        '0级: 无皱纹',
        '1级: 细微皱纹，浅表可见',
        '2级: 中度皱纹，凹陷明确',
        '3级: 重度皱纹，深沟明显',
        '4级: 极重度，深沟伴有皮肤折叠'
      ]
    }
  ],
  periocular: [
    {
      name: '静态张力 (FRS - Facial Resting Score)',
      criteria: [
        '0级: 眼周平滑，无张力',
        '1级: 细微张力感',
        '2级: 静态下可见眼轮匝肌轻度收缩',
        '3级: 明显张力，眼角略有牵拉',
        '4级: 强力牵拉，影响眼裂形态'
      ]
    },
    {
      name: '动态高张力 (FDHS - Facial Dynamic Hypertonicity Score)',
      criteria: [
        '0级: 正常表情收缩',
        '1级: 动态下轻微过度收缩',
        '2级: 中度过度收缩，鱼尾纹区域紧绷',
        '3级: 重度高张力，挤压感明显',
        '4级: 极高张力，闭眼或大笑时极度扭曲'
      ]
    },
    {
      name: '皱纹深度 (CFSS - Crow’s Feet Severity Scale)',
      criteria: [
        '0级: 无皱纹',
        '1级: 细小纹路',
        '2级: 中度鱼尾纹，延伸至颧骨',
        '3级: 重度深纹，静态可见',
        '4级: 极重度，深沟且范围广泛'
      ]
    }
  ],
  commissure: [
    {
      name: '静态张力 (FRS - Facial Resting Score)',
      criteria: [
        '0级: 口角水平，无下牵力',
        '1级: 隐约可见降口角肌张力',
        '2级: 静态下口角略微下垂',
        '3级: 明确下垂，张力感强',
        '4级: 严重下垂，伴有木偶纹雏形'
      ]
    },
    {
      name: '动态高张力 (FDHS - Facial Dynamic Hypertonicity Score)',
      criteria: [
        '0级: 说话/微笑时无过度下拉',
        '1级: 轻微过度下拉',
        '2级: 中度高张力，影响笑容对称性',
        '3级: 重度下拉，口角活动受限',
        '4级: 极高张力，表情时口角极度向下扭曲'
      ]
    },
    {
      name: '口角皱纹深度 (Oral Commissure Severity Scale)',
      criteria: [
        '0级: 无下垂或皱纹',
        '1级: 极轻微下垂',
        '2级: 中度下垂，可见短小木偶纹',
        '3级: 重度下垂，木偶纹延伸至下颌缘',
        '4级: 极重度，深沟伴有组织松弛'
      ]
    }
  ],
  frontalis: [
    {
      name: '额肌活动度 (FMS - Frontalis Muscle Score)',
      criteria: [
        '测量眉毛上缘在静息位与最大抬眉位之间的垂直位移。',
        '0-4mm: 活动度极低',
        '5-8mm: 活动度中等',
        '9-12mm: 活动度高'
      ]
    },
    {
      name: '额头皱纹深度 (FLSS - Forehead Line Severity Scale)',
      criteria: [
        '0级: 无皱纹',
        '1级: 浅表细纹',
        '2级: 中度横纹，静态可见',
        '3级: 重度深纹，凹陷明显',
        '4级: 极重度，深沟伴有皮肤重叠'
      ]
    },
    {
      name: '上半脸平衡 (ESPS - Eyebrow-Suprabrow Position Score)',
      criteria: [
        '0级: 眉毛位置对称，比例和谐',
        '1级: 轻微不对称或位置偏移',
        '2级: 中度失衡，一侧眉毛明显偏高/低',
        '3级: 严重失衡，影响整体面部表情和谐'
      ]
    }
  ]
};

export default function ScoreStep({ scores, setScores, uploadedImages, onNext, onPrev }: ScoreStepProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [showBaseline, setShowBaseline] = useState(false);

  const currentRegionId = REGIONS[activeTab].id as keyof typeof EVALUATION_GUIDE;
  const currentGuides = EVALUATION_GUIDE[currentRegionId];
  const currentImage = uploadedImages[REGIONS[activeTab].imageIndex];
  const baselineImage = uploadedImages[0];

  const updateScore = (region: keyof IMEScores, field: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [region]: {
        ...prev[region],
        [field]: value
      }
    }));
  };

  const renderSlider = (region: keyof IMEScores, field: string, label: string, max: number = 4) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <span className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
          {(scores[region] as any)[field]}
        </span>
      </div>
      <input 
        type="range" 
        min="0" 
        max={max} 
        step="1"
        value={(scores[region] as any)[field]}
        onChange={(e) => updateScore(region, field, parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
        <span>0 (无)</span>
        <span>{max} (极重)</span>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">自动化评分模块</h2>
          <p className="text-slate-500">基于采集影像进行标准化打分</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8">
        {REGIONS.map((region, idx) => (
          <button
            key={region.id}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === idx ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 min-h-[400px]">
        {/* Left Column: Image & Guide */}
        <div className="space-y-6">
          {/* Image Preview Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Camera size={16} className="text-blue-500" />
                采集影像对照
              </h3>
              <button 
                onClick={() => setShowBaseline(!showBaseline)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100"
              >
                {showBaseline ? '查看动态位' : '对比自然位'}
              </button>
            </div>
            
            <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
              {showBaseline ? (
                baselineImage ? (
                  <img src={baselineImage} className="w-full h-full object-cover" alt="Baseline" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">未上传自然位照片</div>
                )
              ) : (
                currentImage ? (
                  <img src={currentImage} className="w-full h-full object-cover" alt="Current Action" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">未上传该动作照片</div>
                )
              )}
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold">
                {showBaseline ? '自然放松位 (Baseline)' : `当前评估位：${REGIONS[activeTab].label}`}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pt-2">
            <Info size={16} className="text-blue-500" />
            评估参考指南 (Evaluation Guide)
          </h3>
          
          <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {currentGuides.map((guide, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                  {guide.name}
                </h4>
                <ul className="space-y-1.5">
                  {guide.criteria.map((criterion, cIdx) => (
                    <li key={cIdx} className="text-[11px] text-slate-600 flex gap-2">
                      <span className="text-blue-300 shrink-0">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-bold">打分提示：</span>
              请根据左侧指南对患者进行手动评分。0级表示无异常，4级表示极重度。
            </p>
          </div>
        </div>

        {/* Input Controls */}
        <div className="space-y-8">
          {activeTab === 0 && (
            <>
              {renderSlider('glabella', 'frs', '静态张力 (FRS)')}
              {renderSlider('glabella', 'fdhs', '动态高张力 (FDHS)')}
              {renderSlider('glabella', 'glss', '皱纹深度 (GLSS)')}
            </>
          )}
          {activeTab === 1 && (
            <>
              {renderSlider('periocular', 'frs', '静态张力 (FRS)')}
              {renderSlider('periocular', 'fdhs', '动态高张力 (FDHS)')}
              {renderSlider('periocular', 'cfss', '皱纹深度 (CFSS)')}
            </>
          )}
          {activeTab === 2 && (
            <>
              {renderSlider('commissure', 'frs', '静态张力 (FRS)')}
              {renderSlider('commissure', 'fdhs', '动态高张力 (FDHS)')}
              {renderSlider('commissure', 'scale', '口角皱纹深度')}
            </>
          )}
          {activeTab === 3 && (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">额肌活动度 (FMS)</label>
                  <span className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                    {scores.frontalis.fms} mm
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  step="0.5"
                  value={scores.frontalis.fms}
                  onChange={(e) => updateScore('frontalis', 'fms', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                  <span>0 mm</span>
                  <span>12 mm (最大)</span>
                </div>
              </div>
              {renderSlider('frontalis', 'flss', '额头皱纹深度 (FLSS)')}
              {renderSlider('frontalis', 'esps', '上半脸平衡 (ESPS)', 3)}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button 
          onClick={onPrev}
          className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <ChevronLeft size={18} />
          上一步
        </button>
        <div className="flex gap-4">
          {activeTab < 3 ? (
            <button 
              onClick={() => setActiveTab(t => t + 1)}
              className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center gap-2"
            >
              下一区域
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={onNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              生成评估报告
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
