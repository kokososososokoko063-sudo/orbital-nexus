import { CelestialBody, Vector2, PhysicsConfig } from '../types';

export const addVectors = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const subVectors = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const scaleVector = (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s });
export const magnitude = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const normalize = (v: Vector2): Vector2 => {
  const m = magnitude(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};
export const distance = (v1: Vector2, v2: Vector2): number => magnitude(subVectors(v1, v2));

export const updatePhysics = (bodies: CelestialBody[], config: PhysicsConfig): CelestialBody[] => {
  const { gravitationalConstant, timeStep, trailLength } = config;

  // 1. Calculate Forces
  const forces = bodies.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bodyA = bodies[i];
      const bodyB = bodies[j];

      const diff = subVectors(bodyB.position, bodyA.position);
      const dist = magnitude(diff);
      
      // Softening parameter to prevent division by zero and extreme flings at very close range
      const softening = 5.0; 
      const distSq = dist * dist + softening * softening;

      const fMagnitude = (gravitationalConstant * bodyA.mass * bodyB.mass) / distSq;
      const fDir = normalize(diff);

      const fVector = scaleVector(fDir, fMagnitude);

      forces[i] = addVectors(forces[i], fVector);
      forces[j] = subVectors(forces[j], fVector); // Newton's 3rd Law
    }
  }

  // 2. Update Position & Velocity
  const nextBodies = bodies.map((body, index) => {
    if (body.isLocked) return body;

    const force = forces[index];
    const acceleration = scaleVector(force, 1 / body.mass);
    
    const newVelocity = addVectors(body.velocity, scaleVector(acceleration, timeStep));
    const newPosition = addVectors(body.position, scaleVector(newVelocity, timeStep));

    // Update trail
    let newTrail = body.trail;
    // Only add trail point every few frames or if moved significantly to save memory/rendering
    // For simplicity here, we add every frame but shift out old ones.
    // Optimization: Add point only if dist > X from last point
    const lastPoint = body.trail.length > 0 ? body.trail[body.trail.length - 1] : null;
    if (!lastPoint || distance(lastPoint, newPosition) > 2) {
       newTrail = [...body.trail, newPosition];
       if (newTrail.length > trailLength) {
         newTrail = newTrail.slice(newTrail.length - trailLength);
       }
    }

    return {
      ...body,
      velocity: newVelocity,
      position: newPosition,
      trail: newTrail
    };
  });

  // 3. Collision Detection (Simple merge or bounce)
  // For this demo, let's just do a simple merge if they get too close, 
  // or maybe just ignore it to prevent the system from emptying too fast. 
  // Let's implement a "bounce" for fun visual chaos? No, space usually merges. 
  // We will SKIP collision for now to keep the simulation stable for the user.
  
  return nextBodies;
};
