import React from 'react';
import { Play, Pause, RotateCcw, Plus, MousePointer2, Sparkles, Trash2, Sliders } from 'lucide-react';
import { SimulationState, PhysicsConfig, CelestialBody } from '../types';

interface ControlsProps {
  simState: SimulationState;
  setSimState: (s: SimulationState) => void;
  onReset: () => void;
  config: PhysicsConfig;
  setConfig: (c: PhysicsConfig) => void;
  interactiveMode: 'view' | 'create';
  setInteractiveMode: (m: 'view' | 'create') => void;
  onClear: () => void;
  bodyCount: number;
}

const Controls: React.FC<ControlsProps> = ({
  simState,
  setSimState,
  onReset,
  config,
  setConfig,
  interactiveMode,
  setInteractiveMode,
  onClear,
  bodyCount
}) => {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-4 w-64">
        {/* Main Control Panel */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl">
            <h1 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Orbital Nexus
            </h1>

            <div className="flex items-center gap-2 mb-4">
                <button 
                    onClick={() => setSimState(simState === SimulationState.RUNNING ? SimulationState.PAUSED : SimulationState.RUNNING)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                        simState === SimulationState.RUNNING 
                        ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    }`}
                >
                    {simState === SimulationState.RUNNING ? <><Pause size={18}/> Pause</> : <><Play size={18}/> Play</>}
                </button>
                <button 
                    onClick={onReset}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    title="Reset Simulation"
                >
                    <RotateCcw size={18} />
                </button>
                <button 
                    onClick={onClear}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Clear All"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="bg-white/5 rounded-lg p-1 flex mb-4">
                <button
                    onClick={() => setInteractiveMode('view')}
                    className={`flex-1 py-1 text-sm rounded-md flex items-center justify-center gap-1 transition-colors ${interactiveMode === 'view' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    <MousePointer2 size={14} /> View
                </button>
                <button
                    onClick={() => setInteractiveMode('create')}
                    className={`flex-1 py-1 text-sm rounded-md flex items-center justify-center gap-1 transition-colors ${interactiveMode === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    <Plus size={14} /> Create
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                        <span>Time Step</span>
                        <span>{config.timeStep.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="2.0" 
                        step="0.1" 
                        value={config.timeStep}
                        onChange={(e) => setConfig({...config, timeStep: parseFloat(e.target.value)})}
                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                        <span>Gravity (G)</span>
                        <span>{config.gravitationalConstant.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="2.0" 
                        step="0.1" 
                        value={config.gravitationalConstant}
                        onChange={(e) => setConfig({...config, gravitationalConstant: parseFloat(e.target.value)})}
                        className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500 font-mono">
                <span>Bodies: {bodyCount}</span>
                <span className="flex items-center gap-1"><Sliders size={10} /> v1.0</span>
            </div>
        </div>

        {/* Instructions */}
        {interactiveMode === 'create' && (
            <div className="bg-blue-600/90 text-white p-3 rounded-lg text-sm shadow-lg animate-fade-in border border-blue-400/30">
                <strong>How to Create:</strong>
                <p className="opacity-90 mt-1 text-xs">Click and drag in empty space to "slingshot" launch a new planet.</p>
            </div>
        )}
    </div>
  );
};

export default Controls;
