
export const CONFIG = {
  AI_API_KEY: "", // Replace with your actual API key
  AI_MODEL: "gemini-2.0-flash",
  AI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",
  
  MAX_TEXT_LENGTH: 100,
  HIGHLIGHT_DURATION: 2000,
  MAX_XPATH_LENGTH: 500
};

export function getApiKey() {
  return CONFIG.AI_API_KEY;
}

export function isApiConfigured() {
  return CONFIG.AI_API_KEY && CONFIG.AI_API_KEY.trim() !== "" && CONFIG.AI_API_KEY !== "GEMINI_API_KEY";
}

export function getAiType() {
  return "ai";
} 