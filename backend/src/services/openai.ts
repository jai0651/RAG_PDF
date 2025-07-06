import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import { createParser } from 'eventsource-parser';
import { VectorSearchResult } from '../types';

// Initialize OpenAI client
const openai = new ChatOpenAI({
  openAIApiKey: config.OPENAI_API_KEY,
  modelName: config.OPENAI_MODEL,
  temperature: 0.5,
  streaming: true
});

// Generate system prompt
function generateSystemPrompt(results: VectorSearchResult[]): string {
  // Filter out results with no content
  const validResults = results.filter(r => r.pageContent);
  
  if (validResults.length === 0) {
    console.error("No valid content found in search results for context generation");
    return `You are an AI assistant that helps users understand their PDF documents. Unfortunately, I couldn't find relevant information in your PDF to answer this question. Please ask something else about your document.`;
  }
  
  // Join the content with clear section markers
  const contextText = validResults
    .map((r, index) => `[Section ${index + 1}]: ${r.pageContent}`)
    .join('\n\n');
    
    // console.log('contextText', contextText);
  
//   console.log("Generated context length:", contextText.length);
  
  return `You are an AI assistant that helps users understand their PDF documents.
  
Answer the user's questions based on the following context from their PDF:

CONTEXT:
${contextText}

INSTRUCTIONS:
- Answer the user's question preferably based on the context provided above.
- If the information is not in the context, say "I don't have enough information to answer that question."
- Keep your answers helpful, informative, and concise.
- Do not make up or hallucinate information that is not in the context.
- If asked about something unrelated to the PDF content, politely steer the conversation back to the document.`;
}

// Stream OpenAI chat completion
export async function streamChatCompletion(
  query: string, 
  results: VectorSearchResult[], 
  callback: (content: string) => void
): Promise<void> {
  try {
    // Generate prompt
    const systemPrompt = generateSystemPrompt(results);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.5,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const decoder = new TextDecoder('utf-8');
    const parser = createParser((event) => {
      if (event.type === 'event') {
        if (event.data === '[DONE]') {
          return;
        }
        try {
          const data = JSON.parse(event.data);
          const content = data.choices[0]?.delta?.content || '';
          callback(content);
        } catch (error) {
          console.error('Error parsing OpenAI stream:', error);
        }
      }
    });

    // Stream the response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      parser.feed(chunk);
    }
  } catch (error) {
    console.error('Error streaming chat completion:', error);
    throw error;
  }
} 