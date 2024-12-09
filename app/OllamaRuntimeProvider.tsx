"use client";

import {
  type AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import {
  useVercelRSCRuntime,
  VercelRSCMessage,
} from "@assistant-ui/react-ai-sdk";
import { useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";

import type { AI, UIState } from "./actions";

const convertMessage = (message: UIState[number]): VercelRSCMessage => {
  return {
    id: nanoid(),
    role: message.role,
    display: (
      <>
        {message.spinner}
        {message.display}
        {message.attachments}
      </>
    ),
  };
};

export function OllamaRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { continueConversation } = useActions();
  const [messages, setMessages] = useUIState<typeof AI>();

  const onNew = async (m: AppendMessage) => {
    if (m.content[0]?.type !== "text")
      throw new Error("Only text messages are supported");

    const input = m.content[0].text;
    setMessages((currentConversation) => [
      ...currentConversation,
      { id: nanoid(), role: "user", display: input },
    ]);

    const message = await continueConversation(input);
    console.log("message", message);

    setMessages((currentConversation) => [...currentConversation, message]);
  };

  const runtime = useVercelRSCRuntime({
    messages,
    onNew,
    convertMessage,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
