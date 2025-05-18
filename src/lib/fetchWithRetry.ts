import { setTimeout } from 'node:timers/promises';

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}) {
  const {
    retries = 3,
    retryDelay = 3000, // Increased from 1000ms to 3000ms
    timeout = 10000,   // Increased from 5000ms to 10000ms
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(timeout, () => {
    controller.abort();
    console.error(`Request timeout after ${timeout}ms for URL: ${url}`);
  });

  const makeRequest = async (attempt: number): Promise<Response> => {
    try {
      console.log(`Attempt ${attempt}/${retries} for URL: ${url}`);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok && attempt < retries) {
        console.error(`HTTP error! status: ${response.status} for URL: ${url}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error: any) {
      console.error(`Fetch failed (attempt ${attempt}/${retries}) for URL: ${url}. Error:`, error.message);
      
      if (error.name === 'AbortError') {
        console.error('Request aborted due to timeout');
        throw error;
      }
      
      if (attempt >= retries) {
        console.error('Max retries reached. Throwing final error.');
        throw error;
      }

      console.log(`Waiting ${retryDelay}ms before retry...`);
      await setTimeout(retryDelay);
      return makeRequest(attempt + 1);
    } finally {
      if (attempt === 1) {
        clearTimeout(timeoutId);
      }
    }
  };

  return makeRequest(1);
}