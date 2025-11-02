/**
 * Test example for Google Generative AI SDK with gemini-1.5-flash
 * 
 * This demonstrates the correct way to use the SDK in a Next.js environment.
 * Run this with: npx tsx src/lib/test-gemini.ts (after setting GOOGLE_API_KEY)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGemini() {
  try {
    // Load API key from environment
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }

    console.log("Initializing Google Generative AI client with v1 API endpoint...");
    
    // Initialize the client with explicit v1 API endpoint
    // Using type assertion since SDK supports baseUrl but types may not include it
    const genAI = new (GoogleGenerativeAI as any)(apiKey, {
      baseUrl: "https://generativelanguage.googleapis.com/v1",
    });

    console.log("Getting model: gemini-1.5-flash...");
    
    // Get the model with JSON response format
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    console.log("Generating content...");
    
    // Generate content
    const prompt = `You are a helpful assistant. Return a JSON object with:
{
  "message": "Hello, this is a test",
  "status": "success"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Response received:");
    console.log(text);

    // Parse the JSON response
    const jsonResponse = JSON.parse(text);
    console.log("\nParsed JSON:");
    console.log(JSON.stringify(jsonResponse, null, 2));

    console.log("\n✅ Test successful!");
    
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testGemini();

