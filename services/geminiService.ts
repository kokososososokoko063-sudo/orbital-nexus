import { GoogleGenAI, Type } from "@google/genai";
import { CelestialBody } from '../types';
import { COLORS } from '../constants';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found in environment variables");
    return new GoogleGenAI({ apiKey });
};

export const generateScenario = async (prompt: string, currentViewport: { w: number, h: number }): Promise<Partial<CelestialBody>[]> => {
    const ai = getClient();
    
    const systemInstruction = `
    You are a physics engine configuration assistant. 
    You generate arrays of celestial bodies for a 2D gravity simulation.
    The simulation center is (0,0). Screen width is roughly ${currentViewport.w}, height ${currentViewport.h}.
    Masses typically range from 10 to 5000.
    Velocities typically range from -5 to 5.
    Positions should be within the viewable area generally, but can be outside for comets etc.
    Return JSON only.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        mass: { type: Type.NUMBER },
                        position: { 
                            type: Type.OBJECT, 
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
                            }
                        },
                        velocity: {
                            type: Type.OBJECT, 
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER }
                            }
                        },
                        name: { type: Type.STRING },
                        color: { type: Type.STRING },
                        isLocked: { type: Type.BOOLEAN }
                    },
                    required: ["mass", "position", "velocity", "name"]
                }
            }
        }
    });

    const text = response.text;
    if (!text) return [];

    try {
        const rawData = JSON.parse(text);
        // Map raw data to ensure it fits our CelestialBody shape with defaults
        return rawData.map((item: any) => ({
            ...item,
            radius: Math.sqrt(item.mass) * 0.5, // Heuristic radius based on mass
            trail: [],
            id: crypto.randomUUID(),
            color: item.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    } catch (e) {
        console.error("Failed to parse Gemini response", e);
        return [];
    }
};

export const explainSimulation = async (bodies: CelestialBody[]): Promise<string> => {
    const ai = getClient();
    
    // Simplify data for the prompt to save tokens
    const simpleBodies = bodies.map(b => ({
        name: b.name || 'Unknown',
        mass: b.mass.toFixed(1),
        pos: `(${b.position.x.toFixed(0)}, ${b.position.y.toFixed(0)})`,
        vel: `(${b.velocity.x.toFixed(2)}, ${b.velocity.y.toFixed(2)})`
    }));

    const prompt = `Analyze this N-body simulation state and describe what is happening in a creative, sci-fi tone. 
    Are there stable orbits? Is it chaotic? Is anything about to collide or get ejected?
    Bodies: ${JSON.stringify(simpleBodies)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || "Analysis failed.";
};
