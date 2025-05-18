import { setTimeout } from 'node:timers/promises';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  config: RetryConfig = {}
): Promise<Response> {
  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    onRetry = (error, attempt) => {
      console.warn(`Retry attempt ${attempt} after error:`, error.message);
    }
  } = config;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);
      
      // Check if response is ok (status in the range 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Call the onRetry callback
      onRetry(lastError, attempt);
      
      // Wait before retrying
      await setTimeout(retryDelay * attempt);
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts. Last error: ${lastError.message}`
  );
}