export interface Vector2 {
  x: number;
  y: number;
}

export interface CelestialBody {
  id: string;
  mass: number;
  radius: number;
  position: Vector2;
  velocity: Vector2;
  color: string;
  trail: Vector2[];
  isLocked?: boolean; // If true, unaffected by gravity (e.g. fixed sun)
  name?: string;
}

export enum SimulationState {
  PAUSED,
  RUNNING
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface PhysicsConfig {
  gravitationalConstant: number;
  timeStep: number;
  trailLength: number;
  elasticity: number; // 0 to 1, for collisions
}
