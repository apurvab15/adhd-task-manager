// test-models.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' }); // Load your environment variables

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Make sure your env var name matches
  
  try {
    // This fetches the list of models available to YOUR specific API key
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-2.5-flash" }).apiKey; 
    // Actually, let's use the explicit list method if available, or just test a known working one.
    // Better yet, let's use the generic list endpoint manually to be safe.
    
    console.log("Checking available models...");
    
    // We will just try to invoke the most basic model to see if auth works at all
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success! 'gemini-2.5-flash' works.");
    console.log(result.response.text());

  } catch (error) {
    console.error("Error details:", error.message);
    if (error.message.includes("404")) {
        console.log("\n--- DIAGNOSIS ---");
        console.log("The API cannot find the model. This usually means your SDK is outdated.");
    }
  }
}

listModels();