import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { selfie, document } = await req.json();

    if (!selfie || !document) {
      return NextResponse.json(
        { error: "Biometric matching requires both a live selfie and an identity document image." },
        { status: 400 }
      );
    }

    // Clean base64 formats
    const cleanSelfie = selfie.replace(/^data:image\/\w+;base64,/, "");
    const cleanDoc = document.replace(/^data:image\/\w+;base64,/, "");

    const parts = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanSelfie,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanDoc,
        },
      },
      {
        text: `
          You are an advanced biometric facial recognition validator.
          Analyze these two photographs:
          1. The primary image is a live selfie (webcam snapshot).
          2. The second image is the facial crop from an identity document (Passport, Emirates ID, Driver License, etc.).

          Execute a formal facial biometric comparisons and structural analysis:
          - Examine facial geometry landmarks: eye distance (interpupillary ratio), nasal ridge structure, forehead width, jawline taper, lip margin heights, and cheekbone projection.
          - Account for potential differences due to aging, camera focal length distortion, expressions, or makeup.
          - Determine if they are the same individual.
          - Perform a basic digital anti-spoofing audit: look for evidence of printed paper re-photography, digital screens, masks, or extreme glare.
          - Return a secure structured validation response using the requested schema.
        `,
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matched: {
              type: Type.BOOLEAN,
              description: "Whether the biometric features align sufficiently to confirm they represent the same individual."
            },
            similarityScore: {
              type: Type.INTEGER,
              description: "Facial similarity likeness percentage (0 to 100)."
            },
            confidenceLevel: {
              type: Type.STRING,
              description: "Confidence interval of matching algorithm: HIGH, MEDIUM, or LOW."
            },
            verdict: {
              type: Type.STRING,
              description: "Verification status. E.g., 'VERIFIED' (pass), 'MISMATCH' (fail, different face), or 'SUSPICIOUS' (liveness failed, potential forgery)."
            },
            landmarkMatching: {
              type: Type.OBJECT,
              properties: {
                eyes: {
                  type: Type.OBJECT,
                  properties: {
                    similarity: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Comparison details of orbital margins and interpupillary distance." }
                  },
                  required: ["similarity", "feedback"]
                },
                nose: {
                  type: Type.OBJECT,
                  properties: {
                    similarity: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Comparison details of nasal tip, nostrils alignment and ridge shape." }
                  },
                  required: ["similarity", "feedback"]
                },
                faceShape: {
                  type: Type.OBJECT,
                  properties: {
                    similarity: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Comparison of cheek bones, jaw contour, chin shape, and facial proportions." }
                  },
                  required: ["similarity", "feedback"]
                },
                mouthAndJaw: {
                  type: Type.OBJECT,
                  properties: {
                    similarity: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Comparison of lip thickness, lip margins, oral alignment, and jaw curve." }
                  },
                  required: ["similarity", "feedback"]
                }
              },
              required: ["eyes", "nose", "faceShape", "mouthAndJaw"]
            },
            antiSpoofingAudit: {
              type: Type.OBJECT,
              properties: {
                isSpoofingDetected: { type: Type.BOOLEAN, description: "True if suspicious markers are found (screen edges, print textures, paper reflections)." },
                livenessIndicators: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Features supporting a live, 3D person capture (natural facial contours, active lighting reflections, eyelid structure)."
                },
                assessment: { type: Type.STRING, description: "Concise analysis of security and anti-spoofing markers." }
              },
              required: ["isSpoofingDetected", "livenessIndicators", "assessment"]
            },
            rejectionReasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "If there is a mismatch or anti-spoofing alarm, list structural points of failure."
            }
          },
          required: ["matched", "similarityScore", "confidenceLevel", "verdict", "landmarkMatching", "antiSpoofingAudit", "rejectionReasons"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return NextResponse.json({ success: true, matchReport: parsedData });
  } catch (error: any) {
    console.error("Facial similarity matching handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred during facial biometric matching." },
      { status: 500 }
    );
  }
}
