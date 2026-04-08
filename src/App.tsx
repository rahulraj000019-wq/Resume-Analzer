/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Zap, 
  ChevronRight, 
  RefreshCw,
  BarChart3,
  Target,
  BrainCircuit,
  ArrowLeft
} from "lucide-react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  PolarAngleAxis 
} from "recharts";
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from "./lib/utils";
import { analyzeResumeDeterministic } from "./lib/deterministicAnalyzer";

// --- Types ---
interface AnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  summary: string;
}

type Step = "upload" | "scanning" | "results";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Components ---

const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={cn("glass rounded-3xl p-8", className)}
  >
    {children}
  </motion.div>
);

interface SkillChipProps {
  name: string;
  isMissing?: boolean;
}

const SkillChip: React.FC<SkillChipProps> = ({ name, isMissing }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      x: isMissing ? [0, -2, 2, -2, 2, 0] : 0
    }}
    transition={{ 
      x: isMissing ? { repeat: Infinity, duration: 2, repeatDelay: 3 } : { duration: 0.2 }
    }}
    whileHover={{ scale: 1.05, y: -2 }}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border transition-colors",
      isMissing 
        ? "bg-red-500/10 text-red-400 border-red-500/20" 
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    )}
  >
    {isMissing ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
    {name}
  </motion.div>
);

export default function App() {
  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [resumeImage, setResumeImage] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setResumeImage(base64);
          setResumeText(""); // Clear text if image is uploaded
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
          setResumeImage(null); // Clear image if text/pdf is uploaded
        };
        reader.readAsText(file);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    multiple: false
  } as any);

  const analyzeResume = async () => {
    if ((!resumeText && !resumeImage) || !jobDescription) {
      setError("Please provide both a resume (text or photo) and a job description.");
      return;
    }

    setStep("scanning");
    setIsAnalyzing(true);
    setError(null);

    try {
      let finalResumeText = resumeText;

      // If we have an image, we use AI ONLY for OCR (text extraction)
      // as requested to use "simple logic" for the actual analysis.
      if (resumeImage) {
        const base64Data = resumeImage.split(',')[1];
        const mimeType = resumeImage.split(';')[0].split(':')[1];
        
        const ocrResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: "Extract all text from this resume image. Return only the text content." }
            ]
          }
        });
        finalResumeText = ocrResponse.text || "";
      }

      // Perform deterministic analysis (Java-style logic)
      const data = analyzeResumeDeterministic(finalResumeText, jobDescription);
      setResult(data);
      
      // Simulate scanning time for visual effect
      setTimeout(() => {
        setStep("results");
        setIsAnalyzing(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
      setStep("upload");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
          Resume Analyzer
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Elevate your career with high-fidelity analysis insights and interactive skill mapping.
        </p>
      </motion.div>

      <div className="w-full max-w-5xl relative">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Job Description Input */}
              <GlassCard className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Target size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">Job Description</h2>
                </div>
                <textarea
                  placeholder="Paste the target job description here..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 text-white/80 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none min-h-[300px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </GlassCard>

              {/* Resume Upload */}
              <GlassCard className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">Your Resume</h2>
                </div>
                
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer group relative overflow-hidden",
                    isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20 bg-black/20"
                  )}
                >
                  <input {...getInputProps()} />
                  {resumeImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm group-hover:bg-black/20 transition-all">
                      <img src={resumeImage} alt="Resume Preview" className="max-h-full max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RefreshCw className="text-white mb-2" size={32} />
                        <p className="text-white font-bold">Click to change photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-white/40 group-hover:text-emerald-400 transition-colors" size={32} />
                      </div>
                      <p className="text-white/60 text-center">
                        {resumeText ? "Resume Loaded!" : "Drag & drop resume, or click to browse"}
                      </p>
                      <p className="text-white/20 text-xs mt-2">Supports PDF, TXT, JPG, PNG</p>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-widest font-bold">Or paste text</p>
                  <textarea
                    placeholder="Paste resume text directly..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white/60 focus:outline-none focus:border-emerald-500/50 transition-colors h-24"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  onClick={analyzeResume}
                  disabled={(!resumeText && !resumeImage) || !jobDescription}
                  className="mt-4 w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Analyze Resume <Zap size={18} fill="currentColor" />
                </button>
              </GlassCard>
            </motion.div>
          )}

          {step === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-full max-w-md aspect-[3/4] glass rounded-3xl overflow-hidden mb-8">
                <div className="scan-line" />
                <div className="p-8 space-y-4 opacity-20">
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                  <div className="h-4 bg-white/20 rounded w-1/2" />
                  <div className="h-32 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/20 rounded w-2/3" />
                  <div className="h-4 bg-white/20 rounded w-5/6" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
                <BrainCircuit className="text-emerald-400 animate-pulse" />
                System Scanning in Progress...
              </h2>
              <p className="text-white/40">Analyzing keywords, skills, and experience match.</p>
            </motion.div>
          )}

          {step === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Top Stats Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-3xl" />
                  <h3 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-4">Match Score</h3>
                  <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="80%" 
                        outerRadius="100%" 
                        barSize={10} 
                        data={[{ value: result.score }]}
                        startAngle={90}
                        endAngle={90 - (360 * result.score / 100)}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={30}
                          fill="#10b981"
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                        className="text-5xl font-display font-bold"
                      >
                        {result.score}%
                      </motion.span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                  <h3 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-4">Analysis Summary</h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    {result.summary}
                  </p>
                  <div className="mt-6 flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-emerald-400">{result.matchedSkills.length}</span>
                      <span className="text-xs text-white/40 uppercase">Matches</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-red-400">{result.missingSkills.length}</span>
                      <span className="text-xs text-white/40 uppercase">Gaps</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-400" size={20} />
                      Matched Skills
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {result.matchedSkills.map((skill, i) => (
                      <SkillChip key={i} name={skill} />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <AlertCircle className="text-red-400" size={20} />
                      Missing Skills
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {result.missingSkills.map((skill, i) => (
                      <SkillChip key={i} name={skill} isMissing />
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Suggestions */}
              <GlassCard>
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20} />
                  Improvement Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.suggestions.map((suggestion, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start"
                    >
                      <div className="mt-1 p-1 bg-emerald-500/20 rounded text-emerald-400">
                        <ChevronRight size={14} />
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setStep("upload")}
                  className="px-8 py-4 glass glass-hover rounded-2xl flex items-center gap-2 text-white/60 hover:text-white transition-all"
                >
                  <RefreshCw size={18} />
                  Analyze Another Resume
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 text-center space-y-4 pb-12"
      >
        <div className="space-y-2">
          <div className="text-white/20 text-xs uppercase tracking-[0.3em] font-bold">
            Powered by Java Logic
          </div>
          <div className="text-white/10 text-[10px] uppercase tracking-widest flex flex-col gap-1">
            <span className="text-white/30 font-bold">Team Bug Fixers (DAA-IV-T263)</span>
            <span>Himish Jaiswal • Gaurav Kumar Bhadani • Harshit Pandey</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
