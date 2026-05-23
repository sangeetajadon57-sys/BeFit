import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for photo scans (base64)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Enable full CORS for APK integration and local development
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  // Handle preflight options requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", keyConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" });
});

// API 1: Food Scanner Analyze API
app.post("/api/analyze-food", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image base64 data." });
    }

    const ai = getGeminiClient();

    // Strip out potential metadata prefix like "data:image/jpeg;base64,"
    let cleanBase64 = image;
    let actualMimeType = mimeType || "image/jpeg";
    
    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const mimePart = parts[0];
      cleanBase64 = parts[1];
      if (mimePart.startsWith("data:")) {
        actualMimeType = mimePart.substring(5);
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: actualMimeType,
        data: cleanBase64,
      },
    };

    const promptText = `Analyze this image to detect if it contains listable food items, meals, solid/liquid nutrition, raw ingredients, or restaurant dishes.
If the image is NOT food or drink (e.g., text, documents, animals, clothes, screenshots of apps, landscape, a car, or faces with no food visible), set isFood: false with an appropriate explanation in rejectedReason. Be strictly helpful but clear.

If it is food, provide an incredibly accurate, perfect, and comprehensive nutritional breakdown:
1. Estimate calories, protein (g), carbs (g), and fat (g) precisely matching the exact physical portion size and quantity visible in the image.
2. In 'quantityAnalysis', analyze the exact quantity visible in the photo (e.g., counting items, judging relative plate scale, checking bowl depth) and explicitly mention it in your explanation (e.g., 'We analyzed the image and identified exactly 1 medium-sized red apple of about 150g' or 'We detected exactly two whole fried eggs side-by-side on the plate, totaling around 110g...').
3. Detail all relevant vitamins, minerals, and other critical nutrients (like Dietary Fiber, Sodium, Sugar, Iron, Calcium, Zinc, Vitamin A/C/D/B-complex) in 'microNutrients'. Calibrate their amounts specifically to the quantity of food visible in the image.

Formulate instructions in clear, positive, and wellness-focused language.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFood: { type: Type.BOOLEAN, description: "True if food, ingredients, or meals are visible; false otherwise." },
            rejectedReason: { type: Type.STRING, description: "Detailed polite explanation if isFood is false." },
            detectedFoodName: { type: Type.STRING, description: "General or specific name of the meal/food." },
            calories: { type: Type.INTEGER, description: "Estimated calories in kcal." },
            protein: { type: Type.NUMBER, description: "Estimated protein in grams." },
            carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams." },
            fat: { type: Type.NUMBER, description: "Estimated fat in grams." },
            portionEstimate: { type: Type.STRING, description: "Visual portion size, e.g., '1 average plate', 'about 150g', '2 slices'." },
            confidenceScore: { type: Type.INTEGER, description: "Prediction confidence percentage, e.g. 85." },
            quantityAnalysis: { type: Type.STRING, description: "Analysis explaining how the portion and exact quantity in the image was identified and what visual elements were used to calculate it." },
            microNutrients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the nutrient (e.g. Vitamin C, Vitamin A, Calcium, Iron, Dietary Fiber, Sodium, Potassium, Sugar, Vitamin B12, Zinc)." },
                  value: { type: Type.STRING, description: "Estimated nutrient value with units (e.g., '15mg', '4.2g', '350mg', '12mcg')." },
                  category: { type: Type.STRING, description: "The category level. Must be one of: 'vitamin', 'mineral', or 'other'." }
                },
                required: ["name", "value", "category"]
              },
              description: "Array of all estimated vitamins, minerals and core nutrients found in this portion."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Up to 3 variations, adjustments, or alternative names for manual choice."
            }
          },
          required: ["isFood"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI engine.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Error analyzing food image:", error);
    return res.status(500).json({ 
      error: "Failed to scan image.", 
      message: error.message || "An unexpected error occurred during analysis." 
    });
  }
});

// API 2: Fitness AI Chat Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userProfile, currentMetrics } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing conversation messages stream." });
    }

    const ai = getGeminiClient();

    // Prepare a descriptive system prompt incorporating context about user metrics if supplied
    let contextStr = "The user has not calculated metrics yet.";
    if (userProfile) {
      contextStr = `The user's profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm (${(userProfile.height / 2.54).toFixed(1)} inches)
- Weight: ${userProfile.weight} kg (${(userProfile.weight * 2.20462).toFixed(1)} lbs)
- Unit system preference: ${userProfile.unitSystem}`;

      if (userProfile.waist) {
        contextStr += `\n- Waist: ${userProfile.waist} cm`;
      }
      contextStr += `\n- Goal: ${userProfile.goal}\n- Activity: ${userProfile.activityLevel}`;
    }

    if (currentMetrics) {
      contextStr += `\n\nLatest Calculated Metrics:
- BMI: ${currentMetrics.bmi?.value} (${currentMetrics.bmi?.category})
- Body Fat %: ${currentMetrics.bodyFat ? `${currentMetrics.bodyFat.value}% (${currentMetrics.bodyFat.category})` : 'Not entered'}
- BMR: ${currentMetrics.bmr?.value} kcal/day (Basal metabolic energy needs)
- TDEE: ${currentMetrics.tdee?.value} kcal/day (Estimated calorie intake for custom level)
- Healthy Weight Range: ${currentMetrics.healthyWeightRange?.min} - ${currentMetrics.healthyWeightRange?.max} ${currentMetrics.healthyWeightRange?.unit}`;
      
      if (currentMetrics.waistToHeight) {
        contextStr += `\n- Waist-to-Height Ratio: ${currentMetrics.waistToHeight.value} (${currentMetrics.waistToHeight.category})`;
      }
    }

    const systemInstruction = `You are "Be Fit AI Coach", a supportive, certified fitness specialist, and wellness guide.
Your purpose is to explain fitness metrics, suggest healthier habits, answer general health queries, and explain charts simply.

Guidelines:
1. Speak in friendly, encouraging, and respectful language. Keep descriptions highly readable (use bold text, bullet points).
2. Focus strictly on holistic wellness metrics—do not promote extreme calorie reductions, crash diets, or obsessive appearance goals. Recommend sustainable fitness, hydration, lean nutrition, movement variety, and good sleep.
3. Be transparent that these are estimates. ALWAYS include this supportive disclaimer softly at the end: "Disclaimer: This feedback represents general wellness suggestions and is not a medical diagnosis. Please consult a health practitioner for serious health changes."
4. If the user asks a fully unrelated, non-fitness, or non-medical question (e.g. coding or writing a joke), politely redirect them back to health, fitness, or diet: "As your Be Fit AI Coach, I specialize in fitness, nutrition, and wellness. Let gets back to your health goals!"

User Context:
${contextStr}`;

    // Reconstruct the chat context with the proper system instruction
    const recentMessage = messages[messages.length - 1];
    
    // Map previous messages to Gemini Chat format if required, or keep it as a straightforward chat
    // For simplicity, we can pass context as a systemInstruction on generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: recentMessage.text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({ text: response.text });

  } catch (error: any) {
    console.error("AI Coach assistant error:", error);
    return res.status(500).json({ 
      error: "Chat assistant lookup failed.",
      message: error.message || "Could not reach the AI Coach right now."
    });
  }
});

// Serve frontend assets in dev/production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback catch-all for API dev routing
  app.use((req, res, next) => {
    if (req.url.startsWith("/api/")) {
      res.status(404).json({ error: "Endpoint not found." });
    } else {
      next();
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
