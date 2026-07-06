// Central AI module configuration.
// Production installers should ship the AI runtime and the fixed model as app components.
export const AI_MODEL = "qwen2.5:7b";
export const AI_UNAVAILABLE_MESSAGE = "AI-модуль временно недоступен. Проверьте установку компонента AI.";

export const AI_RUNTIME_ENDPOINT = import.meta.env.DEV
  ? (import.meta.env.VITE_AI_RUNTIME_URL || "http://localhost:11434")
  : (import.meta.env.VITE_AI_RUNTIME_URL || "/ai-runtime");
