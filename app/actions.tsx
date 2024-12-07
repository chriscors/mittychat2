"use server";

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { createOllama } from "ollama-ai-provider"
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";

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
    model: groq("llama3-8b-8192"), //ollama("codellama:13b"),
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
    //   tools: {
    //     deploy: {
    //       description: "Deploy repository to vercel",
    //       parameters: z.object({
    //         repositoryName: z
    //           .string()
    //           .describe("The name of the repository, example: vercel/ai-chatbot"),
    //       }),
    //       generate: async function* ({ repositoryName }) {
    //         yield <div>Cloning repository {repositoryName}...</div>;
    //         await new Promise((resolve) => setTimeout(resolve, 3000));
    //         yield <div>Building repository {repositoryName}...</div>;
    //         await new Promise((resolve) => setTimeout(resolve, 2000));
    //         return <div>{repositoryName} deployed!</div>;
    //       },
    //     },
    //   },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export type Message = {
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  content: string;
  id?: string;
  name?: string;
  display?: {
    name: string;
    props: Record<string, any>;
  };
};

export type AIState = {
  chatId: string;
  interactions?: string[];
  messages: Message[];
};

export type UIState = {
  id: string;
  role: "user" | "assistant";
  display: React.ReactNode;
  spinner?: React.ReactNode;
  attachments?: React.ReactNode;
}[];


export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
