// Import the necessary modules
import { GoogleGenAI} from '@google/genai'; // <--- Changed import name
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv'; // For loading environment variables
import express from "express";
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';
import { BASE_PROMPT } from './prompts';
import { getSystemPrompt } from './prompts';
import cors from 'cors'; // Assuming you have a cors module for handling CORS

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173" // Your Vite dev server
})); // Use CORS middleware
app.use(express.json());


// Access your API key (securely recommended via environment variables)
const API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.send("Welcome to the Gemini AI API!");
});

app.post("/template", async(req,res)=>{
  const prompt = req.body.prompt;
  const ai = new GoogleGenAI({apiKey: API_KEY});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "model",
        parts: [{ text: "Return either node or react based on what do you think the project should be .Only return a single word either 'node' or 'react'. Do not return anything extra." }]
      },
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });
  const answer = response.text;
  console.log(answer);
  if( answer !== "node" && answer !== "react") {
    return res.status(403).json({ error: "You cant access this" });
  }
  if (answer === "node") {
    res.json({ 
      prompts: [ `Here is an artifact that contains all files of the project visible to you.
        \n Consider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\n here 
        is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`],
      uiPrompts: [nodeBasePrompt]
     });
     return;
  } 

  if (answer === "react") {
    res.json({ 
      prompts: [ BASE_PROMPT,`Here is an artifact that contains all files of the project visible to you.
        \n Consider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\n here 
        is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`
      ],
      uiPrompts: [reactBasePrompt]
     });
     return;
  }
  res.status(500).json({ error: "Internal Analytical Issue" });
})

// async function main() {
//   if (!API_KEY) {
//     console.error('GEMINI_API_KEY is not set. Please set it in your .env file or as an environment variable.');
//     return;
//   }
 
//   const ai = new GoogleGenAI({apiKey: API_KEY});
//    const response = await ai.models.generateContentStream({
//     model: "gemini-2.5-flash",
//     contents: "Create a simple todo application",
//   });
//   for await (const chunk of response) {
//     console.log(chunk.text);
//   }
// }

// // main();


app.post("/chat", async (req,res)=>{
  try {
    const messages = req.body.messages; // same format as Claude messages

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create structured chat history
    const history = messages.map((message: { role: string; content: string }) => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));

    // Add system prompt if needed
    const systemPrompt = getSystemPrompt(); // optional
    if (systemPrompt) {
      history.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    }

    const result = await model.generateContent({
      contents: history,
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.7,
        topP: 1,
        topK: 1,
      },
    });

    const response = result.response;
    const text = response.text();

    console.log(response);

    res.json({
      response: response.text,
    });

  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ error: 'Gemini 1.5 Flash error occurred.' });
  }
})
app.listen(3000, () => {  
  console.log("Server is running on port 3000");
});