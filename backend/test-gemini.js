// Quick test script to verify Gemini API connection
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testGeminiConnection() {
  console.log("🔍 Testing Gemini API Connection...\n");

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    console.error("❌ ERROR: GEMINI_API_KEY is not configured properly!");
    console.error("   Current value:", apiKey || "undefined");
    process.exit(1);
  }

  console.log(
    "✅ API Key found:",
    apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4)
  );

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try models/gemini-pro (v1beta endpoint)
    const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });

    console.log(
      "\n📡 Sending test request to Gemini API (using models/gemini-pro)..."
    );

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Say 'Hello! API connection successful!' in exactly 5 words.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 50,
      },
    });

    const response = await result.response;
    const text = response.text();

    console.log("\n✅ SUCCESS! Gemini API is connected and working!");
    console.log("📝 Response:", text);
    console.log(
      "\n🎉 Your Gemini API key is properly configured and functional!"
    );
  } catch (error) {
    console.error("\n❌ ERROR: Failed to connect to Gemini API");
    console.error("Error details:", error.message);

    if (error.message.includes("API_KEY_INVALID")) {
      console.error("\n⚠️  The API key appears to be invalid. Please check:");
      console.error("   1. The key is correct in your .env file");
      console.error("   2. The key has not expired");
      console.error("   3. The Gemini API is enabled in Google Cloud Console");
    }

    process.exit(1);
  }
}

testGeminiConnection();
