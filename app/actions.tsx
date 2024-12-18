"use server";

import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { createOllama, ollama } from "ollama-ai-provider";
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { groq } from "@ai-sdk/groq";
import { StudentLayout } from "@/config/schema/client/index";
import { streamText, generateText, tool } from "ai";

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
  ("use server");

  const aiState = getMutableAIState();

  aiState.update([
    ...aiState.get(),
    {
      id: nanoid(),
      role: "user",
      content: input,
    },
  ]);

  const messageStream = createStreamableUI(null);

  // const ollama = createOllama({
  //   baseURL: "https://api.vultrinference.com/v1/",
  //   headers: {
  //     Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  //   },
  // });

  const result = await generateText({
    model: ollama("llama3.2:latest"), //groq("llama3-8b-8192"),
    system:
      "You are an AI assistant that can create and retrieve student information from a database and answer questions about them.",
    messages: [...aiState.get()],
    tools: {
      getStudentTool,
    },
    toolChoice: "auto",
    maxSteps: 10,
  });
  let textContent = "";
  const message = result.text;

  messageStream.update(<div>{message}</div>);

  messageStream.done();
  return {
    id: nanoid(),
    role: "assistant",
    display: messageStream.value,
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

const getStudentTool = tool({
  description:
    "Get data about students based on their information. Can also return the count of students that match the query.",
  parameters: z.object({
    nameFirst: z.string().optional().describe("The first name of the student"),
    nameLast: z.string().optional().describe("The last name of the student"),
  }),
  execute: async ({ nameFirst, nameLast }) => {
    return {
      firstName: "john",
      lastName: "doe",
      email: "john.doe@example.com",
      phoneNumber: "1234567890",
      dob: "01/01/2000",
      address: "1234567890",
      graduationYear: "2024",
    };
  },
});
