import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMenuItemDetails = async (itemName: string, ingredients: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a sophisticated and appetizing menu description (max 25 words) and a recommended drink pairing for a restaurant item.
      Item Name: ${itemName}
      Main Ingredients: ${ingredients}
      Language: Romanian`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Appetizing description in Romanian" },
            pairing: { type: Type.STRING, description: "Recommended drink pairing (wine, soft drink, cocktail)" }
          },
          required: ["description", "pairing"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      description: "Descriere indisponibila momentan.",
      pairing: "Intreaba ospatarul."
    };
  }
};

export const getAIPriceSuggestion = async (itemName: string, cost: number, category: string) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Act as a Restaurant Consultant. I have a menu item "${itemName}" (Category: ${category}) with a raw ingredient cost (COGS) of ${cost} RON.
            Suggest 3 pricing tiers: 
            1. Aggressive (Low margin, high volume, ~40% food cost)
            2. Balanced (Standard, ~30% food cost)
            3. Premium (High margin, ~20% food cost)
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        aggressive: { type: Type.NUMBER, description: "Price for aggressive strategy" },
                        balanced: { type: Type.NUMBER, description: "Price for balanced strategy" },
                        premium: { type: Type.NUMBER, description: "Price for premium strategy" },
                        reasoning: { type: Type.STRING, description: "Short explanation (max 15 words) in Romanian" }
                    },
                    required: ["aggressive", "balanced", "premium", "reasoning"]
                }
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Price Error:", error);
        // Fallback calculation
        return {
            aggressive: Math.ceil(cost / 0.45),
            balanced: Math.ceil(cost / 0.30),
            premium: Math.ceil(cost / 0.20),
            reasoning: "Calcul fallback standard (30% FC)."
        };
    }
};

export const getSommelierRecommendations = async (foodType: string, language: string = 'ro') => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Act as a professional Sommelier. The customer is eating "${foodType}". 
            Suggest 3 distinct beverage pairings (Wine, Beer, or Cocktail) suitable for this food.
            Language: ${language}.
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of drink type (e.g. Cabernet Sauvignon)" },
                                    reason: { type: Type.STRING, description: "Why it pairs well (max 10 words)" }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Sommelier Error:", error);
        return { recommendations: [] };
    }
};

export const generateFeedbackReply = async (rating: number, comment: string, customerName: string) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a polite and professional response to a restaurant review.
            Customer: ${customerName || 'Guest'}
            Rating: ${rating}/5
            Comment: "${comment}"
            
            If rating is low, apologize and offer a solution. If high, thank them warmly.
            Keep it under 50 words. Language: Romanian.`,
        });
        
        return response.text || "Va multumim pentru feedback!";
    } catch (error) {
        console.error("Gemini Feedback Error:", error);
        return "Va multumim pentru vizita!";
    }
};

export const getMenuEngineeringReport = async (items: any[]) => {
    try {
        const prompt = `
        Analyze this restaurant menu performance data (BCG Matrix):
        ${JSON.stringify(items.map(i => ({
            name: i.name,
            category: i.category, // Star, Plowhorse, Puzzle, Dog
            margin: i.marginPercent,
            popularity: i.popularity,
            price: i.revenue / (i.qty || 1)
        })).slice(0, 15))}

        Act as a Senior Menu Engineer. Provide a strategic report in JSON format with:
        1. "summary": General health of the menu (1 sentence).
        2. "actions": An array of specific actionable advice (e.g., "Increase price of Burger by 2 RON", "Remove Salad").
        3. "starStrategy": How to leverage Stars.
        4. "dogStrategy": What to do with Dogs.
        
        Language: Romanian.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        starStrategy: { type: Type.STRING },
                        dogStrategy: { type: Type.STRING }
                    }
                }
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Analysis Error", error);
        return null;
    }
};