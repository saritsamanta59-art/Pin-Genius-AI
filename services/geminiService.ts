import { GoogleGenAI, Type } from "@google/genai";
import { PinVariation } from "../types";

// Always initialize GoogleGenAI with a named parameter for apiKey using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePinVariations = async (keyword: string): Promise<{ variations: PinVariation[], gradientColors: string[] }> => {
  const textPrompt = `
    Act as a Pinterest Marketing Expert. 
    Context: User wants pins for the keyword "${keyword}".
    
    Task: 
    1. Generate 5 DISTINCT variations. 
    2. For EACH variation, provide:
       - A unique, specific image generation prompt describing a background relevant to that specific angle (style: vertical, high quality, photorealistic).
       - A viral headline (max 10 words).
       - A unique Pinterest SEO Title.
       - A unique Description (approx 30 words).
       - 10 hashtags.
       - Suggested hex colors for "textColor" and "outlineColor".
    3. Suggest 2 hex colors for a fallback gradient.
  `;

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning and structured JSON output tasks
      model: "gemini-3-pro-preview",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  seoTitle: { type: Type.STRING },
                  seoDescription: { type: Type.STRING },
                  hashtags: { type: Type.STRING },
                  textColor: { type: Type.STRING },
                  outlineColor: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["headline", "seoTitle", "seoDescription", "hashtags", "textColor", "outlineColor", "imagePrompt"]
              }
            },
            gradientColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["variations", "gradientColors"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Text Generation Error:", error);
    throw new Error("Failed to generate pin variations.");
  }
};

export const generatePinImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4" 
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("The AI model returned no content. It may have been blocked by safety filters.");
    }

    const parts = candidate.content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No parts found in response candidate.");
    }

    // Loop through all parts to find the image data
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    // If no image but text is present, return the text as an error
    const textError = parts.filter(p => p.text).map(p => p.text).join(' ');
    if (textError) {
      throw new Error(`AI Model refused to generate image: ${textError}`);
    }
    
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};