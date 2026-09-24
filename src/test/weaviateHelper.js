import weaviate from 'weaviate-client'

/**
 * Get a Weaviate client connected to localhost
 */
export async function getWeaviateClient() {
  const client = await weaviate.connectToLocal()
  return client
}

/**
 * Create a collection in Weaviate from a JSON schema
 */
export async function createCollection(client, collectionJson) {
  // Convert the JSON format (with 'class' field) to Weaviate v4 client format
  const collectionName = collectionJson.class
  
  // Build the collection creation config
  const config = {
    name: collectionName,
    description: collectionJson.description,
  }
  
  // Add properties if they exist
  if (collectionJson.properties && Array.isArray(collectionJson.properties)) {
    config.properties = collectionJson.properties.map(prop => {
      const baseDataType = Array.isArray(prop.dataType) ? prop.dataType[0] : prop.dataType
      const cleanDataType = baseDataType.replace('[]', '')
      
      const propConfig = {
        name: prop.name,
        dataType: baseDataType,
        description: prop.description,
        indexFilterable: prop.indexFilterable,
      }
      
      // Only add indexSearchable and tokenization for text types
      if (cleanDataType === 'text' && prop.indexSearchable !== undefined) {
        propConfig.indexSearchable = prop.indexSearchable
      }
      
      if (cleanDataType === 'text' && prop.tokenization) {
        propConfig.tokenization = prop.tokenization
      }
      
      // Only add indexRangeFilters for numeric and date types
      if (['int', 'number', 'date'].includes(cleanDataType) && prop.indexRangeFilters !== undefined) {
        propConfig.indexRangeFilters = prop.indexRangeFilters
      }
      
      return propConfig
    })
  }
  
  // Add vectorConfig if it exists
  if (collectionJson.vectorConfig) {
    const vectorConfigs = Object.entries(collectionJson.vectorConfig)
    
    // For now, only handle 'none' vectorizer and simple configs
    // This is because the Weaviate v4 client has a different API for vectorizers
    if (vectorConfigs.length > 0) {
      const [name, vectorConfig] = vectorConfigs[0]
      const vectorizerName = Object.keys(vectorConfig.vectorizer)[0]
      
      // Only handle 'none' vectorizer for simplicity in tests
      if (vectorizerName === 'none') {
        config.vectorizers = weaviate.configure.vectorizer.none([name])
      }
      // You can add more vectorizer types here as needed
    }
  }
  
  const collection = await client.collections.create(config)
  return collection
}

/**
 * Get a collection from Weaviate
 */
export async function getCollection(client, collectionName) {
  return client.collections.get(collectionName)
}

/**
 * Delete a collection from Weaviate if it exists
 */
export async function deleteCollection(client, collectionName) {
  try {
    await client.collections.delete(collectionName)
  } catch (error) {
    // Ignore if collection doesn't exist
    if (!error.message.includes('not found')) {
      throw error
    }
  }
}

/**
 * Export collection schema from Weaviate
 */
export async function exportCollectionSchema(client, collectionName) {
  const collection = await client.collections.get(collectionName)
  const config = await collection.config.get()
  
  // Convert Weaviate config back to our JSON format
  const schema = {
    class: config.name,
    name: config.name, // Also add 'name' for Component compatibility
    description: config.description || '',
  }
  
  // Add properties
  if (config.properties && config.properties.length > 0) {
    schema.properties = config.properties.map(prop => {
      const cleanDataType = prop.dataType.replace('[]', '')
      
      const propertyConfig = {
        name: prop.name,
        dataType: [prop.dataType],
        description: prop.description || '',
        indexFilterable: prop.indexFilterable ?? true,
      }
      
      // Only add indexSearchable and tokenization for text types
      if (cleanDataType === 'text') {
        propertyConfig.indexSearchable = prop.indexSearchable ?? true
        propertyConfig.tokenization = prop.tokenization || 'word'
      } else {
        propertyConfig.indexSearchable = false
      }
      
      // Only add indexRangeFilters for numeric and date types
      if (['int', 'number', 'date'].includes(cleanDataType)) {
        propertyConfig.indexRangeFilters = prop.indexRangeFilters ?? false
      } else {
        propertyConfig.indexRangeFilters = false
      }
      
      return propertyConfig
    })
  }
  
  // Add vectorConfig - Weaviate v4 client uses 'vectorizers' array
  if (config.vectorizers && Array.isArray(config.vectorizers)) {
    schema.vectorConfig = {}
    config.vectorizers.forEach((vectorizer) => {
      const vecName = vectorizer.name || 'default'
      let vecIndexType = vectorizer.indexType || 'hnsw'
      const vecConfig = vectorizer.vectorizer || {}
      
      // Extract vectorizer type and config
      let vectorizerType = 'none'
      let vectorizerConfig = {}
      
      if (typeof vecConfig === 'object' && vecConfig !== null) {
        // The vectorizer object might have a type property or be structured differently
        vectorizerType = vecConfig.name || vecConfig.type || 'none'
        vectorizerConfig = vecConfig.config || {}
      }

      // Normalize naming differences for export (UI supports both on import)
      if (vectorizerConfig && vectorizerConfig.vectorizeClassName !== undefined && vectorizerConfig.vectorizeCollectionName === undefined) {
        vectorizerConfig.vectorizeCollectionName = vectorizerConfig.vectorizeClassName
      }
      
      // Infer dynamic index type when indexConfig indicates dynamic behavior
      const indexConfig = vectorizer.indexConfig || {}
      if (vecIndexType !== 'dynamic' && (indexConfig?.threshold !== undefined || (indexConfig?.hnsw && indexConfig?.flat))) {
        vecIndexType = 'dynamic'
      }

      schema.vectorConfig[vecName] = {
        vectorizer: {
          [vectorizerType]: vectorizerConfig
        },
        vectorIndexType: vecIndexType,
      }
      
      if (indexConfig && Object.keys(indexConfig).length > 0) {
        schema.vectorConfig[vecName].vectorIndexConfig = indexConfig
      }
      
      if (vectorizer.quantizer) {
        schema.vectorConfig[vecName].quantizer = vectorizer.quantizer
      }
    })
  } else if (config.vectorConfig) {
    // Fallback: try the old structure
    schema.vectorConfig = {}
    Object.entries(config.vectorConfig).forEach(([name, vectorConfig]) => {
      const vectorizerName = Object.keys(vectorConfig.vectorizer)[0]
      const vectorizerConfig = { ...(vectorConfig.vectorizer[vectorizerName] || {}) }
      // Normalize naming differences for export
      if (vectorizerConfig.vectorizeClassName !== undefined && vectorizerConfig.vectorizeCollectionName === undefined) {
        vectorizerConfig.vectorizeCollectionName = vectorizerConfig.vectorizeClassName
      }
      // Infer dynamic
      let vecIndexType = vectorConfig.vectorIndexType
      const indexConfig = vectorConfig.vectorIndexConfig || {}
      if (vecIndexType !== 'dynamic' && (indexConfig?.threshold !== undefined || (indexConfig?.hnsw && indexConfig?.flat))) {
        vecIndexType = 'dynamic'
      }
      
      schema.vectorConfig[name] = {
        vectorizer: {
          [vectorizerName]: vectorizerConfig
        },
        vectorIndexType: vecIndexType,
      }
      
      if (indexConfig && Object.keys(indexConfig).length > 0) {
        schema.vectorConfig[name].vectorIndexConfig = indexConfig
      }
      
      if (vectorConfig.quantizer) {
        schema.vectorConfig[name].quantizer = vectorConfig.quantizer
      }
    })
  }
  
  return schema
}

// ─── Raw REST schema helpers ──────────────────────────────────────────────────

const WEAVIATE_REST = 'http://localhost:8080/v1/schema'

/**
 * POST a schema to Weaviate exactly as the component emitted it.
 *
 * The typed `createCollection` above rebuilds a CollectionConfigCreate by hand
 * and silently drops anything it does not know about, and the client's read
 * path rewrites some fields on the way back (asciiFold/asciiFoldIgnore become
 * an ergonomic union, and NestedPropertyCreate has no textAnalyzer at all).
 * That makes it the wrong tool for checking what this component produces --
 * it would test the helper, not the schema. These two send and read the raw
 * REST payload instead.
 */
export async function postRawSchema(collectionJson) {
  const response = await fetch(WEAVIATE_REST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectionJson),
  })
  if (!response.ok) {
    throw new Error(`Weaviate rejected the schema (${response.status}): ${await response.text()}`)
  }
  return response.json()
}

/** GET a collection's schema as raw JSON. */
export async function getRawSchema(collectionName) {
  const response = await fetch(`${WEAVIATE_REST}/${collectionName}`)
  if (!response.ok) {
    throw new Error(`Could not read schema for ${collectionName} (${response.status})`)
  }
  return response.json()
}

/**
 * Delete a collection, ignoring "not found" so it is safe in cleanup.
 *
 * Only 404 is swallowed. A 500 or a connection failure means the collection is
 * probably still there, and silently ignoring it leaves a stale schema that
 * makes the next run of the same test fail for an unrelated reason.
 */
export async function deleteRawSchema(collectionName) {
  const response = await fetch(`${WEAVIATE_REST}/${collectionName}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(`Could not delete ${collectionName} (${response.status}): ${await response.text()}`)
  }
}
