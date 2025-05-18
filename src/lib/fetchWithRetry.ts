import { setTimeout } from 'node:timers/promises';

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 5000,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(timeout, () => controller.abort());

  const makeRequest = async (attempt: number): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok && attempt < retries) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
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