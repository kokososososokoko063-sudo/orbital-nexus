import React, { useState } from 'react';
import { Sparkles, Send, Loader2, MessageSquareText, Cpu } from 'lucide-react';
import { CelestialBody } from '../types';
import { generateScenario, explainSimulation } from '../services/geminiService';

interface GeminiPanelProps {
  onScenarioGenerated: (bodies: Partial<CelestialBody>[]) => void;
  currentBodies: CelestialBody[];
  viewport: { w: number, h: number };
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ onScenarioGenerated, currentBodies, viewport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setAnalysis(null);
    try {
        const newBodies = await generateScenario(prompt, viewport);
        if (newBodies.length > 0) {
            onScenarioGenerated(newBodies);
            setIsOpen(false);
            setPrompt('');
        }
    } catch (error) {
        console.error(error);
        setAnalysis("Error: Failed to generate scenario. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
        const text = await explainSimulation(currentBodies);
        setAnalysis(text);
    } catch (error) {
        console.error(error);
        setAnalysis("Error: Failed to analyze simulation.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className={`absolute bottom-4 right-4 flex flex-col items-end gap-2 transition-all duration-300 ${isOpen ? 'w-96' : 'w-auto'}`}>
      
      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-full bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="text-purple-400" size={18} /> 
                    AI Assistant
                </h2>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button 
                        onClick={() => setMode('generate')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${mode === 'generate' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Generate
                    </button>
                    <button 
                        onClick={() => setMode('analyze')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${mode === 'analyze' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Analyze
                    </button>
                </div>
            </div>

            {mode === 'generate' ? (
                <div className="space-y-3">
                    <p className="text-xs text-gray-300">
                        Describe a celestial system (e.g., "A binary star system with 3 chaotic planets" or "A solar system with 5 gas giants").
                    </p>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Powered by Gemini 2.5 Flash</span>
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                            Generate
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-gray-300">
                        Get a creative sci-fi analysis of your current simulation state.
                    </p>
                    {analysis ? (
                        <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-200 max-h-48 overflow-y-auto border border-white/5">
                            {analysis}
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-gray-500 text-sm border border-dashed border-white/10 rounded-lg">
                            No analysis yet.
                        </div>
                    )}
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                         {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Cpu size={16}/>}
                        Analyze Simulation
                    </button>
                </div>
            )}
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'bg-gray-800 text-gray-400 rotate-45' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105'}`}
      >
        {isOpen ? <PlusIcon /> : <Sparkles size={24} />}
      </button>
    </div>
  );
};

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5v14"/>
    </svg>
);

export default GeminiPanel;
