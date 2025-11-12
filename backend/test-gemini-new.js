// Quick test script to verify Gemini API connection with new SDK
import { GoogleGenAI } from "@google/genai";
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
    const genAI = new GoogleGenAI({ apiKey });

    console.log("\n📡 Sending test request to Gemini API...");

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Say 'Hello! API connection successful!' in exactly 5 words.",
    });

    const text = result.text;

    console.log("\n✅ SUCCESS! Gemini API is connected and working!");
    console.log("📝 Response:", text);
    console.log(
      "\n🎉 Your Gemini API key is properly configured and functional!"
    );
  } catch (error) {
    console.error("\n❌ ERROR: Failed to connect to Gemini API");
    console.error("Error details:", error.message);

    if (
      error.message.includes("API_KEY_INVALID") ||
      error.message.includes("400")
    ) {
      console.error("\n⚠️  The API key appears to be invalid. Please check:");
      console.error("   1. The key is correct in your .env file");
      console.error("   2. The key has not expired");
      console.error(
        "   3. Get a new key from: https://aistudio.google.com/app/apikey"
      );
    }

    process.exit(1);
  }
}

testGeminiConnection();
