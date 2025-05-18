import { setTimeout } from 'node:timers/promises';

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}) {
  const {
    retries = 5, // Increased from 3 to 5 retries
    retryDelay = 5000, // Increased from 3000ms to 5000ms
    timeout = 15000,   // Increased from 10000ms to 15000ms
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
      
      // Validate URL before making request
      if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid URL: ${url}. Please check your API endpoint configuration.`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok && attempt < retries) {
        const errorMessage = `HTTP error! status: ${response.status} for URL: ${url}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error: any) {
      console.error(`Fetch failed (attempt ${attempt}/${retries}) for URL: ${url}. Error:`, error.message);
      
      if (error.name === 'AbortError') {
        console.error('Request aborted due to timeout');
        throw new Error(`Request timeout after ${timeout}ms. Please check your network connection and API endpoint.`);
      }
      
      if (attempt >= retries) {
        console.error('Max retries reached. Throwing final error.');
        throw new Error(`Failed after ${retries} attempts. Please check your network connection and try again later.`);
      }

      // Implement exponential backoff
      const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${backoffDelay}ms before retry...`);
      await setTimeout(backoffDelay);
      return makeRequest(attempt + 1);
    } finally {
      if (attempt === 1) {
        clearTimeout(timeoutId);
      }
    }
  };

  return makeRequest(1);
}