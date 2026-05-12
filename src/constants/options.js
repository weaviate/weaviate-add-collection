export const tokenizationOptions = [
  { value: 'word', label: 'Word', description: 'Splits on non-alphanumeric characters and lowercases. Best for typical text searches.' },
  { value: 'lowercase', label: 'Lowercase', description: 'Splits on whitespace and lowercases. Preserves symbols like @, _, and -.' },
  { value: 'whitespace', label: 'Whitespace', description: 'Splits on whitespace, preserves case and symbols. Use for case-sensitive data.' },
  { value: 'field', label: 'Field', description: 'No splitting — the entire value is one token. Use for exact-match fields.' },
  { value: 'gse', label: 'GSE', description: 'Chinese text segmentation using the Jieba algorithm. For languages without word boundaries.', featureId: 'tokenizationGse' },
  { value: 'trigram', label: 'Trigram', description: 'Divides text into character trigrams. Designed for CJK (Chinese, Japanese, Korean) languages.', featureId: 'tokenizationTrigram' },
  { value: 'kagome_ja', label: 'Kagome JA', description: 'Japanese morphological analysis for accurate Japanese text segmentation.', featureId: 'tokenizationKagomeJa' },
  { value: 'kagome_kr', label: 'Kagome KR', description: 'Korean morphological analysis for accurate Korean text segmentation.', featureId: 'tokenizationKagomeKr' }
]

export const dataTypeOptions = [
  { value: 'text', label: 'text', description: 'Text data for vectorization and keyword search.', docKey: 'dataTypeText' },
  { value: 'int', label: 'int', description: '64-bit integer values.', docKey: 'dataTypeBooleanIntNumber' },
  { value: 'number', label: 'number', description: 'Floating-point values.', docKey: 'dataTypeBooleanIntNumber' },
  { value: 'boolean', label: 'boolean', description: 'True/false values.', docKey: 'dataTypeBooleanIntNumber' },
  { value: 'date', label: 'date', description: 'RFC 3339 timestamps (e.g. 1985-04-12T23:20:50.52Z).', docKey: 'dataTypeDate' },
  { value: 'uuid', label: 'uuid', description: '128-bit universally unique identifiers.', docKey: 'dataTypeUuid' },
  { value: 'geoCoordinates', label: 'geoCoordinates', description: 'Latitude/longitude for location-based queries. Does not support arrays.', docKey: 'dataTypeGeoCoordinates' },
  { value: 'phoneNumber', label: 'phoneNumber', description: 'Validated and normalized phone numbers with country codes. Does not support arrays.', docKey: 'dataTypePhoneNumber' },
  { value: 'blob', label: 'blob', description: 'Base64-encoded binary data (images, files, etc.). Does not support arrays.', docKey: 'dataTypeBlob' },
  { value: 'object', label: 'object', description: 'Nested JSON objects with arbitrary depth.', docKey: 'dataTypeObject' },
  { value: 'cross-reference', label: 'cross-reference', description: 'Links this property to objects in another collection.', docKey: 'crossReference' }
]

export const PRIMITIVE_DATA_TYPES = new Set([
  'text', 'int', 'number', 'boolean', 'date', 'uuid',
  'geoCoordinates', 'phoneNumber', 'blob', 'object'
])

export const indexTypeOptions = [
  { value: 'hnsw', label: 'HNSW (Recommended)', description: 'Graph-based ANN index. Scales well and delivers fast queries, at the cost of higher memory usage.', docKey: 'indexHnsw' },
  { value: 'flat', label: 'Flat', description: 'Brute-force index. Best for small collections or multi-tenant setups with few objects per tenant.', docKey: 'indexFlat' },
  { value: 'dynamic', label: 'Dynamic', description: 'Starts as a Flat index and automatically switches to HNSW once the object count exceeds a threshold.', featureId: 'dynamicIndexType', docKey: 'indexDynamic' },
  { value: 'hfresh', label: 'HFresh (Preview)', description: 'Cluster-based index with built-in RQ compression — optimized for large, high-dimensional collections.', featureId: 'hfreshIndexType', docKey: 'indexHfresh' }
]

// All available modules from Weaviate
export const allAvailableModules = {
  'generative-anthropic': {
    documentationHref: 'https://docs.anthropic.com/en/api/getting-started',
    name: 'Generative Search - Anthropic'
  },
  'generative-anyscale': {
    documentationHref: 'https://docs.anyscale.com/endpoints/text-generation/',
    name: 'Generative Search - Anyscale'
  },
  'generative-aws': {
    documentationHref: 'https://docs.aws.amazon.com/bedrock/latest/APIReference/welcome.html',
    name: 'Generative Search - AWS'
  },
  'generative-azure-openai': {
    documentationHref: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/',
    name: 'Generative Search - Azure OpenAI'
  },
  'generative-cohere': {
    documentationHref: 'https://docs.cohere.com/reference/chat',
    name: 'Generative Search - Cohere'
  },
  'generative-contextualai': {
    documentationHref: 'https://docs.contextual.ai/api-reference/generate/generate',
    name: 'Generative Search - Contextual AI',
    featureId: 'generativeContextualai'
  },
  'generative-databricks': {
    documentationHref: 'https://docs.databricks.com/en/generative-ai/generative-ai.html',
    name: 'Generative Search - Databricks'
  },
  'generative-friendliai': {
    documentationHref: 'https://docs.friendli.ai/',
    name: 'Generative Search - FriendliAI'
  },
  'generative-google': {
    documentationHref: 'https://cloud.google.com/vertex-ai/docs/generative-ai/chat/test-chat-prompts',
    name: 'Generative Search - Google'
  },
  'generative-mistral': {
    documentationHref: 'https://docs.mistral.ai/api/',
    name: 'Generative Search - Mistral'
  },
  'generative-nvidia': {
    documentationHref: 'https://docs.nvidia.com/nim/',
    name: 'Generative Search - NVIDIA'
  },
  'generative-ollama': {
    documentationHref: 'https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-completion',
    name: 'Generative Search - Ollama'
  },
  'generative-openai': {
    documentationHref: 'https://platform.openai.com/docs/api-reference/completions',
    name: 'Generative Search - OpenAI'
  },
  'generative-xai': {
    documentationHref: 'https://docs.x.ai/api',
    name: 'Generative Search - xAI'
  },
  'multi2vec-cohere': {
    documentationHref: 'https://docs.cohere.com/docs/embed-2',
    name: 'Cohere Multimodal Module'
  },
  'multi2vec-google': {
    documentationHref: 'https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings',
    name: 'Google Multimodal Module'
  },
  'qna-openai': {
    documentationHref: 'https://platform.openai.com/docs/api-reference/completions',
    name: 'OpenAI Question & Answering Module'
  },
  'ref2vec-centroid': {
    name: 'Ref2Vec Centroid'
  },
  'reranker-cohere': {
    documentationHref: 'https://txt.cohere.com/rerank/',
    name: 'Reranker - Cohere'
  },
  'reranker-contextualai': {
    documentationHref: 'https://docs.contextual.ai/api-reference/rerank/rerank',
    name: 'Reranker - Contextual AI',
    featureId: 'rerankerContextualai'
  },
  'reranker-jinaai': {
    documentationHref: 'https://jina.ai/reranker',
    name: 'Reranker - Jinaai'
  },
  'reranker-nvidia': {
    documentationHref: 'https://docs.nvidia.com/nim/nemo-retriever/reranking/latest/index.html',
    name: 'Reranker - NVIDIA'
  },
  'reranker-transformers': {
    documentationHref: 'https://weaviate.io/developers/weaviate/model-providers/transformers/reranker',
    name: 'Reranker - Transformers'
  },
  'reranker-voyageai': {
    documentationHref: 'https://docs.voyageai.com/reference/reranker-api',
    name: 'Reranker - VoyageAI'
  },
  'text2vec-aws': {
    documentationHref: 'https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html',
    name: 'AWS Module'
  },
  'text2vec-cohere': {
    documentationHref: 'https://docs.cohere.ai/embedding-wiki/',
    name: 'Cohere Module'
  },
  'text2vec-google': {
    documentationHref: 'https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings',
    name: 'Google Module'
  },
  'text2vec-huggingface': {
    documentationHref: 'https://huggingface.co/docs/api-inference/detailed_parameters#feature-extraction-task',
    name: 'Hugging Face Module'
  },
  'text2vec-jinaai': {
    documentationHref: 'https://jina.ai/embeddings/',
    name: 'JinaAI Module'
  },
  'text2vec-mistral': {
    documentationHref: 'https://docs.mistral.ai/api/#operation/createEmbedding',
    name: 'Mistral Module'
  },
  'text2vec-ollama': {
    documentationHref: 'https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings',
    name: 'Ollama Module'
  },
  'text2vec-openai': {
    documentationHref: 'https://platform.openai.com/docs/guides/embeddings/what-are-embeddings',
    name: 'OpenAI Module'
  },
  'text2vec-voyageai': {
    documentationHref: 'https://docs.voyageai.com/docs/embeddings',
    name: 'VoyageAI Module'
  },
  'text2vec-weaviate': {
    documentationHref: 'https://api.embedding.weaviate.io',
    name: 'Weaviate Embedding Module'
  }
}

// Filter out backup modules and return vectorizer modules for select options
export function getVectorizerModuleOptions(availableModules = null) {
  const modules = availableModules || allAvailableModules
  
  return Object.entries(modules)
    .filter(([key]) => {
      // Remove backup, generative, and reranker modules
      return !key.startsWith('backup-') && 
             !key.startsWith('generative-') && 
             !key.startsWith('reranker-')
    })
    .map(([key, value]) => ({
      value: key,
      label: value.name || key,
      documentationHref: value.documentationHref,
      featureId: value.featureId
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
