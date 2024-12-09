"use server";

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { createOllama } from "ollama-ai-provider"
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { groq } from "@ai-sdk/groq";
import { studentLayout } from "@/config/schema/client/index";

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

  const aiState = getMutableAIState();

  const ollama = createOllama({
    baseURL: "https://ollama.e7f9.ottomatic.cloud/ollama/api/",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
  });

  const result = await streamUI({
    model: groq("llama3-8b-8192"), //ollama("codellama:13b"),
    system:
      "You are an AI assistant that can create and retrieve students from a database and answer questions about them. You may use a tool, but you should not always use a tool. Confirm with the user before using a tool.",
    messages: [...aiState.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        aiState.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return <div>{content}</div>;
    },
    tools: {
      createStudent: {
        description: "Create a new student",
        parameters: z.object({
          nameFirst: z.string().describe("The first name of the student"),
          nameLast: z.string().describe("The last name of the student"),
          email: z.string().optional().describe("The email of the student"),
          phoneNumber: z
            .string()
            .optional()
            .describe(
              "The phone number of the student in (123) 456-7890 format"
            ),
          dob: z
            .string()
            .optional()
            .describe("The date of birth of the student in MM/DD/YYYY format"),
          address: z.string().optional().describe("The address of the student"),
          graduationYear: z
            .optional(z.string())
            .describe("The graduation year of the student"),
        }),
        generate: async function* ({
          nameFirst,
          nameLast,
          email,
          phoneNumber,
          dob,
          address,
          graduationYear,
        }) {
          console.log("Creating student", nameFirst, nameLast);
          const student = await studentLayout.create({
            fieldData: {
              nameFirst,
              nameLast,
              email,
              phoneNumber,
              dob,
              address,
              graduationYear,
            },
          });
          if (student) {
            return (
              <div>
                {nameFirst} {nameLast} created!
              </div>
            );
          }
          return <div>Error creating student</div>;
        },
      },
      getStudent: {
        description: "Get data about a student based on their information",
        parameters: z.object({
          nameFirst: z
            .string()
            .optional()
            .describe("The first name of the student"),
          nameLast: z
            .string()
            .optional()
            .describe("The last name of the student"),
          email: z.string().optional().describe("The email of the student"),
          phoneNumber: z
            .string()
            .optional()
            .describe(
              "The phone number of the student in (123) 456-7890 format"
            ),
          dob: z
            .string()
            .optional()
            .describe("The date of birth of the student in MM/DD/YYYY format"),
          address: z.string().optional().describe("The address of the student"),
          graduationYear: z
            .string()
            .optional()
            .describe("The graduation year of the student"),
        }),
        generate: async function* ({
          nameFirst,
          nameLast,
          email,
          phoneNumber,
          dob,
          address,
          graduationYear,
        }) {
          const student = await studentLayout.find({
            query: {
              nameFirst,
              nameLast,
              email,
              phoneNumber,
              dob,
              address,
              graduationYear,
            },
          });
          if (student) {
            return (
              <div>
                {student.data.map((student) => (
                  <div>
                    {student.fieldData.nameFirst} {student.fieldData.nameLast}
                    <br />
                    {student.fieldData.email}
                    <br />
                    {student.fieldData.phoneNumber}
                    <br />
                    {student.fieldData.dob}
                    <br />
                    {student.fieldData.address}
                    <br />
                    {student.fieldData.graduationYear}
                  </div>
                ))}
              </div>
            );
          }
          return <div>No student found</div>;
        },
      },
    },
    toolChoice: "auto",
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
