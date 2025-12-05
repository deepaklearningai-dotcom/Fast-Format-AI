import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types.ts";

const TEXT_MODEL_NAME = 'gemini-flash-lite-latest';
const AUDIO_MODEL_NAME = 'gemini-2.5-flash-preview-tts';

// Safe initializer to prevent crash if env is missing
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanJson = (text: string): string => {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

export const generateRewrites = async (text: string): Promise<TranslationResult> => {
  try {
    const ai = getAIClient();
    
    console.log("Generating rewrites for:", text.substring(0, 50) + "...");

    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `You are an expert content rewriter. Rewrite the following text into 3 distinct formats.
      
      Input text: "${text}"
      
      Provide 3 versions:
      1. email: Professional, polite, and suitable for formal communication.
      2. sms: Concise, direct, and short (under 160 chars ideally).
      3. whatsapp: Casual, friendly, and using appropriate emojis.
      
      Output MUST be valid raw JSON only. Do not wrap in markdown.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: {
              type: Type.STRING,
              description: "Formal email version",
            },
            sms: {
              type: Type.STRING,
              description: "Short SMS version",
            },
            whatsapp: {
              type: Type.STRING,
              description: "Casual WhatsApp version with emojis",
            },
          },
          required: ["email", "sms", "whatsapp"],
        },
      },
    });

    if (response.text) {
      console.log("Raw AI Response:", response.text);
      try {
        const cleanedText = cleanJson(response.text);
        return JSON.parse(cleanedText) as TranslationResult;
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Response text:", response.text);
        throw new Error("Failed to parse AI response. Please try again.");
      }
    }
    
    throw new Error("No response text received from Gemini");

  } catch (error) {
    console.error("Rewrite error:", error);
    throw error;
  }
};

export const generateAudio = async (text: string): Promise<string> => {
  try {
    const ai = getAIClient();
    
    console.log("Generating audio for:", text.substring(0, 50) + "...");

    const response = await ai.models.generateContent({
      model: AUDIO_MODEL_NAME,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    // Convert PCM to WAV for browser playback/download
    return createWavUrl(base64Audio);

  } catch (error) {
    console.error("Audio generation error:", error);
    throw error;
  }
};

// Helper to convert PCM raw data to a WAV file Blob URL
const createWavUrl = (base64Audio: string): string => {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // WAV Header constants for 24kHz, 16-bit, Mono (standard for this model)
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true); // ChunkSize
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, len, true); // Subchunk2Size

  const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};