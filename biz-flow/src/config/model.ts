// ─── Model Configuration ──────────────────────────────────────────────────────
// All LLM setup lives here. To switch models, only edit this file.
//
// Current backend: Mistral AI (OpenAI-compatible)
//   Base URL : MISTRAL_API_BASE  → https://api.mistral.ai/v1
//   Model    : MISTRAL_MODEL     → mistral-small-latest
//   API Key  : MISTRAL_API_KEY   → BHd7...

import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const buildModel = (tools?: StructuredToolInterface[]) => {
  const apiKey = getEnv("MISTRAL_API_KEY");
  const modelName = getEnv("MISTRAL_MODEL");
  const baseURL = getEnv("MISTRAL_API_BASE");

  const llm = new ChatOpenAI({
    modelName,
    openAIApiKey: apiKey,
    temperature: 0.3,
    configuration: {
      baseURL,
      apiKey,
    },
  });

  return tools && tools.length > 0 ? llm.bindTools(tools) : llm;
};
