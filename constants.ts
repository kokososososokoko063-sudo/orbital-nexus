import { PhysicsConfig } from './types';

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravitationalConstant: 0.5,
  timeStep: 0.5,
  trailLength: 200,
  elasticity: 0.8
};

export const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ffffff', // white
];

export const INITIAL_BODIES_COUNT = 3;
