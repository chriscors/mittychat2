"use server";

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { createOllama } from "ollama-ai-provider"
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const ollama = createOllama({
    baseURL: "https://ollama.e7f9.ottomatic.cloud/ollama/api/",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
  });

  const result = await streamUI({
    model: ollama("llama3.1:8b"),
    messages: [...history.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return <div>{content}</div>;
    },
    tools: {
      deploy: {
        description: "Deploy repository to vercel",
        parameters: z.object({
          repositoryName: z
            .string()
            .describe("The name of the repository, example: vercel/ai-chatbot"),
        }),
        generate: async function* ({ repositoryName }) {
          yield <div>Cloning repository {repositoryName}...</div>;
          await new Promise((resolve) => setTimeout(resolve, 3000));
          yield <div>Building repository {repositoryName}...</div>;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return <div>{repositoryName} deployed!</div>;
        },
      },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
