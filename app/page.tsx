"use client";

import type { AI, UIState } from "./actions";
import { nanoid } from "nanoid";
import { Thread, type AppendMessage } from "@assistant-ui/react";
import {
  useVercelRSCRuntime,
  VercelRSCMessage,
} from "@assistant-ui/react-ai-sdk";
import { useActions, useUIState } from "ai/rsc";

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

export default function IndexPage() {
  return <Thread welcome={{}} />;
}
