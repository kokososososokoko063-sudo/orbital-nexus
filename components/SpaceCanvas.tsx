import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CelestialBody, Viewport, Vector2 } from '../types';

interface SpaceCanvasProps {
  bodies: CelestialBody[];
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  onBackgroundClick: (pos: Vector2) => void;
  onBodyDragEnd: (start: Vector2, end: Vector2) => void; // For slingshot creation
  interactiveMode: 'view' | 'create';
}

const SpaceCanvas: React.FC<SpaceCanvasProps> = ({ 
  bodies, 
  viewport, 
  setViewport, 
  onBackgroundClick,
  onBodyDragEnd,
  interactiveMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragStart, setDragStart] = useState<Vector2 | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Vector2 | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<Vector2 | null>(null);

  // Coordinate conversion
  const screenToWorld = useCallback((x: number, y: number): Vector2 => {
    return {
      x: (x - viewport.x) / viewport.scale,
      y: (y - viewport.y) / viewport.scale
    };
  }, [viewport]);

  const worldToScreen = useCallback((x: number, y: number): Vector2 => {
    return {
      x: x * viewport.scale + viewport.x,
      y: y * viewport.scale + viewport.y
    };
  }, [viewport]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });
    resizeObserver.observe(canvas);

    // Render frame
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid (Optional, faint)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      const gridSize = 100 * viewport.scale;
      const offsetX = viewport.x % gridSize;
      const offsetY = viewport.y % gridSize;
      
      ctx.beginPath();
      // Only draw if grid isn't too dense
      if (gridSize > 10) {
        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
      }
      ctx.stroke();

      // Draw Bodies & Trails
      bodies.forEach(body => {
        // Trail
        if (body.trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = body.color;
          ctx.lineWidth = 2 * Math.min(1, viewport.scale); // Scale trail width slightly
          ctx.globalAlpha = 0.4;
          
          const start = worldToScreen(body.trail[0].x, body.trail[0].y);
          ctx.moveTo(start.x, start.y);
          
          for (let i = 1; i < body.trail.length; i++) {
            const p = worldToScreen(body.trail[i].x, body.trail[i].y);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Body
        const screenPos = worldToScreen(body.position.x, body.position.y);
        const screenRadius = Math.max(2, body.radius * viewport.scale);

        ctx.beginPath();
        ctx.fillStyle = body.color;
        
        // Glow effect
        ctx.shadowColor = body.color;
        ctx.shadowBlur = 15;
        
        ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Name label if zoomed in enough
        if (body.name && viewport.scale > 0.5) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Inter';
            ctx.fillText(body.name, screenPos.x + screenRadius + 5, screenPos.y + 4);
        }
      });

      // Draw Creation Drag Line (Slingshot)
      if (interactiveMode === 'create' && dragStart && currentMousePos) {
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.setLineDash([5, 5]);
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw predicted direction (opposite to drag)
        const dx = dragStart.x - currentMousePos.x;
        const dy = dragStart.y - currentMousePos.y;
        
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // Red for velocity vector
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(dragStart.x + dx, dragStart.y + dy);
        ctx.stroke();
      }
    };

    const animId = requestAnimationFrame(render);
    return () => {
        cancelAnimationFrame(animId);
        resizeObserver.disconnect();
    };
  }, [bodies, viewport, dragStart, currentMousePos, interactiveMode, worldToScreen]);

  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (interactiveMode === 'create') {
        setDragStart({ x, y });
        setCurrentMousePos({ x, y });
    } else {
        setIsPanning(true);
        setLastPanPos({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (interactiveMode === 'create' && dragStart) {
        setCurrentMousePos({ x, y });
    } else if (isPanning && lastPanPos) {
        const dx = x - lastPanPos.x;
        const dy = y - lastPanPos.y;
        setViewport({
            ...viewport,
            x: viewport.x + dx,
            y: viewport.y + dy
        });
        setLastPanPos({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (interactiveMode === 'create' && dragStart && currentMousePos) {
        const startWorld = screenToWorld(dragStart.x, dragStart.y);
        // Velocity depends on drag distance. Dragging BACKWARDS (slingshot) creates forward velocity.
        // Screen coords drag vector
        const dragVector = { x: dragStart.x - currentMousePos.x, y: dragStart.y - currentMousePos.y };
        
        // Scale drag vector to world velocity (arbitrary factor for feel)
        const velocityScale = 0.05 / viewport.scale; 
        const velocity = { x: dragVector.x * velocityScale, y: dragVector.y * velocityScale };
        
        // The position is where we clicked initially
        onBodyDragEnd(startWorld, velocity);
        
        setDragStart(null);
        setCurrentMousePos(null);
    }
    setIsPanning(false);
    setLastPanPos(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomIntensity = 0.1;
    const delta = -Math.sign(e.deltaY);
    const scaleMultiplier = 1 + delta * zoomIntensity;
    
    // Zoom toward mouse pointer
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(0.1, Math.min(10, viewport.scale * scaleMultiplier));
    
    // Math to keep mouse over the same world point
    // world = (screen - view) / scale
    // newView = screen - world * newScale
    const worldX = (mouseX - viewport.x) / viewport.scale;
    const worldY = (mouseY - viewport.y) / viewport.scale;
    
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;

    setViewport({ x: newX, y: newY, scale: newScale });
  };

  return (
    <canvas 
        ref={canvasRef}
        className={`w-full h-full block ${interactiveMode === 'create' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
    />
  );
};

export default SpaceCanvas;
