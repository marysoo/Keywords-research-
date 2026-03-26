import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// Try to get key from build-time env or localStorage
const getInitialKey = () => {
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) return savedKey;
  }
  return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
};

let currentApiKey = getInitialKey();

const getAI = () => {
  const key = getInitialKey();
  if (!key || key === "undefined" || key === "null" || key === "") {
    throw new Error("Gemini API Key is missing. Please set it in Settings or environment variables.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const setDynamicApiKey = (key: string) => {
  currentApiKey = key;
  if (typeof window !== 'undefined') {
    localStorage.setItem('GEMINI_API_KEY', key);
  }
};

export const getApiKey = () => currentApiKey;

export const isApiKeyMissing = () => {
  const key = currentApiKey;
  return !key || key === "undefined" || key === "null" || key === "";
};

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
  topLocations: { location: string; volume: number }[];
  highestSearchMonth: { month: string; volume: number };
  relatedKeywords: { keyword: string; volume: number; competition?: 'Low' | 'Medium' | 'High' }[];
  platformUsage: {
    youtube: number; // 0-100 score or percentage
    pinterest: number;
    tiktok: number;
  };
  alternativeKeywords: { keyword: string; volume: number; competition: 'Low' | 'Medium' | 'High'; reason: string }[];
  summary: string;
  isEstimated?: boolean;
}

export async function getKeywordInsights(keyword: string, location: string = "Global"): Promise<KeywordData> {
  const ai = getAI();
  const prompt = `Analyze the keyword "${keyword}" specifically for the location: "${location}" and provide detailed search insights. 
    Include:
    1. Estimated monthly search volumes for the last 12 months.
    2. The geographic location where this keyword is searched most.
    3. A list of the top 5-8 countries or specific locations where this keyword has the highest search volume, including their estimated monthly volumes.
    4. The month with the highest search volume.
    5. A list of 5-8 related keywords with their estimated monthly volumes and competition level (Low, Medium, or High).
    6. Platform usage intensity (0-100 score) for YouTube, Pinterest, and TikTok.
    7. A list of 4-6 alternative or complementary keywords that are related but offer a different angle. 
       CRITICAL: Only suggest keywords that have LOW competition and HIGH search volume.
       For each, provide the keyword, estimated monthly volume, competition level, and a brief reason why it is a good alternative.
    8. A brief summary of the keyword's current trend.
    
    Provide the data in a structured format.`;

  const config = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
        topLocations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              volume: { type: Type.NUMBER }
            },
            required: ["location", "volume"]
          }
        },
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
        alternativeKeywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              volume: { type: Type.NUMBER },
              competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              reason: { type: Type.STRING }
            },
            required: ["keyword", "volume", "competition", "reason"]
          }
        },
        summary: { type: Type.STRING }
      },
      required: ["keyword", "monthlySearches", "topLocation", "topLocations", "highestSearchMonth", "relatedKeywords", "platformUsage", "alternativeKeywords", "summary"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: config
    });
    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    const errMsg = err.message || String(err);
    // If it's a paid feature error, try without Google Search
    if (
      errMsg.includes("Grounding with Google Search") || 
      errMsg.includes("paid project") || 
      errMsg.includes("billing") ||
      errMsg.includes("403") ||
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("not enabled")
    ) {
      console.warn("Google Search grounding failed (likely a free key). Falling back to base model.");
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt + "\nNote: Use your internal knowledge to estimate search volumes as real-time search is unavailable.",
        config: { ...config, tools: [] }
      });
      const data = JSON.parse(fallbackResponse.text || "{}");
      data.isEstimated = true; // Mark as estimated
      return data;
    }
    throw err;
  }
}

export async function getTrendingKeywords(location: string): Promise<TrendingKeyword[]> {
  const ai = getAI();
  const prompt = `Identify the top 5-7 trending or high-ranking keywords specifically in the location: "${location}". 
    For each keyword, provide:
    1. The keyword itself.
    2. Estimated current monthly search volume.
    3. Competition level (Low, Medium, or High).
    4. A few related keywords.
    5. A brief reason why it is trending in this location.
    
    Provide the data in a structured format.`;

  const config = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: config
    });
    return JSON.parse(response.text || "[]");
  } catch (err: any) {
    const errMsg = err.message || String(err);
    if (
      errMsg.includes("Grounding with Google Search") || 
      errMsg.includes("paid project") || 
      errMsg.includes("billing") ||
      errMsg.includes("403") ||
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("not enabled")
    ) {
      console.warn("Google Search grounding failed (likely a free key). Falling back to base model.");
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt + "\nNote: Use your internal knowledge to estimate trending keywords as real-time search is unavailable.",
        config: { ...config, tools: [] }
      });
      return JSON.parse(fallbackResponse.text || "[]");
    }
    throw err;
  }
}

export async function getYouTubeNicheKeywords(niche: string): Promise<YouTubeKeyword[]> {
  const ai = getAI();
  const prompt = `Identify the top 10 "hot" or high-potential keywords specifically for YouTube creators in the niche: "${niche}". 
    For each keyword, provide:
    1. The keyword itself.
    2. Estimated monthly search volume on YouTube.
    3. Competition level (Low, Medium, or High).
    4. Growth potential (e.g., "Viral Potential", "Evergreen", "High Growth").
    5. 3 specific video title ideas for this keyword.
    
    Provide the data in a structured format.`;

  const config = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: config
    });
    return JSON.parse(response.text || "[]");
  } catch (err: any) {
    const errMsg = err.message || String(err);
    if (
      errMsg.includes("Grounding with Google Search") || 
      errMsg.includes("paid project") || 
      errMsg.includes("billing") ||
      errMsg.includes("403") ||
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("not enabled")
    ) {
      console.warn("Google Search grounding failed (likely a free key). Falling back to base model.");
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt + "\nNote: Use your internal knowledge to estimate YouTube search volumes as real-time search is unavailable.",
        config: { ...config, tools: [] }
      });
      return JSON.parse(fallbackResponse.text || "[]");
    }
    throw err;
  }
}
