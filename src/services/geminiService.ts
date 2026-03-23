import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const isApiKeyMissing = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "undefined";

export interface YouTubeKeyword {
  keyword: string;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High';
  potential: string; // e.g., "High Growth", "Evergreen", "Viral Potential"
  videoIdeas: string[];
}

export interface TrendingKeyword {
  keyword: string;
  volume: number;
  competition: 'Low' | 'Medium' | 'High';
  relatedKeywords: string[];
  reason: string;
}

export interface KeywordData {
  keyword: string;
  monthlySearches: { month: string; volume: number }[];
  topLocation: string;
  highestSearchMonth: { month: string; volume: number };
  relatedKeywords: { keyword: string; volume: number; competition?: 'Low' | 'Medium' | 'High' }[];
  platformUsage: {
    youtube: number; // 0-100 score or percentage
    pinterest: number;
    tiktok: number;
  };
  summary: string;
}

export async function getKeywordInsights(keyword: string): Promise<KeywordData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the keyword "${keyword}" and provide detailed search insights. 
    Include:
    1. Estimated monthly search volumes for the last 12 months.
    2. The geographic location where this keyword is searched most.
    3. The month with the highest search volume.
    4. A list of 5-8 related keywords with their estimated monthly volumes and competition level (Low, Medium, or High).
    5. Platform usage intensity (0-100 score) for YouTube, Pinterest, and TikTok.
    6. A brief summary of the keyword's current trend.
    
    Provide the data in a structured format.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          monthlySearches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                volume: { type: Type.NUMBER }
              },
              required: ["month", "volume"]
            }
          },
          topLocation: { type: Type.STRING },
          highestSearchMonth: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING },
              volume: { type: Type.NUMBER }
            },
            required: ["month", "volume"]
          },
          relatedKeywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                volume: { type: Type.NUMBER },
                competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
              },
              required: ["keyword", "volume", "competition"]
            }
          },
          platformUsage: {
            type: Type.OBJECT,
            properties: {
              youtube: { type: Type.NUMBER, description: "Popularity score 0-100" },
              pinterest: { type: Type.NUMBER, description: "Popularity score 0-100" },
              tiktok: { type: Type.NUMBER, description: "Popularity score 0-100" }
            },
            required: ["youtube", "pinterest", "tiktok"]
          },
          summary: { type: Type.STRING }
        },
        required: ["keyword", "monthlySearches", "topLocation", "highestSearchMonth", "relatedKeywords", "platformUsage", "summary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to fetch keyword insights. Please try again.");
  }
}

export async function getTrendingKeywords(location: string): Promise<TrendingKeyword[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify the top 5-7 trending or high-ranking keywords specifically in the location: "${location}". 
    For each keyword, provide:
    1. The keyword itself.
    2. Estimated current monthly search volume.
    3. Competition level (Low, Medium, or High).
    4. A few related keywords.
    5. A brief reason why it is trending in this location.
    
    Provide the data in a structured format.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            volume: { type: Type.NUMBER },
            competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            relatedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            reason: { type: Type.STRING }
          },
          required: ["keyword", "volume", "competition", "relatedKeywords", "reason"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to fetch trending keywords. Please try again.");
  }
}

export async function getYouTubeNicheKeywords(niche: string): Promise<YouTubeKeyword[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Identify the top 10 "hot" or high-potential keywords specifically for YouTube creators in the niche: "${niche}". 
    For each keyword, provide:
    1. The keyword itself.
    2. Estimated monthly search volume on YouTube.
    3. Competition level (Low, Medium, or High).
    4. Growth potential (e.g., "Viral Potential", "Evergreen", "High Growth").
    5. 3 specific video title ideas for this keyword.
    
    Provide the data in a structured format.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            searchVolume: { type: Type.NUMBER },
            competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            potential: { type: Type.STRING },
            videoIdeas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["keyword", "searchVolume", "competition", "potential", "videoIdeas"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to fetch YouTube keywords. Please try again.");
  }
}
