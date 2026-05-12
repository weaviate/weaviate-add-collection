/**
 * Central registry: featureId -> minimum Weaviate version string.
 *
 * When a weaviateVersion prop is set on <Collection>, any VersionGated
 * component or useVersionFilteredOptions call referencing one of these IDs
 * will be disabled/filtered if the running version is below the minimum.
 *
 * Add new entries here whenever a Weaviate release introduces a new field,
 * section, or dropdown option.
 */
export const VERSION_FEATURES = {
  // Multi-tenancy
  multiTenancy:                '1.20.0',
  autoTenantCreation:          '1.25.2',
  autoTenantActivation:        '1.25.2',

  // Replication
  replicationAsyncEnabled:     '1.29.0',
  replicationDeletionStrategy: '1.28.0',
  replicationAsyncConfig:      '1.36.0',

  // Vector index types & compression
  dynamicIndexType:            '1.25.0',
  hfreshIndexType:             '1.36.0',  // HFresh cluster-based index (preview)
  rqQuantizationHnsw:          '1.35.0',  // RQ for HNSW index
  rqQuantizationFlat:          '1.35.0',  // RQ for Flat index

  // Property indexing
  indexRangeFilters:           '1.24.0',

  // Object TTL
  objectTtl:                   '1.35.0',

  // Tokenization methods
  tokenizationGse:             '1.24.0',
  tokenizationTrigram:         '1.24.0',
  tokenizationKagomeKr:        '1.25.7',
  tokenizationKagomeJa:        '1.28.0',

  // Modules
  generativeContextualai:      '1.34.0',
  rerankerContextualai:        '1.34.0',
}
