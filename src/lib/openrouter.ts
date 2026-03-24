const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface Message {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export async function chatCompletion(messages: Message[], model = "google/gemini-2.0-flash-001") {
  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  model = "google/gemini-2.0-flash-001"
) {
  return chatCompletion(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    model
  );
}
