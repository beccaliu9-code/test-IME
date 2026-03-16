
import React, { useState, useEffect } from 'react';
import { IMEResult, IMEScores, TreatmentPlan, FollowUpRecord } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { 
  ChevronLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Activity,
  Download,
  Plus,
  History,
  ClipboardList,
  FileText
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ResultStepProps {
  result: IMEResult;
  scores: IMEScores;
  onSave: (plan: TreatmentPlan, followUps: FollowUpRecord[]) => void;
  onPrev: () => void;
}

export default function ResultStep({ result, scores, onSave, onPrev }: ResultStepProps) {
  const [aiAdvice, setAiAdvice] = useState<string>('正在生成 AI 临床建议...');
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  
  // Treatment Plan State
  const [plan, setPlan] = useState<TreatmentPlan>({
    diagnosis: '',
    recommendations: [],
    dosage: '',
    followUpDate: ''
  });

  // Follow-up Records State
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [newFollowUp, setNewFollowUp] = useState('');

  const chartData = [
    { subject: '眉间 (Glabella)', A: result.glabellaScore * 100, fullMark: 100 },
    { subject: '眼周 (Periocular)', A: result.periocularScore * 100, fullMark: 100 },
    { subject: '口角 (Commissure)', A: result.commissureScore * 100, fullMark: 100 },
    { subject: '额肌 (Frontalis)', A: result.frontalisScore * 100, fullMark: 100 },
  ];

  const priorities = [...chartData].sort((a, b) => a.A - b.A).slice(0, 2);

  useEffect(() => {
    async function generateAdvice() {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const prompt = `
          你是一位面部美容注射专家。基于以下 IME (Muscular Equilibrium Index) 评分数据，为医生生成一段简短、专业的临床建议和医患沟通话术。
          
          评分数据 (0-100, 分数越低表示张力越高/表现越差):
          - 眉间: ${result.glabellaScore * 100}
          - 眼周: ${result.periocularScore * 100}
          - 口角: ${result.commissureScore * 100}
          - 额肌: ${result.frontalisScore * 100}
          - 全局 IME: ${result.globalIME}
          
          要求:
          1. 识别得分最低的 1-2 个区域作为优先干预目标。
          2. 提供一段用于医患沟通的话术，语气专业且富有同理心。
          3. 简要说明干预逻辑。
          4. 语言使用中文。
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        setAiAdvice(response.text || '无法生成建议。');
      } catch (error) {
        console.error('AI Error:', error);
        setAiAdvice('AI 建议生成失败，请根据临床经验判断。');
      } finally {
        setLoadingAdvice(false);
      }
    }

    generateAdvice();
  }, [result]);

  const addFollowUp = () => {
    if (!newFollowUp.trim()) return;
    const record: FollowUpRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      note: newFollowUp
    };
    setFollowUps([record, ...followUps]);
    setNewFollowUp('');
  };

  const exportReport = () => {
    const report = `
=========================================
      IME Harmony Tracker 评估报告
=========================================
生成日期: ${new Date().toLocaleString()}
报告编号: IME-${new Date().getTime()}
-----------------------------------------

[1. 综合评估结果]
-----------------------------------------
全局和谐度指数 (Global IME): ${result.globalIME.toFixed(1)}
评估结论: ${result.interpretation === 'imbalance' ? '失衡 (Imbalance)' : result.interpretation === 'harmony' ? '和谐 (Harmony)' : '优化空间 (Optimization)'}

[2. 区域详细评分 (0-100)]
-----------------------------------------
眉间区域 (Glabella):   ${(result.glabellaScore * 100).toFixed(1)}
眼周区域 (Periocular): ${(result.periocularScore * 100).toFixed(1)}
口角区域 (Commissure): ${(result.commissureScore * 100).toFixed(1)}
额肌区域 (Frontalis):  ${(result.frontalisScore * 100).toFixed(1)}

[3. 临床指标明细 (原始评分)]
-----------------------------------------
眉间 (Glabella):
  - 静态张力 (FRS): ${scores.glabella.frs}
  - 动态高张力 (FDHS): ${scores.glabella.fdhs}
  - 皱纹深度 (GLSS): ${scores.glabella.glss}

眼周 (Periocular):
  - 静态张力 (FRS): ${scores.periocular.frs}
  - 动态高张力 (FDHS): ${scores.periocular.fdhs}
  - 皱纹深度 (CFSS): ${scores.periocular.cfss}

口角 (Commissure):
  - 静态张力 (FRS): ${scores.commissure.frs}
  - 动态高张力 (FDHS): ${scores.commissure.fdhs}
  - 皱纹深度: ${scores.commissure.scale}

额肌 (Frontalis):
  - 额肌活动度 (FMS): ${scores.frontalis.fms} mm
  - 额头皱纹深度 (FLSS): ${scores.frontalis.flss}
  - 上半脸平衡 (ESPS): ${scores.frontalis.esps}

[4. 临床诊断与干预方案]
-----------------------------------------
临床诊断:
${plan.diagnosis || '未填写'}

建议干预措施:
${plan.recommendations.length > 0 ? plan.recommendations.map(r => `• ${r}`).join('\n') : '未选择'}

剂量/点位建议:
${plan.dosage || '未填写'}

下次随访预约:
${plan.followUpDate || '未预约'}

[5. 随访记录回顾]
-----------------------------------------
${followUps.length > 0 ? followUps.map(f => `[${f.date}] ${f.note}`).join('\n') : '暂无随访记录'}

[6. AI 临床决策支持建议]
-----------------------------------------
${aiAdvice}

-----------------------------------------
免责声明: 
本报告由 AI 辅助生成，仅供临床医生参考。
最终诊疗方案请结合患者临床表现及专业判断确定。
=========================================
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IME_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">评估结果与干预方案</h2>
          <p className="text-slate-500">基于 IME 框架的量化分析报告</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onPrev}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            返回修改
          </button>
          <button 
            onClick={exportReport}
            className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center gap-2"
          >
            <Download size={16} />
            导出报告
          </button>
          <button 
            onClick={() => onSave(plan, followUps)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Save size={16} />
            保存记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Visualization & AI */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                面部效价雷达图
              </h3>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80" data={chartData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="IME Score"
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Advice */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                AI 临床建议
              </h3>
              <div className="relative">
                {loadingAdvice ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-blue-200 rounded w-full" />
                    <div className="h-4 bg-blue-200 rounded w-5/6" />
                    <div className="h-4 bg-blue-200 rounded w-4/6" />
                  </div>
                ) : (
                  <div className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap italic">
                    "{aiAdvice}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Treatment Plan Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              干预方案制定
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">临床诊断</label>
                  <textarea 
                    value={plan.diagnosis}
                    onChange={(e) => setPlan({...plan, diagnosis: e.target.value})}
                    placeholder="输入临床观察与诊断..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm min-h-[100px] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">剂量与点位建议</label>
                  <input 
                    type="text"
                    value={plan.dosage}
                    onChange={(e) => setPlan({...plan, dosage: e.target.value})}
                    placeholder="例如: 眉间 20U, 5点注射..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">干预建议 (多选/输入)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['肉毒毒素注射', '玻尿酸填充', '光电治疗', '日常护理'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => {
                          const newRecs = plan.recommendations.includes(tag) 
                            ? plan.recommendations.filter(r => r !== tag)
                            : [...plan.recommendations, tag];
                          setPlan({...plan, recommendations: newRecs});
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${plan.recommendations.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">下次随访日期</label>
                  <input 
                    type="date"
                    value={plan.followUpDate}
                    onChange={(e) => setPlan({...plan, followUpDate: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-ups */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              随访记录
            </h3>
            
            <div className="mb-6">
              <div className="relative">
                <textarea 
                  value={newFollowUp}
                  onChange={(e) => setNewFollowUp(e.target.value)}
                  placeholder="添加新的随访笔记..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px] resize-none pr-12"
                />
                <button 
                  onClick={addFollowUp}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] pr-2 custom-scrollbar">
              {followUps.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs">暂无随访记录</p>
                </div>
              ) : (
                followUps.map(record => (
                  <div key={record.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{record.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{record.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
        <AlertCircle size={20} className="text-amber-600 shrink-0" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>免责与安全提示：</strong> 本系统生成的报告与 AI 建议仅供临床参考。所有医疗决策、注射剂量及操作风险均由执业医师自行承担。
        </p>
      </div>
    </div>
  );
}
