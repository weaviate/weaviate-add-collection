/**
 * This utility extracts configuration options for vectorizer modules
 * directly from the Weaviate client TypeScript definitions.
 * 
 * It dynamically infers the available configuration fields for each
 * vectorizer module based on the TypeScript type definitions.
 * 
 * ## How to Discover Properties for Each Vectorizer Module
 * 
 * To find the available configuration properties for a vectorizer module,
 * inspect the TypeScript definitions from the weaviate-client package:
 * 
 * ```bash
 * # Navigate to the weaviate-client package
 * cd node_modules/weaviate-client
 * 
 * # View the vectorizer type definitions
 * cat dist/node/esm/collections/config/types/vectorizer.d.ts
 * 
 * # Or search for a specific vectorizer (e.g., text2vec-openai)
 * grep -A 20 "text2vec-openai" dist/node/esm/collections/config/types/vectorizer.d.ts
 * 
 * # For property-level module configs, check:
 * cat dist/node/esm/collections/config/types/property.d.ts
 * ```
 * 
 * ### Example: Extracting text2vec-openai properties
 * 
 * ```bash
 * # Use jq to parse and format the TypeScript definitions
 * cat node_modules/weaviate-client/dist/node/esm/collections/config/types/vectorizer.d.ts | \
 *   grep -A 30 "interface Text2VecOpenAIConfig"
 * 
 * # Output will show interface like:
 * # interface Text2VecOpenAIConfig {
 * #   model?: string;
 * #   modelVersion?: string;
 * #   type?: string;
 * #   vectorizeClassName?: boolean;
 * #   baseURL?: string;
 * #   dimensions?: number;
 * # }
 * ```
 * 
 * The fields marked with `?` are optional, fields without `?` are required.
 * Use these interface definitions to populate the VECTORIZER_CONFIG_FIELDS below.
 */

// Import all vectorizer config types from weaviate-client
// These are the actual type definitions from the library
//import weaviate from 'weaviate-client'

/**
 * Type definitions mapping for each vectorizer module.
 * Based on weaviate-client TypeScript definitions in:
 * node_modules/weaviate-client/dist/node/esm/collections/config/types/vectorizer.d.ts
 */
const VECTORIZER_CONFIG_FIELDS = {
  'img2vec-neural': {
    fields: [
      { name: 'imageFields', type: 'string[]', required: true, description: 'The image fields used when vectorizing. Must match BLOB property fields.' }
    ]
  },
  'multi2vec-nvidia': {
    fields: [
      { name: 'model', type: 'string', description: 'The model to use. Defaults to server-defined default.' },
      { name: 'baseURL', type: 'string', description: 'The base URL where API requests should go.' },
      { name: 'truncation', type: 'boolean', description: 'Whether to apply truncation.' },
      { name: 'output_encoding', type: 'string', description: 'Format in which the embeddings are encoded.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-aws': {
    fields: [
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'region', type: 'string', description: 'The AWS region where the model runs.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-clip': {
    fields: [
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'inferenceUrl', type: 'string', description: 'The URL where inference requests are sent.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-cohere': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'model', type: 'string', description: 'The specific model to use.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'truncate', type: 'string', description: 'The truncation strategy to use.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-bind': {
    fields: [
      { name: 'audioFields', type: 'string[]', description: 'The audio fields used when vectorizing.' },
      { name: 'depthFields', type: 'string[]', description: 'The depth fields used when vectorizing.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'IMUFields', type: 'string[]', description: 'The IMU fields used when vectorizing.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'thermalFields', type: 'string[]', description: 'The thermal fields used when vectorizing.' },
      { name: 'videoFields', type: 'string[]', description: 'The video fields used when vectorizing.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-google': {
    fields: [
      { name: 'projectId', type: 'string', required: true, description: 'The project ID of the model in GCP.' },
      { name: 'location', type: 'string', required: true, description: 'The location where the model runs.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'videoFields', type: 'string[]', description: 'The video fields used when vectorizing.' },
      { name: 'videoIntervalSeconds', type: 'number', description: 'Length of a video interval in seconds.' },
      { name: 'model', type: 'string', description: 'The model ID in use.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-jinaai': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'multi2vec-voyageai': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded. Supported: 256, 512, 1024 (default), 2048.' },
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'model', type: 'string', description: 'The model to use (e.g., voyage-multimodal-3, voyage-multimodal-3.5).' },
      { name: 'outputEncoding', type: 'string', description: 'How the output from the model should be encoded on return.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' },
      { name: 'truncate', type: 'boolean', description: 'Whether the input should be truncated to fit in the context window.' },
      { name: 'videoFields', type: 'string[]', description: 'The video fields used when vectorizing (requires voyage-multimodal-3.5).' },
      { name: 'weights', type: 'object', description: 'The weights of the fields used for vectorization.' }
    ]
  },
  'ref2vec-centroid': {
    fields: [
      { name: 'referenceProperties', type: 'string[]', required: true, description: 'The properties used as reference points for vectorization.' },
      { name: 'method', type: 'string', description: 'The method used to calculate the centroid (mean).' }
    ]
  },
  'text2vec-aws': {
    fields: [
      { name: 'region', type: 'string', required: true, description: 'The AWS region where the model runs.' },
      { name: 'service', type: 'string', required: true, description: 'The AWS service to use (bedrock, sagemaker).' },
      { name: 'endpoint', type: 'string', description: 'The endpoint URL. REQUIRED for service sagemaker.' },
      { name: 'model', type: 'string', description: 'The model to use. REQUIRED for service bedrock.' },
    ]
  },
  'text2vec-azure-openai': {
    fields: [
      { name: 'resourceName', type: 'string', required: true, description: 'The Azure resource name.' },
      { name: 'deploymentId', type: 'string', required: true, description: 'The deployment ID.' },
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
    ]
  },
  'text2vec-cohere': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'truncate', type: 'boolean', description: 'Whether to truncate the input texts to fit within the context length.' },
    ]
  },
  'text2vec-contextionary': {
    fields: [
    ]
  },
  'text2vec-databricks': {
    fields: [
      { name: 'endpoint', type: 'string', required: true, description: 'The Databricks endpoint URL.' },
      { name: 'instruction', type: 'string', description: 'Instruction for the embedding model.' },
    ]
  },
  'text2vec-gpt4all': {
    fields: [
    ]
  },
  'text2vec-huggingface': {
    fields: [
      { name: 'endpointURL', type: 'string', description: 'The endpoint URL to use.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'passageModel', type: 'string', description: 'The model to use for passage vectorization.' },
      { name: 'queryModel', type: 'string', description: 'The model to use for query vectorization.' },
      { name: 'useCache', type: 'boolean', description: 'Whether to use the cache.' },
      { name: 'useGPU', type: 'boolean', description: 'Whether to use the GPU.' },
      { name: 'waitForModel', type: 'boolean', description: 'Whether to wait for the model.' },
    ]
  },
  'text2vec-jinaai': {
    fields: [
      { name: 'model', type: 'string', description: 'The model to use (e.g., jina-embeddings-v2-base-en).' },
    ]
  },
  'text2vec-nvidia': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'truncate', type: 'boolean', description: 'Whether to truncate when vectorising.' },
    ]
  },
  'text2vec-mistral': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use (e.g., mistral-embed).' },
    ]
  },
  'text2vec-model2vec': {
    fields: [
      { name: 'inferenceURL', type: 'string', description: 'The URL to use where API requests should go.' },
    ]
  },
  'text2vec-ollama': {
    fields: [
      { name: 'apiEndpoint', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
    ]
  },
  'text2vec-openai': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'model', type: 'string', description: 'The model to use (e.g., text-embedding-3-small).' },
      { name: 'modelVersion', type: 'string', description: 'The model version to use.' },
      { name: 'type', type: 'string', description: 'The type of model to use (text, code).' },
    ]
  },
  'text2vec-google': {
    fields: [
      { name: 'apiEndpoint', type: 'string', description: 'The API endpoint to use without a leading scheme.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'model', type: 'string', description: 'The model ID to use.' },
      { name: 'modelId', type: 'string', description: 'The model ID to use (deprecated - use model instead).' },
      { name: 'projectId', type: 'string', description: 'The project ID to use.' },
      { name: 'titleProperty', type: 'string', description: 'The Weaviate property name to use as the title.' },
    ]
  },
  'text2vec-google-ai-studio': {
    fields: [
      { name: 'model', type: 'string', description: 'The model ID to use.' },
      { name: 'titleProperty', type: 'string', description: 'The Weaviate property name to use as the title.' }
    ]
  },
  'text2vec-transformers': {
    fields: [
      { name: 'dimensions', type: 'number', description: 'The number of dimensions for the generated embeddings.' },
      { name: 'inferenceUrl', type: 'string', description: 'The inference url to use where API requests should go.' },
      { name: 'passageInferenceUrl', type: 'string', description: 'The inference url to use where passage API requests should go.' },
      { name: 'queryInferenceUrl', type: 'string', description: 'The inference url to use where query API requests should go.' },
      { name: 'poolingStrategy', type: 'string', description: 'The pooling strategy to use (masked_mean, cls).' },
    ]
  },
  'text2vec-voyageai': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use.' },
      { name: 'truncate', type: 'boolean', description: 'Whether to truncate the input texts to fit within the context length.' },
    ]
  },
  'text2vec-weaviate': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the vector once embedded.' },
      { name: 'model', type: 'string', description: 'The model to use (e.g., Snowflake/snowflake-arctic-embed-l-v2.0).' },
    ]
  },
  'text2multivec-jinaai': {
    fields: [
      { name: 'dimensions', type: 'number', description: 'The dimensionality of the multi-vector.' },
      { name: 'model', type: 'string', description: 'The model to use.' }
    ]
  },
  'multi2multivec-jinaai': {
    fields: [
      { name: 'imageFields', type: 'string[]', description: 'The image fields used when vectorizing.' },
      { name: 'textFields', type: 'string[]', description: 'The text fields used when vectorizing.' }
    ]
  },
  'text2vec-morph': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL to use where API requests should go.' },
      { name: 'model', type: 'string', description: 'The model to use.' }
    ]
  }
}

/**
 * Type definitions for generative modules
 * These are used for RAG (Retrieval-Augmented Generation) capabilities
 * Based on weaviate-client TypeScript definitions in:
 * node_modules/weaviate-client/dist/node/esm/collections/config/types/generative.d.ts
 */
const GENERATIVE_CONFIG_FIELDS = {
  'generative-openai': {
    fields: [
      { name: 'model', type: 'string', description: 'The OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo).' },
      { name: 'baseURL', type: 'string', description: 'The base URL for OpenAI API.' },
      { name: 'frequencyPenaltyProperty', type: 'number', description: 'Frequency penalty parameter (property-level).' },
      { name: 'maxTokensProperty', type: 'number', description: 'Maximum number of tokens to generate (property-level).' },
      { name: 'presencePenaltyProperty', type: 'number', description: 'Presence penalty parameter (property-level).' },
      { name: 'temperatureProperty', type: 'number', description: 'Temperature for response generation (property-level).' },
      { name: 'topPProperty', type: 'number', description: 'Top-p sampling parameter (property-level).' }
    ]
  },
  'generative-anthropic': {
    fields: [
      { name: 'model', type: 'string', description: 'The Anthropic model to use (e.g., claude-3-opus, claude-3-sonnet).' },
      { name: 'baseURL', type: 'string', description: 'The base URL for Anthropic API.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation (0-1).' },
      { name: 'topK', type: 'number', description: 'Top-k sampling parameter.' },
      { name: 'topP', type: 'number', description: 'Top-p sampling parameter.' },
      { name: 'stopSequences', type: 'string[]', description: 'Stop sequences for generation.' }
    ]
  },
  'generative-anyscale': {
    fields: [
      { name: 'model', type: 'string', description: 'The Anyscale model to use.' },
      { name: 'baseURL', type: 'string', description: 'The base URL for Anyscale API.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' }
    ]
  },
  'generative-aws': {
    fields: [
      { name: 'region', type: 'string', required: true, description: 'The AWS region where the model runs.' },
      { name: 'service', type: 'string', required: true, description: 'The AWS service to use (bedrock).' },
      { name: 'model', type: 'string', description: 'The AWS Bedrock model to use.' },
      { name: 'endpoint', type: 'string', description: 'The endpoint URL for the service.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' }
    ]
  },
  'generative-azure-openai': {
    fields: [
      { name: 'resourceName', type: 'string', required: true, description: 'The Azure resource name.' },
      { name: 'deploymentId', type: 'string', required: true, description: 'The deployment ID.' },
      { name: 'baseURL', type: 'string', description: 'The base URL for Azure OpenAI.' },
      { name: 'frequencyPenaltyProperty', type: 'number', description: 'Frequency penalty parameter (property-level).' },
      { name: 'maxTokensProperty', type: 'number', description: 'Maximum number of tokens to generate (property-level).' },
      { name: 'presencePenaltyProperty', type: 'number', description: 'Presence penalty parameter (property-level).' },
      { name: 'temperatureProperty', type: 'number', description: 'Temperature for response generation (property-level).' },
      { name: 'topPProperty', type: 'number', description: 'Top-p sampling parameter (property-level).' }
    ]
  },
  'generative-cohere': {
    fields: [
      { name: 'model', type: 'string', description: 'The Cohere model to use.' },
      { name: 'kProperty', type: 'number', description: 'Top-k sampling parameter (property-level).' },
      { name: 'maxTokensProperty', type: 'number', description: 'Maximum number of tokens to generate (property-level).' },
      { name: 'returnLikelihoodsProperty', type: 'string', description: 'Return likelihoods setting (property-level).' },
      { name: 'stopSequencesProperty', type: 'string[]', description: 'Stop sequences for generation (property-level).' },
      { name: 'temperatureProperty', type: 'number', description: 'Temperature for response generation (property-level).' }
    ]
  },
  'generative-contextualai': {
    fields: [
      { name: 'model', type: 'string', description: 'The Contextual AI GLM model to use (e.g., v2).' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' },
      { name: 'topP', type: 'number', description: 'Top-p sampling parameter.' },
      { name: 'maxNewTokens', type: 'number', description: 'Maximum number of new tokens to generate.' },
      { name: 'systemPrompt', type: 'string', description: 'System prompt to prepend to generation.' },
      { name: 'avoidCommentary', type: 'boolean', description: 'Whether to avoid commentary in the output.' }
    ]
  },
  'generative-databricks': {
    fields: [
      { name: 'endpoint', type: 'string', required: true, description: 'The Databricks endpoint URL.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' },
      { name: 'topK', type: 'number', description: 'Top-k sampling parameter.' },
      { name: 'topP', type: 'number', description: 'Top-p sampling parameter.' }
    ]
  },
  'generative-friendliai': {
    fields: [
      { name: 'model', type: 'string', description: 'The FriendliAI model to use.' },
      { name: 'baseURL', type: 'string', description: 'The base URL for FriendliAI API.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' }
    ]
  },
  'generative-google': {
    fields: [
      { name: 'projectId', type: 'string', description: 'The GCP project ID.' },
      { name: 'model', type: 'string', description: 'The Google model to use (e.g., gemini-pro).' },
      { name: 'modelId', type: 'string', description: 'The model ID (deprecated - use model instead).' },
      { name: 'apiEndpoint', type: 'string', description: 'The API endpoint URL.' },
      { name: 'maxOutputTokens', type: 'number', description: 'Maximum number of output tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation (0-1).' },
      { name: 'topK', type: 'number', description: 'Top-k sampling parameter.' },
      { name: 'topP', type: 'number', description: 'Top-p sampling parameter.' }
    ]
  },
  'generative-mistral': {
    fields: [
      { name: 'model', type: 'string', description: 'The Mistral model to use.' },
      { name: 'baseURL', type: 'string', description: 'The base URL for Mistral API.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' }
    ]
  },
  'generative-nvidia': {
    fields: [
      { name: 'model', type: 'string', description: 'The NVIDIA model to use (e.g., meta/llama-3.1-8b-instruct).' },
      { name: 'baseURL', type: 'string', description: 'The base URL for NVIDIA NIM API.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' }
    ]
  },
  'generative-ollama': {
    fields: [
      { name: 'model', type: 'string', description: 'The Ollama model to use.' },
      { name: 'apiEndpoint', type: 'string', description: 'The Ollama API endpoint.' }
    ]
  },
  'generative-xai': {
    fields: [
      { name: 'model', type: 'string', description: 'The xAI model to use (e.g., grok-beta).' },
      { name: 'baseURL', type: 'string', description: 'The base URL for xAI API.' },
      { name: 'maxTokens', type: 'number', description: 'Maximum number of tokens to generate.' },
      { name: 'temperature', type: 'number', description: 'Temperature for response generation.' },
      { name: 'topP', type: 'number', description: 'Top-p sampling parameter.' }
    ]
  }
}

/**
 * Configuration fields for reranker modules
 * These are used for reranking search results
 * Based on weaviate-client TypeScript definitions in:
 * node_modules/weaviate-client/dist/node/esm/collections/config/types/reranker.d.ts
 */
const RERANKER_CONFIG_FIELDS = {
  'reranker-cohere': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL where API requests should go.' },
      { name: 'model', type: 'string', description: 'The Cohere reranker model to use (e.g., rerank-english-v2.0, rerank-multilingual-v2.0).' }
    ]
  },
  'reranker-contextualai': {
    fields: [
      { name: 'model', type: 'string', description: 'The Contextual AI reranker model (e.g., ctxl-rerank-v2-instruct-multilingual, ctxl-rerank-v1-instruct).' },
      { name: 'instruction', type: 'string', description: 'Instruction guiding the reranker (e.g., domain-specific guidance).' },
      { name: 'topN', type: 'number', description: 'Number of top results to return after reranking.' }
    ]
  },
  'reranker-jinaai': {
    fields: [
      { name: 'model', type: 'string', description: 'The JinaAI reranker model to use (e.g., jina-reranker-v2-base-multilingual, jina-reranker-v1-base-en).' }
    ]
  },
  'reranker-nvidia': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL for NVIDIA NIM API.' },
      { name: 'model', type: 'string', description: 'The NVIDIA reranker model to use (e.g., nvidia/rerank-qa-mistral-4b).' }
    ]
  },
  'reranker-transformers': {
    fields: []
  },
  'reranker-voyageai': {
    fields: [
      { name: 'baseURL', type: 'string', description: 'The base URL for VoyageAI API.' },
      { name: 'model', type: 'string', description: 'The VoyageAI reranker model to use (e.g., rerank-lite-1).' }
    ]
  }
}

/**
 * Get configuration fields for a specific vectorizer module
 * @param {string} moduleName - The name of the vectorizer module
 * @returns {Array} Array of field definitions
 */
export function getModuleConfigFields(moduleName) {
  return VECTORIZER_CONFIG_FIELDS[moduleName]?.fields || []
}

/**
 * Get configuration fields for a specific generative module
 * @param {string} moduleName - The name of the generative module
 * @returns {Array} Array of field definitions
 */
export function getGenerativeConfigFields(moduleName) {
  return GENERATIVE_CONFIG_FIELDS[moduleName]?.fields || []
}

/**
 * Check if a generative module has configuration options
 * @param {string} moduleName - The name of the generative module
 * @returns {boolean} True if the module has config options
 */
export function hasGenerativeConfigOptions(moduleName) {
  const fields = getGenerativeConfigFields(moduleName)
  return fields && fields.length > 0
}

/**
 * Get configuration fields for a specific reranker module
 * @param {string} moduleName - The name of the reranker module
 * @returns {Array} Array of field definitions
 */
export function getRerankerConfigFields(moduleName) {
  return RERANKER_CONFIG_FIELDS[moduleName]?.fields || []
}

/**
 * Check if a reranker module has configuration options
 * @param {string} moduleName - The name of the reranker module
 * @returns {boolean} True if the module has config options
 */
export function hasRerankerConfigOptions(moduleName) {
  const fields = getRerankerConfigFields(moduleName)
  return fields && fields.length > 0
}

/**
 * Get all available vectorizer modules with their config fields
 * @returns {Object} Object mapping module names to their config fields
 */
export function getAllModuleConfigs() {
  return VECTORIZER_CONFIG_FIELDS
}

/**
 * Check if a module has configuration options
 * @param {string} moduleName - The name of the vectorizer module
 * @returns {boolean} True if the module has config options
 */
export function hasConfigOptions(moduleName) {
  const fields = getModuleConfigFields(moduleName)
  return fields && fields.length > 0
}

/**
 * Get required fields for a module
 * @param {string} moduleName - The name of the vectorizer module
 * @returns {Array} Array of required field names
 */
export function getRequiredFields(moduleName) {
  const fields = getModuleConfigFields(moduleName)
  return fields.filter(f => f.required).map(f => f.name)
}

/**
 * Validate module configuration
 * @param {string} moduleName - The name of the vectorizer module
 * @param {Object} config - The configuration object to validate
 * @returns {Object} Validation result with {valid: boolean, errors: string[]}
 */
export function validateModuleConfig(moduleName, config) {
  const fields = getModuleConfigFields(moduleName)
  const requiredFields = getRequiredFields(moduleName)
  const errors = []

  // Check for missing required fields
  requiredFields.forEach(fieldName => {
    if (!config || config[fieldName] === undefined || config[fieldName] === '') {
      errors.push(`Missing required field: ${fieldName}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
