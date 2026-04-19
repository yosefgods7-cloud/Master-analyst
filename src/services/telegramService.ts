async function executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      // Do not retry on unrecoverable configuration/credential errors
      if (
        error.message.includes("Bad Request (400)") ||
        error.message.includes("Unauthorized (401)") ||
        error.message.includes("Forbidden (403)") ||
        error.message.includes("Configuration Error:")
      ) {
        throw error;
      }
      
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      
      const waitTime = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Telegram API call failed. Retrying in ${waitTime}ms... (Attempt ${attempt} of ${maxRetries})`, error?.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Execute with retry failed");
}

export async function sendToTelegram(message: string, chatId?: string) {
  return executeWithRetry(async () => {
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, chatId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || "Failed to send message to Telegram";

        // Enhance error message based on common Telegram API errors or server status
        if (errorData.errorCode === 400) {
          errorMessage = `Bad Request (400): ${errorData.error}. Check if your Chat ID is correct and the bot has permission to post.`;
        } else if (errorData.errorCode === 401) {
          errorMessage = `Unauthorized (401): ${errorData.error}. Check if your Bot Token is valid.`;
        } else if (errorData.errorCode === 403) {
          errorMessage = `Forbidden (403): ${errorData.error}. The bot was blocked by the user or lacks permissions.`;
        } else if (response.status === 500 && errorData.error?.includes("credentials not configured")) {
          errorMessage = "Configuration Error: Please provide both a Bot Token (in Env) and a Chat ID.";
        } else if (errorData.errorCode) {
          errorMessage = `Telegram API Error (${errorData.errorCode}): ${errorData.error}`;
        } else if (response.status >= 500) {
          errorMessage = `Internal Server Error (${response.status}): ${errorMessage}`;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message === "Failed to fetch") {
        throw new Error("Network Error: Could not reach the backend server to dispatch the Telegram message.");
      }
      throw error;
    }
  });
}
