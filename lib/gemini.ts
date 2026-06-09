import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export const getAI = (): GoogleGenAI => {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    _ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _ai;
};
