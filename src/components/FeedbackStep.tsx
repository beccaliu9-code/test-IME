
import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { 
  History, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Clock,
  ChevronRight,
  ClipboardList,
  FileText,
  Activity
} from 'lucide-react';

interface FeedbackStepProps {
  history: PatientRecord[];
  onNewAssessment: () => void;
}

export default function FeedbackStep({ history, onNewAssessment }: FeedbackStepProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(history[0]?.id || null);

  const chartData = [...history].reverse().map(record => ({
    date: record.date,
    ime: record.result.globalIME
  }));

  const selectedRecord = history.find(r => r.id === selectedRecordId);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">随访追踪与反馈</h2>
          <p className="text-slate-500">记录患者面部和谐度的长期变化趋势</p>
        </div>
        <button 
          onClick={onNewAssessment}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          新增评估
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* History List */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Clock size={18} className="text-slate-400" />
            历史评估记录
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <History size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">暂无历史记录</p>
              </div>
            ) : (
              history.map((record) => (
                <div 
                  key={record.id} 
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedRecordId === record.id 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' 
                      : 'bg-white border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">{record.date}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      record.result.globalIME < 60 ? 'text-red-500' : 
                      record.result.globalIME > 80 ? 'text-blue-500' : 'text-green-500'
                    }`}>
                      {record.result.globalIME.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{record.name}</p>
                    <ChevronRight size={16} className={`transition-colors ${selectedRecordId === record.id ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details & Trend */}
        <div className="lg:col-span-9 space-y-8">
          {selectedRecord ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Record Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardList size={18} className="text-blue-600" />
                    干预方案回顾
                  </h3>
                  {selectedRecord.plan ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">临床诊断</p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedRecord.plan.diagnosis || '无记录'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">建议剂量</p>
                          <p className="text-sm text-slate-700 font-medium">{selectedRecord.plan.dosage || '无记录'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">随访日期</p>
                          <p className="text-sm text-slate-700 font-medium">{selectedRecord.plan.followUpDate || '未预约'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">干预建议</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.plan.recommendations.map(r => (
                            <span key={r} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">未记录干预方案</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    随访笔记
                  </h3>
                  <div className="space-y-3">
                    {selectedRecord.followUps.length > 0 ? (
                      selectedRecord.followUps.map(f => (
                        <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-bold text-blue-500 mb-1">{f.date}</p>
                          <p className="text-xs text-slate-600">{f.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">无随访笔记</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  IME 长期趋势
                </h3>
                <div className="h-[300px] w-full">
                  {chartData.length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <TrendingUp size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">需要至少两次评估记录</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <ReferenceArea {...({ y1: 60, y2: 80, fill: "#22c55e", fillOpacity: 0.05 } as any)} />
                        <Line type="monotone" dataKey="ime" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">平均 IME 分数</p>
                    <p className="text-xl font-bold text-blue-700">
                      {(chartData.reduce((acc, curr) => acc + curr.ime, 0) / chartData.length || 0).toFixed(1)}
                    </p>
                  </div>
                  <Activity size={32} className="text-blue-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <ClipboardList size={64} className="mb-4 opacity-10" />
              <p>选择左侧记录查看详细评估方案与随访</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
