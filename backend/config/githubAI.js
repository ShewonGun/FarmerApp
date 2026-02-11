import OpenAI from "openai";

const githubAI = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN || "",
});

export default githubAI;
