import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";

const TEXT_MODEL_NAME = 'gemini-flash-lite-latest';
const AUDIO_MODEL_NAME = 'gemini-2.5-flash-preview-tts';

export const generateRewrites = async (text: string): Promise<TranslationResult> => {
  try {
    // Initialize inside the function to ensure process.env is ready
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `Rewrite the following text into 3 distinct formats based on the context provided below. 
      
      IMPORTANT: Do NOT translate the text. Keep it in the original language of the input.
      
      Input text: "${text}"
      
      Provide 3 versions:
      1. Email: Professional, polite, and suitable for formal communication.
      2. SMS: Concise, direct, and short.
      3. WhatsApp: Casual, friendly, and using appropriate emojis.
      
      Ensure the output is valid JSON.`,
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
      return JSON.parse(response.text) as TranslationResult;
    }
    
    throw new Error("No response text received from Gemini");

  } catch (error) {
    console.error("Rewrite error:", error);
    throw error;
  }
};

export const generateAudio = async (text: string): Promise<string> => {
  try {
    // Initialize inside the function to ensure process.env is ready
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
