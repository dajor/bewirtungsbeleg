/**
 * Sample embeddings for testing
 * These are shortened 1536-dimensional vectors for testing purposes
 */

// Generate a realistic-looking 1536-dimensional vector
function generateSampleEmbedding(seed: number = 0): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    // Use seed to generate deterministic but realistic values
    embedding.push(Math.sin(seed + i) * 0.1);
  }
  return embedding;
}

export const sampleEmbedding1 = generateSampleEmbedding(1);
export const sampleEmbedding2 = generateSampleEmbedding(2);
export const identicalEmbedding = [...sampleEmbedding1]; // For similarity tests

// Zero vector for edge case testing
export const zeroEmbedding = new Array(1536).fill(0);

// Different dimension for error testing
export const invalidDimensionEmbedding = new Array(512).fill(0.1);

// Sample OpenAI API response
export const mockOpenAIEmbeddingResponse = {
  data: [
    {
      embedding: sampleEmbedding1,
      index: 0,
      object: 'embedding',
    },
  ],
  model: 'text-embedding-3-small',
  object: 'list',
  usage: {
    prompt_tokens: 25,
    total_tokens: 25,
  },
};
