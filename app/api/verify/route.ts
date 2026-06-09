import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Missing image cargo in request body." }, { status: 400 });
    }

    // Standardize base64 format (removing prefix if user sends it)
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Clean,
      },
    };

    const promptText = `
      You are an automated premium AI identity assurance and compliance agent specialized in travel document verification.
      Perform a deep, exact verification of the uploaded identity photograph in compliance with official ICAO Doc 9303 standards (machine-readable passport specifications).

      Check the following specifications meticulously:
      1. Background: Plain, neutral, off-white or light gray, with absolutely no shadows, patterns, or objects.
      2. Pose & Alignment: Head straight (no tilt/yaw/roll), centered perfectly, eyes level, direct gaze to camera. Head occupying 70-80% of vertical height.
      3. Expression: Neutral expression, mouth closed, no smiling/frowning/open mouth.
      4. Eyes & Glasses: Eyes open, fully visible, looking straight. No reflections on glasses, no thick frames covering pupils, no hair obstructing eyes.
      5. Lighting & Shadows: Even lighting, no flash reflections, no dark shadows under chin, nose, or background.
      6. Style & Quality: Perfect focus, crisp sharpness, natural skin colors, no pixelation or artifacts.

      Also estimated landmark percentages from top-left (0 to 100 on X and Y axes) so we can place compliance targeting boxes in our web interface. Provide realistic bounding boxes if a face is detected.

      Explain any compliance issues constructively, just like a passport officer or security systems manager would.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligible: {
              type: Type.BOOLEAN,
              description: "True if the photograph is compliant on all mandatory items; false if there are any critical defects."
            },
            overallScore: {
              type: Type.INTEGER,
              description: "Calculated ICAO Doc 9303 compliance score (0 to 100)."
            },
            rejectionReasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Detailed, actionable bullet points if photo is rejected or warned."
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                background: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    color: { type: Type.STRING, description: "Description or color of the background." },
                    uniformityScore: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Feedback on shadows or patterns." }
                  },
                  required: ["passed", "color", "uniformityScore", "feedback"]
                },
                poseAndAlignment: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    centeringScore: { type: Type.INTEGER },
                    rotationScore: { type: Type.INTEGER, description: "Score representing face alignment without tilt or rotation." },
                    eyeLevelScore: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Check on head tilt, rotation, and proportional size/fitting." }
                  },
                  required: ["passed", "centeringScore", "rotationScore", "eyeLevelScore", "feedback"]
                },
                expression: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    neutralExpressionScore: { type: Type.INTEGER },
                    mouthClosed: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING, description: "Feedback on smiling, neutral state, mouth level compliance." }
                  },
                  required: ["passed", "neutralExpressionScore", "mouthClosed", "feedback"]
                },
                eyesAndGlasses: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    eyesOpenScore: { type: Type.INTEGER },
                    glassesIssues: { type: Type.STRING },
                    feedback: { type: Type.STRING, description: "Obstruction checks, reflections, frame cover, or iris blockage." }
                  },
                  required: ["passed", "eyesOpenScore", "glassesIssues", "feedback"]
                },
                lightingAndShadows: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    shadowsScore: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Feedback on flash hot-spots, uneven lighting, skin color naturalness." }
                  },
                  required: ["passed", "shadowsScore", "feedback"]
                },
                imageQuality: {
                  type: Type.OBJECT,
                  properties: {
                    passed: { type: Type.BOOLEAN },
                    blurScore: { type: Type.INTEGER },
                    contrastScore: { type: Type.INTEGER },
                    feedback: { type: Type.STRING, description: "Feedback on resolution, pixelation, motion blur, or noise." }
                  },
                  required: ["passed", "blurScore", "contrastScore", "feedback"]
                }
              },
              required: ["background", "poseAndAlignment", "expression", "eyesAndGlasses", "lightingAndShadows", "imageQuality"]
            },
            landmarksPercent: {
              type: Type.OBJECT,
              properties: {
                eyeLeft: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Left eye center [X, Y] (0 to 100)." },
                eyeRight: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Right eye center [X, Y] (0 to 100)." },
                noseTip: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Nose tip spot [X, Y] (0 to 100)." },
                mouthCenter: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Mouth center line [X, Y] (0 to 100)." },
                chinBottom: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Lowest central chin point [X, Y] (0 to 100)." },
                crownTop: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Top outer edge of the head (crown) [X, Y] (0 to 100)." },
                faceRect: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Bounding rectangle X, Y, Width, Height in decimals of 0-100 (e.g. [20.5, 15.0, 55.0, 68.0])" }
              },
              required: ["eyeLeft", "eyeRight", "noseTip", "mouthCenter", "chinBottom", "crownTop", "faceRect"]
            }
          },
          required: ["eligible", "overallScore", "rejectionReasons", "analysis", "landmarksPercent"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return NextResponse.json({ success: true, report: parsedData });
  } catch (error: any) {
    console.error("ICAO verification handler error:", error);
    return NextResponse.json({ success: false, error: error.message || "An error occurred during ICAO compliance analysis." }, { status: 500 });
  }
}
