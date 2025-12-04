const API_KEY_STORAGE_KEY = "google_api_key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function saveApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export async function promptForApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    const apiKey = prompt(
      "Google API key is required to use this feature.\n\n" +
      "Please enter your Google Generative AI API key:\n\n" +
      "You can get one from: https://makersuite.google.com/app/apikey\n\n" +
      "Your API key will be stored locally in your browser."
    );
    
    if (apiKey && apiKey.trim()) {
      saveApiKey(apiKey.trim());
      resolve(apiKey.trim());
    } else {
      resolve(null);
    }
  });
}


