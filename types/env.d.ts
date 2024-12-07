declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OLLAMA_API_KEY: string;
      // add other env variables here
    }
  }
}

export {} 