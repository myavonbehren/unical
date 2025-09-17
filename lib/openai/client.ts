import OpenAI from 'openai';

// Check if the OPENAI_API_KEY is set
if (!process.env['OPENAI_API_KEY']) {
  throw new Error('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});