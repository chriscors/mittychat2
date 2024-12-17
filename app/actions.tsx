"use server";

import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { createOllama } from "ollama-ai-provider";
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { groq } from "@ai-sdk/groq";
import {
  StudentLayout,
} from "@/config/schema/client/index";
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

  const ollama = createOllama({
    baseURL: "https://api.vultrinference.com/v1/",
    headers: {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
  });

  const result = await streamText({
    model: ollama("llama-3.1-70b-instruct-fp8-gh200"), //groq("llama3-8b-8192"), ,
    system:
      "You are an AI assistant that can create and retrieve student information from a database and answer questions about them.",
    messages: [...aiState.get(), { role: "user", content: input }],
    // temperature: 0,
    // tools: {
    //   createStudentTool,
    //   getStudentTool,
    //   enrollStudentTool,
    //   getEnrolledStudentsTool,
    //   getClassTool,
    // },
    toolChoice: "auto",
    maxSteps: 1,
  });
  let textContent = "";
  for await (const delta of result.fullStream) {
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

const createStudentTool = tool({
  description:
    "Create a new student with various biographical information. You must provide a first and last name.",
  parameters: z.object({
    nameFirst: z.string().describe("The first name of the student"),
    nameLast: z.string().describe("The last name of the student"),
    email: z.string().optional().describe("The email of the student"),
    phoneNumber: z
      .string()
      .optional()
      .describe("The phone number of the student in (123) 456-7890 format"),
    dob: z
      .string()
      .optional()
      .describe("The date of birth of the student in MM/DD/YYYY format"),
    address: z.string().optional().describe("The address of the student"),
    graduationYear: z
      .optional(z.string())
      .describe("The graduation year of the student"),
  }),
  execute: async ({
    nameFirst,
    nameLast,
    email,
    phoneNumber,
    dob,
    address,
    graduationYear,
  }) => {
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
    return student;
  },
});

const getStudentTool = tool({
  description:
    "Get data about students based on their information. Can also return the count of students that match the query.",
  parameters: z.object({
    nameFirst: z.string().optional().describe("The first name of the student"),
    nameLast: z.string().optional().describe("The last name of the student"),
    email: z.string().optional().describe("The email of the student"),
    phoneNumber: z
      .string()
      .optional()
      .describe("The phone number of the student in (123) 456-7890 format"),
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
  execute: async ({
    nameFirst,
    nameLast,
    email,
    phoneNumber,
    dob,
    address,
    graduationYear,
  }) => {
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
      return {
        foundCount: student.dataInfo.foundCount,
        data: student.data,
      };
    }
    return "Error";
  },
});

const enrollStudentTool = tool({
  description: "Enroll a student in a course",
  parameters: z.object({
    nameFirst: z.string().describe("The first name of the student"),
    nameLast: z.string().describe("The last name of the student"),
    className: z
      .string()
      .describe("The name of the class to enroll the student in"),
  }),
  execute: async ({ nameFirst, nameLast, className }) => {
    try {
      const student = await studentLayout.findFirst({
        query: {
          nameFirst,
          nameLast,
        },
        ignoreEmptyResult: true,
      });
      if (!student.data) {
        return "Error: Student not found. Maybe they haven't been created yet?";
      }
      console.log("Student found", student.data);
      const classData = await classLayout.findFirst({
        query: {
          name: className,
        },
        ignoreEmptyResult: true,
      });
      if (!classData.data) {
        return "Error: Class not found";
      }
      console.log("Class found", classData.data);
      const enrollment = await studentClassLayout.create({
        fieldData: {
          _class_id: classData.data.fieldData.__id,
          _student_id: student.data.fieldData.__id,
        },
      });

      return "Successfully enrolled student in class";
    } catch (error) {
      console.error("Error enrolling student in class", error);
      return "Error: Failed to enroll student in class";
    }
  },
});

const getEnrolledStudentsTool = tool({
  description: "Get the students enrolled in a class",
  parameters: z.object({
    className: z
      .string()
      .describe("The name of the class to get enrolled students for"),
  }),
  execute: async ({ className }) => {
    const students = await studentClassLayout.find({
      query: {
        "Class::name": className,
      },
    });
    return { foundCount: students.dataInfo.foundCount, data: students.data };
  },
});

const getClassTool = tool({
  description: "Get available classes",
  parameters: z.object({}),
  execute: async () => {
    const classes = await classLayout.list();
    return { foundCount: classes.dataInfo.foundCount, data: classes.data };
  },
});
