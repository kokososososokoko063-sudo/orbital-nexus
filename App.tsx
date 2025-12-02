import React, { useState, useEffect, useCallback } from 'react';
import SpaceCanvas from './components/SpaceCanvas';
import Controls from './components/Controls';
import GeminiPanel from './components/GeminiPanel';
import { CelestialBody, SimulationState, PhysicsConfig, Viewport, Vector2 } from './types';
import { DEFAULT_PHYSICS_CONFIG, COLORS } from './constants';
import { updatePhysics } from './utils/physics';

const App: React.FC = () => {
  // State
  const [bodies, setBodies] = useState<CelestialBody[]>([]);
  const [simState, setSimState] = useState<SimulationState>(SimulationState.RUNNING);
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS_CONFIG);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [interactiveMode, setInteractiveMode] = useState<'view' | 'create'>('view');

  // Initialize with a simple solar system like setup centered in the screen
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setViewport({ x: w / 2, y: h / 2, scale: 1 });
    
    // Default system
    setBodies([
        {
            id: 'sun',
            name: 'Sun',
            mass: 2000,
            radius: 25,
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            color: '#fbbf24', // yellow
            trail: [],
            isLocked: false // Let it move a bit to counterbalance
        },
        {
            id: 'earth',
            name: 'Earth',
            mass: 100,
            radius: 8,
            position: { x: 300, y: 0 },
            velocity: { x: 0, y: 1.8 }, // Approximate orbital velocity sqrt(GM/r) -> sqrt(0.5 * 2000 / 300) ~= 1.82
            color: '#3b82f6', // blue
            trail: []
        },
        {
            id: 'mars',
            name: 'Mars',
            mass: 50,
            radius: 6,
            position: { x: 0, y: -450 },
            velocity: { x: -1.5, y: 0 },
            color: '#ef4444', // red
            trail: []
        }
    ]);
  }, []);

  // Physics Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
        if (simState === SimulationState.RUNNING) {
            setBodies(prevBodies => updatePhysics(prevBodies, config));
        }
        animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [simState, config]);

  // Handlers
  const handleBodyDragEnd = useCallback((startPos: Vector2, velocity: Vector2) => {
    const newBody: CelestialBody = {
        id: crypto.randomUUID(),
        mass: Math.random() * 80 + 20, // Random mass between 20 and 100
        radius: 0, // will be calculated below
        position: startPos,
        velocity: velocity,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        trail: []
    };
    newBody.radius = Math.sqrt(newBody.mass) * 0.8;
    setBodies(prev => [...prev, newBody]);
  }, []);

  const handleScenarioGenerated = useCallback((newBodiesData: Partial<CelestialBody>[]) => {
    // Convert partial data to full bodies
    const newBodies = newBodiesData.map(b => ({
        id: b.id || crypto.randomUUID(),
        mass: b.mass || 100,
        radius: b.radius || Math.sqrt(b.mass || 100) * 0.5,
        position: b.position || { x: 0, y: 0 },
        velocity: b.velocity || { x: 0, y: 0 },
        color: b.color || COLORS[Math.floor(Math.random() * COLORS.length)],
        trail: [],
        name: b.name,
        isLocked: b.isLocked
    }));
    
    // Reset viewport to center (approximately)
    setBodies(newBodies as CelestialBody[]);
    setSimState(SimulationState.PAUSED); // Pause so user can see initial state
    setInteractiveMode('view');
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden select-none">
        
        {/* Star Background (Static CSS/Canvas could be better, but simple is fine) */}
        <div className="absolute inset-0 pointer-events-none opacity-40" 
             style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 0)',
                backgroundSize: '40px 40px'
             }}>
        </div>

        <SpaceCanvas 
            bodies={bodies} 
            viewport={viewport} 
            setViewport={setViewport}
            onBackgroundClick={() => {}}
            onBodyDragEnd={handleBodyDragEnd}
            interactiveMode={interactiveMode}
        />

        <Controls 
            simState={simState}
            setSimState={setSimState}
            onReset={() => setBodies([])} // Actually just clears for now, could restore initial
            config={config}
            setConfig={setConfig}
            interactiveMode={interactiveMode}
            setInteractiveMode={setInteractiveMode}
            onClear={() => setBodies([])}
            bodyCount={bodies.length}
        />

        <GeminiPanel 
            onScenarioGenerated={handleScenarioGenerated}
            currentBodies={bodies}
            viewport={{ w: window.innerWidth, h: window.innerHeight }}
        />
        
        {/* Attribution/Info */}
        <div className="absolute bottom-4 left-4 text-white/20 text-xs pointer-events-none">
            Orbital Nexus // Physics Engine
        </div>
    </div>
  );
};

export default App;
