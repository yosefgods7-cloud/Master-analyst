export async function sendToTelegram(message: string, chatId?: string) {
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
}
