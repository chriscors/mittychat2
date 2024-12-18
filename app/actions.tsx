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
import {
  StudentAcademicHistoryLayout,
  StudentFamilialRelationshipLayout,
  StudentLayout,
} from "@/config/schema/client/index";
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
    model: ollama("llama3.2:latest"), //groq("gemma2-9b-it"),  //groq("llama3-8b-8192"),
    system: `You are a specialized AI model designed to provide information about students based on their data. Your goal is to answer questions about student details, including demographics, academic performance, extracurricular activities, and attendance. Follow these principles:
	1.	Scope: Only answer questions related to students. If a question is outside this scope, politely explain that it falls outside your expertise.
	2.	Context Awareness: Retain and use the context of the current conversation to answer follow-up questions without unnecessarily relying on tools unless needed for accuracy or retrieval. If a question refer's to "her," or "him", reference the previous messages to understand their names.
	3.	Tool Usage:
	•	Use tools only when necessary to fetch or calculate specific details from an external source or dataset.
	•	Avoid using tools redundantly for follow-up questions when the required information is already available from prior context.
	4.	Clarity and Precision: Provide clear, concise, and student-focused responses. Avoid speculation or providing information not explicitly available in the data.
	5.	Privacy and Compliance: Never disclose sensitive or private student data unless explicitly authorized and appropriate.

If uncertain about a query, seek clarification rather than guessing.`,
    messages: [...aiState.get()],
    tools: {
      getStudentTool,
      getAcademicHistoryTool,
      getFamilialRelationshipsTool,
    },
    temperature: 0,
    toolChoice: "auto",
    maxSteps: 5,
  });
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
  description: "Get data about a student based on their name.",
  parameters: z.object({
    studentName: z.string().optional().describe("The name of the student"),
  }),
  execute: async ({ studentName }) => {
    console.log("getStudentTool", studentName);
    try {
      const student = await StudentLayout.findFirst({
        query: {
          studentName,
        },
        ignoreEmptyResult: true,
      });

      if (student) {
        console.log("student", student.data.fieldData);
        return student.data.fieldData;
      } else {
        return "Student not found";
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      return "An error occurred while fetching student data.";
    }
  },
});
const getAcademicHistoryTool = tool({
  description:
    "Get data about a student's academic history including the classes they've taken and their teachers.",
  parameters: z.object({
    studentName: z.string().optional().describe("The name of the student"),
  }),
  execute: async ({ studentName }) => {
    console.log("getAcademicHistoryTool", studentName);
    try {
      const student = await StudentAcademicHistoryLayout.findFirst({
        query: {
          studentName,
        },
        ignoreEmptyResult: true,
      });

      if (student) {
        console.log("student", student.data.fieldData);
        return student.data.fieldData;
      } else {
        return "Student not found";
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      return "An error occurred while fetching student data.";
    }
  },
});
const getFamilialRelationshipsTool = tool({
  description:
    "Get data about a student's familial relationships including their parents, siblings, and guardians.",
  parameters: z.object({
    studentName: z.string().optional().describe("The name of the student"),
  }),
  execute: async ({ studentName }) => {
    console.log("getFamilialRelationshipsTool", studentName);
    try {
      const student = await StudentFamilialRelationshipLayout.findFirst({
        query: {
          studentName,
        },
        ignoreEmptyResult: true,
      });

      if (student) {
        console.log("student", student.data.fieldData);
        return student.data.fieldData;
      } else {
        return "Student not found";
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      return "An error occurred while fetching student data.";
    }
  },
});
