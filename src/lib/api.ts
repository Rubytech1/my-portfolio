import { fetchWithRetry } from './fetchWithRetry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not set. Please configure your environment variables.');
}

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export async function submitContact(data: ContactForm) {
  try {
    const response = await fetchWithRetry(`${API_URL}/contact`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to submit contact form:', error.message);
    throw new Error('Failed to submit contact form. Please try again later.');
  }
}