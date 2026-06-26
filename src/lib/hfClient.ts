import { InferenceClient } from '@huggingface/inference'

const hfToken = import.meta.env.VITE_HF_TOKEN

if (!hfToken) {
  console.warn('Hugging Face Inference token is missing. Check your .env file.')
}

export const hf = new InferenceClient(hfToken || '')
