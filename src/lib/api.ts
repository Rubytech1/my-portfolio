import { fetchWithRetry } from './fetchWithRetry';

// Get the base URL from environment variable or use a default
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

export async function getBlogPosts() {
  const response = await fetchWithRetry(`${BASE_URL}/api/posts`, {
    timeout: 8000, // 8 seconds
    retries: 3,
  });
  return response.json();
}

export async function getProject(slug: string) {
  const response = await fetchWithRetry(`${BASE_URL}/api/projects/${slug}`, {
    timeout: 8000,
    retries: 3,
  });
  return response.json();
}

export async function submitContact(data: any) {
  const response = await fetchWithRetry(`${BASE_URL}/api/contact`, {
    method: 'POST',
    body: JSON.stringify(data),
    timeout: 8000,
    retries: 3,
  });
  return response.json();
}