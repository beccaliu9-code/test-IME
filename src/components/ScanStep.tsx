
import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Play, VideoOff, Upload, FileImage, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { IMEScores } from '../types';

interface ScanStepProps {
  onNext: () => void;
  onScoresAnalyzed: (scores: IMEScores, images: (string | null)[]) => void;
}

const ACTIONS = [
  { 
    name: '自然放松', 
    desc: '面部肌肉完全放松，双眼平视前方，嘴唇自然闭合。',
    req: '确保光线均匀，无阴影，面部正对镜头。'
  },
  { 
    name: '听指令皱眉', 
    desc: '用力皱眉，模拟愤怒或思考的表情，使眉间纹充分显现。',
    req: '捕捉眉间肌肉收缩的最强状态。'
  },
  { 
    name: '闭口微笑', 
    desc: '嘴角上扬，保持双唇闭合，观察中面部提升情况。',
    req: '注意观察鼻唇沟的变化。'
  },
  { 
    name: '露齿大笑', 
    desc: '自然大笑，露出牙齿，观察眼周鱼尾纹及口角动态。',
    req: '捕捉笑容最灿烂、肌肉收缩最充分的瞬间。'
  },
  { 
    name: '抬眉', 
    desc: '尽力向上抬起双眉，额头出现横向纹路。',
    req: '确保额肌充分收缩，捕捉额纹分布。'
  }
];

export default function ScanStep({ onNext, onScoresAnalyzed }: ScanStepProps) {
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>([null, null, null, null, null]);
  const [activeActionIndex, setActiveActionIndex] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [qualityChecks, setQualityChecks] = useState({
    lighting: true,
    pose: false,
    distance: true
  });

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('无法访问摄像头，请检查权限设置。');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || activeActionIndex === null) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newImages = [...uploadedImages];
        newImages[activeActionIndex] = event.target.result as string;
        setUploadedImages(newImages);
        
        const filledCount = newImages.filter(img => img !== null).length;
        setProgress((filledCount / 5) * 100);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (index: number) => {
    setActiveActionIndex(index);
    fileInputRef.current?.click();
  };

  const runAIAnalysis = async () => {
    const firstImage = uploadedImages.find(img => img !== null);
    if (!firstImage) return;
    
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const base64Data = firstImage.split(',')[1];
      
      const prompt = `
        你是一位面部美容分析专家。请分析这张面部照片，并根据 IME (Muscular Equilibrium Index) 框架给出初步的评分建议。
        
        请返回一个 JSON 对象，包含以下字段（分数为 0-4 的整数，FMS 为 0-12 的数字，ESPS 为 0-3 的整数）:
        {
          "glabella": { "frs": number, "fdhs": number, "glss": number },
          "periocular": { "frs": number, "fdhs": number, "cfss": number },
          "commissure": { "frs": number, "fdhs": number, "scale": number },
          "frontalis": { "fms": number, "flss": number, "esps": number }
        }
        
        注意：只需返回 JSON，不要有其他文字。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text) as IMEScores;
      onScoresAnalyzed(result, uploadedImages);
      onNext();
    } catch (error) {
      console.error('AI Analysis Error:', error);
      onNext();
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setScanning(false);
            setQualityChecks(q => ({ ...q, pose: true }));
            return 100;
          }
          return p + 2;
        });
      }, 50)
      return () => clearInterval(interval);
    }
  }, [scanning]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">智能影像采集</h2>
          <p className="text-slate-500">点击下方卡片，根据要求上传对应表情的照片</p>
        </div>
        <div className="flex gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${qualityChecks.lighting ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {qualityChecks.lighting ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            光线质量
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${qualityChecks.pose ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {qualityChecks.pose ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            法兰克福平面
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-8 group">
        {cameraActive ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
        ) : uploadedImages.some(img => img !== null) ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <img 
              src={uploadedImages.find(img => img !== null) || ''} 
              className="max-w-full max-h-full object-contain"
              alt="Uploaded Preview"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-800">
            {cameraError ? (
              <>
                <VideoOff size={48} className="mb-4 text-red-500" />
                <p className="text-sm font-medium mb-4">{cameraError}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                  >
                    重试连接
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-sm mb-6">正在启动摄像头...</p>
              </>
            )}
          </div>
        )}
        
        {/* Overlay Grid */}
        <div className="absolute inset-0 border-2 border-white/20 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/20" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-blue-500/50 rounded-full" />
        </div>

        {(scanning || analyzing) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-bold">
                {analyzing ? 'AI 正在分析面部特征...' : `正在分析动态视频... ${progress}%`}
              </p>
            </div>
          </div>
        )}

        {!scanning && !analyzing && progress === 0 && cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <button 
              onClick={() => setScanning(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700"
            >
              <Play size={20} />
              开始实时采集
            </button>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {ACTIONS.map((action, i) => (
          <button 
            key={action.name} 
            onClick={() => triggerUpload(i)}
            className={`group text-left p-4 rounded-2xl border-2 transition-all ${uploadedImages[i] ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}
          >
            <div className={`aspect-square rounded-xl mb-3 flex items-center justify-center border-2 transition-all overflow-hidden ${uploadedImages[i] ? 'bg-white border-blue-100 text-blue-600' : 'bg-white border-slate-100 text-slate-300'}`}>
              {uploadedImages[i] ? (
                <img src={uploadedImages[i]!} className="w-full h-full object-cover" alt={action.name} />
              ) : (
                <Camera size={24} className="group-hover:text-blue-400 transition-colors" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{action.name}</h3>
            <p className="text-[10px] leading-relaxed text-slate-500 line-clamp-2 group-hover:line-clamp-none transition-all">
              {action.desc}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200/50">
              <p className="text-[9px] text-blue-600 font-medium">拍摄要求：</p>
              <p className="text-[9px] text-slate-400">{action.req}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <button 
          onClick={() => { setProgress(0); setScanning(false); setUploadedImages([null, null, null, null, null]); }}
          className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          重置
        </button>
        <div className="flex gap-4">
          {uploadedImages.some(img => img !== null) && !analyzing && (
            <button 
              onClick={() => {
                onScoresAnalyzed({
                  glabella: { frs: 0, fdhs: 0, glss: 0 },
                  periocular: { frs: 0, fdhs: 0, cfss: 0 },
                  commissure: { frs: 0, fdhs: 0, scale: 0 },
                  frontalis: { fms: 0, flss: 0, esps: 0 },
                }, uploadedImages);
                onNext();
              }}
              className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              跳过 AI 直接评分
            </button>
          )}
          <button 
            onClick={() => {
              if (uploadedImages.some(img => img !== null)) {
                runAIAnalysis();
              } else {
                onScoresAnalyzed({
                  glabella: { frs: 0, fdhs: 0, glss: 0 },
                  periocular: { frs: 0, fdhs: 0, cfss: 0 },
                  commissure: { frs: 0, fdhs: 0, scale: 0 },
                  frontalis: { fms: 0, flss: 0, esps: 0 },
                }, uploadedImages);
                onNext();
              }
            }}
            disabled={progress < 100 || analyzing}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {analyzing ? <Loader2 className="animate-spin" size={18} /> : null}
            {uploadedImages.some(img => img !== null) ? 'AI 自动评分并进入' : '进入评分'}
          </button>
        </div>
      </div>
    </div>
  );
}
