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
import { streamText, tool } from "ai";

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
  //   fetch: async (url, options) => {
  //     if (url === "https://api.vultrinference.com/v1/chat")
  //       url += "/completions";
  //     console.log("URL", url);
  //     console.log("Headers", JSON.stringify(options!.headers, null, 2));
  //     console.log(
  //       `Body ${JSON.stringify(JSON.parse(options!.body! as string), null, 2)}`
  //     );
  //     const res = await fetch(url, options);
  //     console.log("Response", res);
  //     const data = await res.json();
  //     console.log("Data", data);
  //     console.log("Message", data.choices[0].message.content);
  //     return res;
  //   },
  // });

  const result = await streamText({
    model: groq("llama3-8b-8192"),
    system:
      "You are an AI assistant that retrieves student information from a database and answers questions about them.",
    messages: [...aiState.get()],
    temperature: 0.2,
    tools: {
      getStudentTool,
    },
    toolChoice: "auto",
  });
  console.log("Result", result);
  let textContent = "";
  for await (const delta of result.fullStream) {
    console.log("Delta", delta);
    const { type } = delta;
    if (type === "text-delta") {
      const { textDelta } = delta;
      textContent += textDelta;
      messageStream.update(<div>{textContent}</div>);

      aiState.update([
        ...aiState.get(),
        {
          id: nanoid(),
          role: "assistant",
          content: textContent,
        },
      ]);
    } else if (type === "tool-call") {
      const { toolName, args } = delta;
      console.log("Tool call", toolName, args);
    }
  }
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
    "Get data about students based on their information. Returns student data.",
  parameters: z.object({
    studentName: z.string().describe("The name of the student"),
  }),
  execute: async ({ studentName }) => {
    console.log("Student name", studentName);
    // const student = await StudentLayout.findFirst({
    //   query: {
    //     studentName,
    //   },
    // });
    // console.log("Student", student);
    // if (student) {
    //   return {
    //     foundCount: student.dataInfo.foundCount,
    //     data: student.data,
    //   };
    // }
    return { parentNames: ["John Doe", "Jane Doe"] };
    return "Error";
  },
});

