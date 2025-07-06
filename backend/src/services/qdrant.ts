import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';
import { OpenAIEmbeddings } from '@langchain/openai';

// Import the VectorSearchResult interface from the openai service
import { VectorSearchResult } from '../types';

let qdrantClient: QdrantClient;
let embeddings: OpenAIEmbeddings; // Will be initialized when needed

// Helper to get the Qdrant client
function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    console.log('Initializing Qdrant client with config');
    qdrantClient = new QdrantClient({
      url: config.QDRANT_URL,
      apiKey: config.QDRANT_API_KEY,
    });
  }
  return qdrantClient;
}

// Helper to get the OpenAI embeddings
async function getEmbeddings(): Promise<OpenAIEmbeddings> {
  if (!embeddings) {
    console.log('Initializing OpenAI embeddings with config');
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: config.OPENAI_EMBEDDING_MODEL
    });
  }
  return embeddings;
}

// Initialize Qdrant collection
export async function initializeQdrantCollection(): Promise<void> {
  try {
    // Check if collection exists
    const collections = await getQdrantClient().getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === config.QDRANT_COLLECTION
    );

    if (!collectionExists) {
      console.log(`Creating Qdrant collection: ${config.QDRANT_COLLECTION}`);
      
      // Create collection with proper settings for OpenAI embeddings
      await getQdrantClient().createCollection(config.QDRANT_COLLECTION, {
        vectors: {
          size: 1536, // OpenAI embedding dimension size
          distance: 'Cosine',
        }
      });

        // Always try to create indexes (safe if already exists)
    await getQdrantClient().createPayloadIndex(config.QDRANT_COLLECTION, {
      field_name: 'documentId',
      field_schema: 'keyword',
    });
    await getQdrantClient().createPayloadIndex(config.QDRANT_COLLECTION, {
      field_name: 'userId',
      field_schema: 'keyword',
    });
      
      console.log(`Qdrant collection created successfully`);
    } else {
      console.log(`Qdrant collection ${config.QDRANT_COLLECTION} already exists`);
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
    throw error;
  }
}

/**
 * Search for similar vectors in Qdrant
 */
export async function searchSimilarVectors(
  query: string, 
  documentId: string, 
  userId: string, 
  limit: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // Generate embedding for the query
    const embeddingsInstance = await getEmbeddings();
    const queryEmbedding = await embeddingsInstance.embedQuery(query);
    
    // Search in Qdrant
    const searchResult = await getQdrantClient().search(config.QDRANT_COLLECTION, {
      vector: queryEmbedding,
      limit,
      filter: {
        must: [
          {
            key: 'documentId',
            match: { value: documentId }
          },
          {
            key: 'userId',
            match: { value: userId }
          }
        ]
      },
      with_payload: true
    });
    
    if (searchResult.length === 0) {
      // Try a search without filtering by userId as a fallback
      const fallbackResult = await getQdrantClient().search(config.QDRANT_COLLECTION, {
        vector: queryEmbedding,
        limit,
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId }
            }
          ]
        },
        with_payload: true
      });
      
      searchResult.push(...fallbackResult);
    }
    
    // Transform to VectorSearchResult format
    return searchResult.map(result => {
      // Ensure pageContent is always a string
      const pageContent = (result.payload?.pageContent || result.payload?.text || '').toString();
      
      // Ensure metadata fields are properly typed
      const metadata = {
        documentId: String(result.payload?.documentId || ''),
        userId: String(result.payload?.userId || ''),
        chunkIndex: Number(result.payload?.chunkIndex || 0),
        // Add any additional metadata fields
        ...Object.fromEntries(
          Object.entries(result.payload || {})
            .filter(([key]) => !['pageContent', 'text', 'documentId', 'userId', 'chunkIndex'].includes(key))
        )
      };
      
      return {
        id: result.id.toString(),
        score: result.score,
        pageContent,
        metadata
      };
    });
  } catch (error) {
    console.error('Error searching vectors:', error);
    throw new Error(`Failed to search for similar content: ${error}`);
  }
} 