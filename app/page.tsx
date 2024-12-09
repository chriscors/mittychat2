"use client";

import type { AI, UIState } from "./actions";
import { nanoid } from "nanoid";
import { Thread, type AppendMessage } from "@assistant-ui/react";
import {
  useVercelRSCRuntime,
  VercelRSCMessage,
} from "@assistant-ui/react-ai-sdk";
import { useActions, useUIState } from "ai/rsc";



export default function IndexPage() {
  return <Thread welcome={{}} />;
}
