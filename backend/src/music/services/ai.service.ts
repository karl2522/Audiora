import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { UserTasteProfile } from '../dto/history.dto';

// Define Zod Schema for robust validation
const AISessionSchema = z.object({
    vibe_description: z.string().describe("A short, engaging description of the vibe"),
    target_moods: z.array(z.string()).describe("List of target moods"),
    weights: z.object({
        genre_match: z.number().min(0).max(1).default(0.4),
        artist_match: z.number().min(0).max(1).default(0.3),
        mood_match: z.number().min(0).max(1).default(0.2),
        novelty: z.number().min(0).max(1).default(0.1),
    }),
    filters: z.object({
        exclude_genres: z.array(z.string()).default([]),
    }),
});

export type AIBSessionParameters = z.infer<typeof AISessionSchema>;

@Injectable()
export class AIService {
    private readonly logger = new Logger(AIService.name);
    private genAI: GoogleGenerativeAI;

    private readonly modelsToTry = [
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            console.log(`[AIService] Initializing with API Key: ${apiKey.substring(0, 4)}...`);
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else {
            console.error('[AIService] GEMINI_API_KEY not found. AI features will be disabled.');
        }
    }

    async getSessionParameters(
        profile: UserTasteProfile,
        context: string,
    ): Promise<AIBSessionParameters | null> {
        if (!this.genAI) {
            console.warn('[AIService] AI not initialized');
            return null;
        }

        console.log('[AIService] 🤖 Generating AI session parameters...');

        const prompt = `
      You are the "Brain" of the Audiora DJ.
      Your goal is to configure the music recommendation engine for a specific user session.
      
      CONTEXT: ${context}
      
      USER PROFILE:
      - Top Genres: ${profile.topGenres.join(', ')}
      - Top Artists: ${profile.topArtists.join(', ')}
      - Preferred Moods: ${profile.moodPreference.join(', ')}
      - Discovery Rate: ${profile.discoveryRate}
      
      TASK:
      Analyze this user and the current context. Define the optimal session parameters.
      
      OUTPUT JSON FORMAT:
      {
        "vibe_description": "A short, engaging description of the vibe (e.g., 'A focused flow for your morning')",
        "target_moods": ["Mood1", "Mood2"],
        "weights": {
          "genre_match": 0.1 to 0.9 (Standard: 0.4),
          "artist_match": 0.1 to 0.9 (Standard: 0.3),
          "mood_match": 0.1 to 0.9 (Standard: 0.2),
          "novelty": 0.1 to 0.9 (Standard: 0.1)
        },
        "filters": {
          "exclude_genres": ["GenreToExclude"]
        }
      }
      
      GUARDRAILS:
      - DO NOT select specific tracks.
      - DO NOT invent data.
      - Output ONLY valid JSON.
    `;

        try {
            const text = await this.generateWithFallback(prompt);

            if (!text) return null;

            console.log(`[AIService] 🤖 AI Response: ${text.substring(0, 100)}...`);

            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Parse and Validate with Zod
            const params = JSON.parse(jsonStr);
            const validatedParams = AISessionSchema.parse(params);

            return validatedParams;
        } catch (error: any) {
            console.error('[AIService] ❌ Failed to generate AI parameters (All models failed):', error.message);
            if (error instanceof z.ZodError) {
                console.error('[AIService] ❌ Validation Error:', error.issues);
            }
            return null; // Trigger fallback
        }
    }

    private async generateWithFallback(prompt: string): Promise<string | null> {
        for (let i = 0; i < this.modelsToTry.length; i++) {
            const modelName = this.modelsToTry[i];
            try {
                console.log(`[AIService] Trying model: ${modelName}...`);
                const model = this.genAI.getGenerativeModel({ model: modelName });

                // Retry logic for 429 errors within each model attempt
                const result = await this.retryOperation(async () => {
                    return await model.generateContent(prompt);
                }, 3); // Retry 3 times for the current model

                const response = await result.response;
                return response.text();
            } catch (error: any) {
                console.warn(`[AIService] Failed with ${modelName}: ${error.message}`);
                // If it's the last model and it failed, rethrow the error
                if (i === this.modelsToTry.length - 1) {
                    throw error;
                }
                // Otherwise, continue to the next model
                continue;
            }
        }
        // This line should theoretically not be reached if the last model throws an error
        // but it's good practice to have a fallback return
        return null;
    }

    private async retryOperation<T>(operation: () => Promise<T>, retries: number): Promise<T> {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`[AIService] Attempt ${i + 1}/${retries}...`);
                return await operation();
            } catch (error: any) {
                if (error.status === 429 && i < retries - 1) {
                    const delay = 2000 * (i + 1); // 2s, 4s, 6s
                    console.warn(`[AIService] Rate limited (429). Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded');
    }
}
