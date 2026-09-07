import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const q = "transforming bike to boat";
  const prompt = `You are a movie expert. The user is describing a movie scene, plot, or character. Your job is to identify the most likely movie or TV show they are describing. 
1. Carefully analyze the description. Think about movies across all industries (Hollywood, Bollywood, etc.) that match the description. Output your step-by-step reasoning inside [ANALYSIS] brackets.
2. Finally, output ONLY the exact movie or TV show title inside [TITLE] brackets (e.g., [TITLE] Dhoom 3 [/TITLE]). If you can't guess it, output [TITLE] Unknown [/TITLE].

User description: ${q}`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log("Raw Response:");
    console.log(aiResponse.text);
    
    let fullText = aiResponse.text?.trim() || "Unknown";
    let movieTitle = "Unknown";
    const titleMatch = fullText.match(/\[TITLE\](.*?)\[\/TITLE\]/is);
    if (titleMatch) {
      movieTitle = titleMatch[1].trim();
    } else {
      movieTitle = fullText;
    }
    console.log("Extracted title:", movieTitle);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
