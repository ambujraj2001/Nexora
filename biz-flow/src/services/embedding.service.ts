export const generateEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.MISTRAL_API_KEY;
  const baseURL = process.env.MISTRAL_API_BASE || "https://api.mistral.ai/v1";

  if (!apiKey) {
    throw new Error(
      "Mistral API credentials missing for embedding generation.",
    );
  }

  const response = await fetch(`${baseURL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: [text],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral API error: ${err}`);
  }

  const data = (await response.json()) as any;
  const embedding = data?.data?.[0]?.embedding;

  if (!embedding) {
    throw new Error("No embedding returned from Mistral.");
  }

  return embedding;
};
