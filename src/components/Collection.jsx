import React, { useEffect, useState } from 'react'
import { VersionProvider, VersionGatedSection } from '../context/VersionContext'
import DOC_LINKS from '../constants/docLinks.json'
import PropertySection from './PropertySection'
import VectorConfigSection from './VectorConfigSection'
import InvertedIndexConfigSection from './InvertedIndexConfigSection'
import MultiTenancyConfigSection from './MultiTenancyConfigSection'
import ObjectTtlConfigSection from './ObjectTtlConfigSection'
import ReplicationConfigSection from './ReplicationConfigSection'
import GenerativeConfigSection from './GenerativeConfigSection'
import RerankerConfigSection from './RerankerConfigSection'
import { validateCollectionName, sanitizeCollectionName } from '../utils/collectionNameValidator'
import { DEFAULT_REPLICATION_ASYNC_CONFIG } from '../constants/replicationDefaults'

// Contract:
// Inputs: optional `initialJson` object with { name, description }
//         optional `availableModules` object with available vectorizer modules
//         optional `nodesNumber` number representing the number of nodes (used as max for replication factor)
//         optional `onChange` callback function called whenever the schema changes with the current JSON schema
//         optional `onSubmit` callback function that can be called to submit the final schema
//         optional `hideCreateButton` boolean to hide the "Create Collection" button (useful when using hooks)
// Outputs: Programmatic access to schema via onChange/onSubmit callbacks instead of DOM scraping.

export default function Collection({
  initialJson = null,
  availableModules = null,
  nodesNumber = null,
  onChange = null,
  onSubmit = null,
  hideCreateButton = false,
  weaviateVersion = null
}) {
  const [name, setName] = useState(
    initialJson ? (initialJson.name ?? initialJson.class ?? '') : ''
  )
  const [description, setDescription] = useState(
    initialJson ? (initialJson.description ?? '') : ''
  )
  const [nameValidation, setNameValidation] = useState({ valid: true, error: null, warning: null })
  const [generatedJson, setGeneratedJson] = useState({})
  const [invertedIndexConfig, setInvertedIndexConfig] = useState({
    bm25_b: 0.75,
    bm25_k1: 1.2,
    cleanup_interval_seconds: 60,
    index_timestamps: false,
    index_property_length: false,
    index_null_state: false,
    stopwords_preset: 'en',
    stopwords_additions: [],
    stopwords_removals: [],
  })
  const [multiTenancyConfig, setMultiTenancyConfig] = useState({
    enabled: false,
    autoTenantCreation: false,
    autoTenantActivation: false,
  })
  const [replicationConfig, setReplicationConfig] = useState({
    factor: null,
    asyncEnabled: false,
    deletionStrategy: 'NoAutomatedResolution',
    asyncConfig: { ...DEFAULT_REPLICATION_ASYNC_CONFIG },
  })
  const [generativeConfig, setGenerativeConfig] = useState({
    enabled: false,
    module: '',
    moduleConfig: {},
  })
  const [rerankerConfig, setRerankerConfig] = useState({
    enabled: false,
    module: '',
    moduleConfig: {},
  })
  const [openBasic, setOpenBasic] = useState(true)
  const [openProperties, setOpenProperties] = useState(true)
  const [openVectorConfig, setOpenVectorConfig] = useState(false)
  const [openInvertedIndexConfig, setOpenInvertedIndexConfig] = useState(false)
  const [openMultiTenancyConfig, setOpenMultiTenancyConfig] = useState(false)
  const [objectTtlConfig, setObjectTtlConfig] = useState({ mode: 'none', timeToLive: '', filterExpiredObjects: false, propertyName: '' })
  const [openObjectTtlConfig, setOpenObjectTtlConfig] = useState(false)
  const [openReplicationConfig, setOpenReplicationConfig] = useState(false)
  const [openGenerativeConfig, setOpenGenerativeConfig] = useState(false)
  const [openRerankerConfig, setOpenRerankerConfig] = useState(false)

  // Validate collection name whenever it changes
  useEffect(() => {
    if (name) {
      const validation = validateCollectionName(name)
      setNameValidation(validation)
    } else {
      setNameValidation({ valid: true, error: null, warning: null })
    }
  }, [name])

  // Update replication factor when nodesNumber changes
  useEffect(() => {
    if (nodesNumber && nodesNumber > 1 && !initialJson?.replicationConfig) {
      setReplicationConfig(prev => ({
        ...prev,
        factor: nodesNumber
      }))
    }
  }, [nodesNumber, initialJson])

  useEffect(() => {
    // Handle both 'name' and 'class' fields for backwards compatibility
    setName(initialJson?.name || initialJson?.class || '')
    setDescription(initialJson?.description || '')
    
    // Helper function to recursively process properties and their nested properties
    const processProperty = (p) => {
      // ...existing code...
      let dataTypeValue
      if (Array.isArray(p.dataType)) {
        dataTypeValue = p.dataType[0]
      } else if (typeof p.dataType === 'string') {
        dataTypeValue = p.dataType
      } else {
        dataTypeValue = 'text'
      }
      const isArrayType = dataTypeValue ? dataTypeValue.includes('[]') : false
      const baseDataType = dataTypeValue ? dataTypeValue.replace('[]', '') : 'text'

      // Detect cross-references: a dataType that is not a known primitive starts with uppercase
      const primitiveTypes = new Set(['text', 'int', 'number', 'boolean', 'date', 'uuid', 'geoCoordinates', 'phoneNumber', 'blob', 'object'])
      const isCrossRef = baseDataType && !primitiveTypes.has(baseDataType) && /^[A-Z]/.test(baseDataType)

      if (isCrossRef) {
        return {
          name: p.name || '',
          description: p.description || '',
          dataType: 'cross-reference',
          crossReferenceTarget: baseDataType,
          isArray: false,
          indexFilterable: false
        }
      }

      let vectorizePropertyName
      if (baseDataType === 'text' && ((p.moduleConfig && typeof p.moduleConfig === 'object') || (p.vectorizerConfig && typeof p.vectorizerConfig === 'object'))) {
        try {
          const configs = {
            ...(p.moduleConfig || {}),
            ...(p.vectorizerConfig || {})
          }
          const anyTrue = Object.values(configs).some(cfg => cfg && typeof cfg === 'object' && cfg.vectorizePropertyName === true)
          if (anyTrue) vectorizePropertyName = true
        } catch (_) {}
      }

      const result = {
        name: p.name || '',
        dataType: baseDataType,
        description: p.description || '',
        indexFilterable: p.indexFilterable ?? true,
        indexRangeFilters: p.indexRangeFilters ?? false,
        indexSearchable: p.indexSearchable ?? true,
        isArray: isArrayType,
        tokenization: p.tokenization || 'word',
        ...(vectorizePropertyName === true ? { vectorizePropertyName: true } : {})
      }

      // Process nested properties recursively for object type
      if (baseDataType === 'object' && p.nestedProperties && Array.isArray(p.nestedProperties)) {
        result.nestedProperties = p.nestedProperties.map(processProperty)
      }

      return result
    }
    
    // Also load properties from imported JSON
    if (initialJson?.properties && Array.isArray(initialJson.properties)) {
      setProperties(initialJson.properties.map(processProperty))
    }

    // Load invertedIndexConfig from imported JSON if present
    if (initialJson?.invertedIndexConfig && typeof initialJson.invertedIndexConfig === 'object') {
      const cfg = initialJson.invertedIndexConfig
      setInvertedIndexConfig({
        bm25_b: cfg.bm25?.b ?? 0.75,
        bm25_k1: cfg.bm25?.k1 ?? 1.2,
        cleanup_interval_seconds: cfg.cleanupIntervalSeconds ?? 60,
        index_null_state: cfg.indexNullState ?? false,
        index_property_length: cfg.indexPropertyLength ?? false,
        index_timestamps: cfg.indexTimestamps ?? false,
        stopwords_preset: cfg.stopwords?.preset ?? 'en',
        stopwords_additions: cfg.stopwords?.additions ?? [],
        stopwords_removals: cfg.stopwords?.removals ?? [],
      })
    }
    // Load multiTenancyConfig from imported JSON if present
    if (initialJson?.multiTenancyConfig && typeof initialJson.multiTenancyConfig === 'object') {
      const cfg = initialJson.multiTenancyConfig
      setMultiTenancyConfig({
        enabled: cfg.enabled ?? false,
        autoTenantCreation: cfg.autoTenantCreation ?? false,
        autoTenantActivation: cfg.autoTenantActivation ?? false,
      })
    }
    // Load objectTtlConfig from imported JSON if present
    if (initialJson?.objectTtlConfig && typeof initialJson.objectTtlConfig === 'object') {
      const cfg = initialJson.objectTtlConfig
      const deleteOn = cfg.deleteOn ?? ''
      const isNamedMode = deleteOn === 'creationTime' || deleteOn === 'updateTime'
      setObjectTtlConfig({
        // deleteOn is either a fixed mode or a property name (dateProperty)
        mode: isNamedMode ? deleteOn : (deleteOn ? 'dateProperty' : 'none'),
        timeToLive: cfg.timeToLive ?? '',
        filterExpiredObjects: cfg.filterExpiredObjects ?? false,
        propertyName: isNamedMode ? '' : deleteOn,
      })
    }
    // Load replicationConfig from imported JSON if present
    if (initialJson?.replicationConfig && typeof initialJson.replicationConfig === 'object') {
      const cfg = initialJson.replicationConfig
      const ac = cfg.asyncConfig || {}
      const asyncConfig = Object.fromEntries(
        Object.keys(DEFAULT_REPLICATION_ASYNC_CONFIG).map(key => [key, ac[key] != null ? ac[key] : ''])
      )
      setReplicationConfig({
        factor: cfg.factor ?? 1,
        asyncEnabled: cfg.asyncEnabled ?? false,
        deletionStrategy: cfg.deletionStrategy ?? 'NoAutomatedResolution',
        asyncConfig,
      })
    }
    // Load generativeConfig from imported JSON if present
    // Support both moduleConfig.generative-* (current) and legacy top-level generative key
    const genSource = initialJson?.moduleConfig || initialJson?.generative || {}
    const genModuleKey = Object.keys(genSource).find(key => key.startsWith('generative-'))
    if (genModuleKey) {
      setGenerativeConfig({
        enabled: true,
        module: genModuleKey,
        moduleConfig: genSource[genModuleKey] || {},
      })
    }
    // Load rerankerConfig from imported JSON if present
    if (initialJson?.moduleConfig && typeof initialJson.moduleConfig === 'object') {
      const modCfg = initialJson.moduleConfig
      
      // Check for two possible structures:
      // 1. Direct structure: { "reranker-cohere": { ... } }
      // 2. Nested structure: { "name": "reranker-cohere", "config": { ... } }
      
      let rerankerKey = null
      let rerankerModuleConfig = {}
      
      // First try to find a key that starts with 'reranker-'
      rerankerKey = Object.keys(modCfg).find(key => key.startsWith('reranker-'))
      
      if (rerankerKey) {
        // Direct structure
        rerankerModuleConfig = modCfg[rerankerKey] || {}
      } else if (modCfg.name && typeof modCfg.name === 'string' && modCfg.name.startsWith('reranker-')) {
        // Nested structure with 'name' and 'config'
        rerankerKey = modCfg.name
        rerankerModuleConfig = modCfg.config || {}
      }
      
      if (rerankerKey) {
        setRerankerConfig({
          enabled: true,
          module: rerankerKey,
          moduleConfig: rerankerModuleConfig,
        })
      }
    }
    // Fill vectorConfigs from the imported JSON
    // Support both legacy object map (vectorConfig) and Weaviate v4 array (vectorizers)
    if (initialJson?.vectorConfig && typeof initialJson.vectorConfig === 'object') {
      const configs = Object.entries(initialJson.vectorConfig).map(([name, config]) => {
        // Extract name, vectorizer, indexType, indexConfig
        const vectorizerKey = config.vectorizer ? Object.keys(config.vectorizer)[0] : ''
        const moduleConfig = vectorizerKey ? config.vectorizer[vectorizerKey] : {}
        
  // Handle indexConfig - need to process quantizers correctly
  let indexConfig = config.vectorIndexConfig || {}
  let indexType = config.vectorIndexType || 'hnsw'
        
        // For dynamic index type, extract quantizers from hnsw and flat sub-configs
        if (indexType === 'dynamic') {
          const processedIndexConfig = { ...indexConfig }
          
          // Process HNSW quantizer
          if (indexConfig.hnsw) {
            const hnswConfig = { ...indexConfig.hnsw }
            // Check for PQ, BQ, SQ, or RQ configuration and extract quantizer
            if (indexConfig.hnsw.pq) {
              hnswConfig.quantizer = 'pq'
              hnswConfig.pq = indexConfig.hnsw.pq
            } else if (indexConfig.hnsw.bq) {
              hnswConfig.quantizer = 'bq'
              hnswConfig.bq = indexConfig.hnsw.bq
            } else if (indexConfig.hnsw.sq) {
              hnswConfig.quantizer = 'sq'
              hnswConfig.sq = indexConfig.hnsw.sq
            } else if (indexConfig.hnsw.rq) {
              hnswConfig.quantizer = 'rq'
              hnswConfig.rq = indexConfig.hnsw.rq
            } else {
              hnswConfig.quantizer = 'none'
            }
            processedIndexConfig.hnsw = hnswConfig
          }
          
          // Process Flat quantizer (BQ and RQ supported)
          if (indexConfig.flat) {
            const flatConfig = { ...indexConfig.flat }
            if (indexConfig.flat.bq) {
              flatConfig.quantizer = 'bq'
              flatConfig.bq = indexConfig.flat.bq
            } else if (indexConfig.flat.rq) {
              flatConfig.quantizer = 'rq'
              flatConfig.rq = indexConfig.flat.rq
            } else {
              flatConfig.quantizer = 'none'
            }
            processedIndexConfig.flat = flatConfig
          }
          
          indexConfig = processedIndexConfig
        } else {
          // For non-dynamic types (HNSW, Flat), quantizers are directly in indexConfig
          // Need to detect and set the quantizer type
          const processedIndexConfig = { ...indexConfig }
          
          if (indexType === 'hnsw') {
            // Detect quantizer type from existing properties
            // Check both root level and hnsw nested level
            const hnswConfig = indexConfig.hnsw || {}
            if (indexConfig.pq || hnswConfig.pq) {
              processedIndexConfig.quantizer = 'pq'
              if (hnswConfig.pq && !processedIndexConfig.pq) {
                processedIndexConfig.pq = hnswConfig.pq
              }
            } else if (indexConfig.bq || hnswConfig.bq) {
              processedIndexConfig.quantizer = 'bq'
              if (hnswConfig.bq && !processedIndexConfig.bq) {
                processedIndexConfig.bq = hnswConfig.bq
              }
            } else if (indexConfig.sq || hnswConfig.sq) {
              processedIndexConfig.quantizer = 'sq'
              if (hnswConfig.sq && !processedIndexConfig.sq) {
                processedIndexConfig.sq = hnswConfig.sq
              }
            } else if (indexConfig.rq || hnswConfig.rq) {
              processedIndexConfig.quantizer = 'rq'
              if (hnswConfig.rq && !processedIndexConfig.rq) {
                processedIndexConfig.rq = hnswConfig.rq
              }
            }
          } else if (indexType === 'flat') {
            // Flat only supports BQ and RQ
            if (indexConfig.bq) {
              processedIndexConfig.quantizer = 'bq'
            } else if (indexConfig.rq) {
              processedIndexConfig.quantizer = 'rq'
            }
          } else if (indexType === 'hfresh') {
            // Map distance → distanceMetric for UI consistency
            if (indexConfig.distance && !indexConfig.distanceMetric) {
              processedIndexConfig.distanceMetric = indexConfig.distance
              delete processedIndexConfig.distance
            }
            // rq is always-on and immutable — remove from state (no UI toggle)
            delete processedIndexConfig.rq
          }

          indexConfig = processedIndexConfig
        }
        // Heuristic: if both hnsw and flat configs exist or threshold is present, treat as dynamic
        if (indexType !== 'dynamic' && (indexConfig?.threshold !== undefined || (indexConfig?.hnsw && indexConfig?.flat))) {
          indexType = 'dynamic'
        }
        // Normalize moduleConfig naming differences
        if (moduleConfig && moduleConfig.vectorizeCollectionName !== undefined && moduleConfig.vectorizeClassName === undefined) {
          moduleConfig.vectorizeClassName = moduleConfig.vectorizeCollectionName
        }
        
        return {
          name,
          // If vectorizer is 'none', treat as bring-your-own for UI purposes
          vectorizer: vectorizerKey === 'none' ? '' : vectorizerKey,
          bringOwnVectors: vectorizerKey === 'none',
          moduleConfig,
          indexType,
          indexConfig,
          // Note: No longer using separate quantization field
          vectorizeClassName: moduleConfig?.vectorizeClassName || false
        }
      })
      setVectorConfigs(configs)
    } else if (Array.isArray(initialJson?.vectorizers)) {
      // Weaviate v4 export style: vectorizers is an array
      const configs = (initialJson.vectorizers || []).map((vz, idx) => {
        const name = vz.name || (idx === 0 ? 'default' : `vector_config_${idx + 1}`)
        let indexType = vz.indexType || 'hnsw'

        // Extract vectorizer module name and its config flexibly
        let vectorizerKey = ''
        let moduleConfig = {}
        const v = vz.vectorizer
        if (v && typeof v === 'object') {
          if ('name' in v || 'type' in v) {
            vectorizerKey = v.name || v.type || ''
            moduleConfig = v.config || {}
          } else {
            const keys = Object.keys(v)
            if (keys.length > 0) {
              vectorizerKey = keys[0]
              moduleConfig = v[vectorizerKey] || {}
            }
          }
        }

        // Handle index config and dynamic quantizers
  let indexConfig = vz.indexConfig || {}
  if (indexType === 'dynamic') {
          const processedIndexConfig = { ...indexConfig }

          if (indexConfig.hnsw) {
            const hnswConfig = { ...indexConfig.hnsw }
            if (indexConfig.hnsw.pq) {
              hnswConfig.quantizer = 'pq'
              hnswConfig.pq = indexConfig.hnsw.pq
            } else if (indexConfig.hnsw.bq) {
              hnswConfig.quantizer = 'bq'
              hnswConfig.bq = indexConfig.hnsw.bq
            } else if (indexConfig.hnsw.sq) {
              hnswConfig.quantizer = 'sq'
              hnswConfig.sq = indexConfig.hnsw.sq
            } else if (indexConfig.hnsw.rq) {
              hnswConfig.quantizer = 'rq'
              hnswConfig.rq = indexConfig.hnsw.rq
            } else {
              hnswConfig.quantizer = 'none'
            }
            processedIndexConfig.hnsw = hnswConfig
          }

          if (indexConfig.flat) {
            const flatConfig = { ...indexConfig.flat }
            if (indexConfig.flat.bq) {
              flatConfig.quantizer = 'bq'
              flatConfig.bq = indexConfig.flat.bq
            } else if (indexConfig.flat.rq) {
              flatConfig.quantizer = 'rq'
              flatConfig.rq = indexConfig.flat.rq
            } else {
              flatConfig.quantizer = 'none'
            }
            processedIndexConfig.flat = flatConfig
          }

          indexConfig = processedIndexConfig
        } else {
          // For non-dynamic types (HNSW, Flat), quantizers are directly in indexConfig
          // Need to detect and set the quantizer type
          const processedIndexConfig = { ...indexConfig }
          
          if (indexType === 'hnsw') {
            // Detect quantizer type from existing properties
            // Check both root level and hnsw nested level
            const hnswConfig = indexConfig.hnsw || {}
            if (indexConfig.pq || hnswConfig.pq) {
              processedIndexConfig.quantizer = 'pq'
              if (hnswConfig.pq && !processedIndexConfig.pq) {
                processedIndexConfig.pq = hnswConfig.pq
              }
            } else if (indexConfig.bq || hnswConfig.bq) {
              processedIndexConfig.quantizer = 'bq'
              if (hnswConfig.bq && !processedIndexConfig.bq) {
                processedIndexConfig.bq = hnswConfig.bq
              }
            } else if (indexConfig.sq || hnswConfig.sq) {
              processedIndexConfig.quantizer = 'sq'
              if (hnswConfig.sq && !processedIndexConfig.sq) {
                processedIndexConfig.sq = hnswConfig.sq
              }
            } else if (indexConfig.rq || hnswConfig.rq) {
              processedIndexConfig.quantizer = 'rq'
              if (hnswConfig.rq && !processedIndexConfig.rq) {
                processedIndexConfig.rq = hnswConfig.rq
              }
            }
          } else if (indexType === 'flat') {
            // Flat only supports BQ and RQ
            if (indexConfig.bq) {
              processedIndexConfig.quantizer = 'bq'
            } else if (indexConfig.rq) {
              processedIndexConfig.quantizer = 'rq'
            }
          } else if (indexType === 'hfresh') {
            // Map distance → distanceMetric for UI consistency
            if (indexConfig.distance && !indexConfig.distanceMetric) {
              processedIndexConfig.distanceMetric = indexConfig.distance
              delete processedIndexConfig.distance
            }
            // rq is always-on and immutable — remove from state (no UI toggle)
            delete processedIndexConfig.rq
          }

          indexConfig = processedIndexConfig
        }
        // Heuristic: infer dynamic if structure suggests so
        if (indexType !== 'dynamic' && (indexConfig?.threshold !== undefined || (indexConfig?.hnsw && indexConfig?.flat))) {
          indexType = 'dynamic'
        }
        // Normalize moduleConfig naming differences
        if (moduleConfig && moduleConfig.vectorizeCollectionName !== undefined && moduleConfig.vectorizeClassName === undefined) {
          moduleConfig.vectorizeClassName = moduleConfig.vectorizeCollectionName
        }

        return {
          name,
          vectorizer: vectorizerKey === 'none' ? '' : vectorizerKey,
          bringOwnVectors: vectorizerKey === 'none',
          moduleConfig,
          indexType,
          indexConfig,
          vectorizeClassName: moduleConfig?.vectorizeClassName || false
        }
      })
      setVectorConfigs(configs)
    }
  }, [initialJson])

  // Call onChange callback whenever generatedJson changes
  useEffect(() => {
    if (onChange && typeof onChange === 'function') {
      onChange(generatedJson)
    }
  }, [generatedJson, onChange])


  useEffect(() => {
    // If name is empty string and no initialJson, use default
    const className = name === '' && !initialJson ? 'MyCollection' : name
    
    const update = {
      class: className
    }
    
    // Only add description if it's not empty
    if (description && description.trim() !== '') {
      update.description = description
    }
    
    setGeneratedJson((prev) => {
      const newJson = { ...prev, ...update }
      // Remove description field if it's empty
      if (!description || description.trim() === '') {
        delete newJson.description
      }
      return newJson
    })
  }, [name, description, initialJson])

  // Update JSON with inverted index configuration, only including non-default values
  useEffect(() => {
    const defaults = {
      bm25_b: 0.75,
      bm25_k1: 1.2,
      cleanup_interval_seconds: 60,
      index_timestamps: false,
      index_property_length: false,
      index_null_state: false,
      stopwords_preset: 'en',
      stopwords_additions: [],
      stopwords_removals: [],
    };

    const bm25 = {};
    if (invertedIndexConfig.bm25_b !== defaults.bm25_b) bm25.b = invertedIndexConfig.bm25_b;
    if (invertedIndexConfig.bm25_k1 !== defaults.bm25_k1) bm25.k1 = invertedIndexConfig.bm25_k1;

    const stopwords = {};
    if (invertedIndexConfig.stopwords_preset !== defaults.stopwords_preset) stopwords.preset = invertedIndexConfig.stopwords_preset;
    if (invertedIndexConfig.stopwords_additions.length > 0) stopwords.additions = invertedIndexConfig.stopwords_additions;
    if (invertedIndexConfig.stopwords_removals.length > 0) stopwords.removals = invertedIndexConfig.stopwords_removals;

    const invertedIndexJson = {};
    if (Object.keys(bm25).length > 0) invertedIndexJson.bm25 = bm25;
    if (invertedIndexConfig.cleanup_interval_seconds !== defaults.cleanup_interval_seconds) invertedIndexJson.cleanupIntervalSeconds = invertedIndexConfig.cleanup_interval_seconds;
    if (invertedIndexConfig.index_null_state !== defaults.index_null_state) invertedIndexJson.indexNullState = invertedIndexConfig.index_null_state;
    if (invertedIndexConfig.index_property_length !== defaults.index_property_length) invertedIndexJson.indexPropertyLength = invertedIndexConfig.index_property_length;
    if (invertedIndexConfig.index_timestamps !== defaults.index_timestamps) invertedIndexJson.indexTimestamps = invertedIndexConfig.index_timestamps;
    if (Object.keys(stopwords).length > 0) invertedIndexJson.stopwords = stopwords;

    setGeneratedJson((prev) => {
      // Remove invertedIndexConfig if nothing is set
      if (Object.keys(invertedIndexJson).length === 0) {
        const { invertedIndexConfig, ...rest } = prev;
        return rest;
      }
      return { ...prev, invertedIndexConfig: invertedIndexJson };
    });
  }, [invertedIndexConfig]);

  // Update JSON with multi-tenancy configuration
  useEffect(() => {
    const multiTenancyJson = {};
    
    // Only add to JSON if multi-tenancy is enabled
    if (multiTenancyConfig.enabled) {
      multiTenancyJson.enabled = true;
      
      // Always include autoTenantCreation and autoTenantActivation when enabled
      multiTenancyJson.autoTenantCreation = multiTenancyConfig.autoTenantCreation;
      multiTenancyJson.autoTenantActivation = multiTenancyConfig.autoTenantActivation;
    }

    setGeneratedJson((prev) => {
      // Remove multiTenancyConfig if multi-tenancy is not enabled
      if (!multiTenancyConfig.enabled) {
        const { multiTenancyConfig, ...rest } = prev;
        return rest;
      }
      return { ...prev, multiTenancyConfig: multiTenancyJson };
    });
  }, [multiTenancyConfig]);

  // Update JSON with object TTL configuration
  useEffect(() => {
    setGeneratedJson((prev) => {
      if (!objectTtlConfig.mode || objectTtlConfig.mode === 'none') {
        const { objectTtlConfig: _, ...rest } = prev
        return rest
      }
      // For 'dateProperty' mode, deleteOn is the actual property name chosen by the user
      const deleteOn = objectTtlConfig.mode === 'dateProperty'
        ? objectTtlConfig.propertyName
        : objectTtlConfig.mode
      if (!deleteOn) {
        const { objectTtlConfig: _, ...rest } = prev
        return rest
      }
      const ttlJson = {
        enabled: true,
        deleteOn,
        timeToLive: objectTtlConfig.timeToLive === '' ? 0 : objectTtlConfig.timeToLive,
        filterExpiredObjects: objectTtlConfig.filterExpiredObjects,
      }
      return { ...prev, objectTtlConfig: ttlJson }
    })
  }, [objectTtlConfig])

  // Update JSON with replication configuration
  useEffect(() => {
    const defaults = {
      factor: 1,
      asyncEnabled: false,
      deletionStrategy: 'NoAutomatedResolution',
    };

    // If factor is null, don't include replicationConfig at all
    if (replicationConfig.factor === null) {
      setGeneratedJson((prev) => {
        const { replicationConfig, ...rest } = prev;
        return rest;
      });
      return;
    }

    const replicationJson = {};
    
    // Always include factor if not null
    replicationJson.factor = replicationConfig.factor;
    
    // Only include asyncEnabled if non-default and factor >= 2
    if (replicationConfig.factor >= 2 && replicationConfig.asyncEnabled !== defaults.asyncEnabled) {
      replicationJson.asyncEnabled = replicationConfig.asyncEnabled;
    }
    
    // Only include deletionStrategy if asyncEnabled is true and factor >= 2
    if (replicationConfig.factor >= 2 && replicationConfig.asyncEnabled && replicationConfig.deletionStrategy !== defaults.deletionStrategy) {
      replicationJson.deletionStrategy = replicationConfig.deletionStrategy;
    }

    // Only include asyncConfig if asyncEnabled is true and at least one field is set
    if (replicationConfig.factor >= 2 && replicationConfig.asyncEnabled) {
      const ac = replicationConfig.asyncConfig || {};
      const asyncConfigJson = {};
      // Coerce to a finite integer; drop NaN/Infinity/non-integer so
      // JSON.stringify never emits null for an unparseable value.
      // Note: scientific notation that resolves to an integer (e.g. "1e2") is
      // accepted because Number.isInteger(Number("1e2")) is true.
      const toFiniteInt = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && Number.isInteger(num) ? num : undefined;
      };
      const setIfInt = (key) => {
        if (ac[key] === '' || ac[key] === null || ac[key] === undefined) return;
        const v = toFiniteInt(ac[key]);
        if (v !== undefined) asyncConfigJson[key] = v;
      };
      setIfInt('maxWorkers');
      setIfInt('hashtreeHeight');
      setIfInt('frequency');
      setIfInt('frequencyWhilePropagating');
      setIfInt('diffBatchSize');
      setIfInt('propagationTimeout');
      setIfInt('propagationLimit');
      setIfInt('propagationConcurrency');
      if (Object.keys(asyncConfigJson).length > 0) {
        replicationJson.asyncConfig = asyncConfigJson;
      }
    }

    setGeneratedJson((prev) => {
      return { ...prev, replicationConfig: replicationJson };
    });
  }, [replicationConfig]);

  // Update JSON with generative configuration
  useEffect(() => {
    if (!generativeConfig.enabled || !generativeConfig.module) {
      // Remove generative config if disabled or no module selected
      setGeneratedJson((prev) => {
        const { moduleConfig, ...rest } = prev;
        if (moduleConfig) {
          const cleanModuleConfig = { ...moduleConfig };
          Object.keys(cleanModuleConfig).forEach(key => {
            if (key.startsWith('generative-')) {
              delete cleanModuleConfig[key];
            }
          });
          if (Object.keys(cleanModuleConfig).length === 0) {
            return rest;
          }
          return { ...rest, moduleConfig: cleanModuleConfig };
        }
        return rest;
      });
      return;
    }

    const generativeJson = {};
    const moduleConfig = generativeConfig.moduleConfig || {};
    
    // Only include non-empty config values
    const cleanConfig = {};
    Object.keys(moduleConfig).forEach((key) => {
      const value = moduleConfig[key];
      if (value !== null && value !== '' && value !== undefined) {
        // Don't include empty arrays
        if (Array.isArray(value) && value.length === 0) {
          return;
        }
        cleanConfig[key] = value;
      }
    });

    generativeJson[generativeConfig.module] = Object.keys(cleanConfig).length > 0 ? cleanConfig : {};

    setGeneratedJson((prev) => {
      const { generative, moduleConfig: prevModuleConfig, ...rest } = prev;
      const mergedModuleConfig = { ...(prevModuleConfig || {}), ...generativeJson };
      return { ...rest, moduleConfig: mergedModuleConfig };
    });
  }, [generativeConfig]);

  // Update JSON with reranker configuration
  useEffect(() => {
    if (!rerankerConfig.enabled || !rerankerConfig.module) {
      // Remove reranker config if disabled or no module selected
      setGeneratedJson((prev) => {
        const { moduleConfig, ...rest } = prev;
        if (moduleConfig) {
          // Remove only reranker modules from moduleConfig
          const cleanModuleConfig = { ...moduleConfig };
          Object.keys(cleanModuleConfig).forEach(key => {
            if (key.startsWith('reranker-')) {
              delete cleanModuleConfig[key];
            }
          });
          // If moduleConfig is now empty, remove it entirely
          if (Object.keys(cleanModuleConfig).length === 0) {
            return rest;
          }
          return { ...rest, moduleConfig: cleanModuleConfig };
        }
        return rest;
      });
      return;
    }

    const moduleConfig = rerankerConfig.moduleConfig || {};
    
    // Only include non-empty config values
    const cleanConfig = {};
    Object.keys(moduleConfig).forEach((key) => {
      const value = moduleConfig[key];
      if (value !== null && value !== '' && value !== undefined) {
        // Don't include empty arrays
        if (Array.isArray(value) && value.length === 0) {
          return;
        }
        cleanConfig[key] = value;
      }
    });

    const rerankerModuleConfig = {
      [rerankerConfig.module]: Object.keys(cleanConfig).length > 0 ? cleanConfig : {}
    };

    setGeneratedJson((prev) => {
      const existingModuleConfig = prev.moduleConfig || {};
      return { 
        ...prev, 
        moduleConfig: {
          ...existingModuleConfig,
          ...rerankerModuleConfig
        }
      };
    });
  }, [rerankerConfig]);

  // properties state managed here and merged into generated JSON
  const [properties, setProperties] = useState([])
  
  // vectorConfig state managed here and merged into generated JSON
  const [vectorConfigs, setVectorConfigs] = useState([])

  useEffect(() => {
    // Helper function to recursively transform properties including nested properties
    const transformProperty = (p, idx) => {
      const placeholderName = `new_property${idx + 1}`
      const placeholderDescription = `Description for ${placeholderName}`

      // Cross-reference: output dataType as [TargetCollection]
      if (p.dataType === 'cross-reference') {
        const target = (p.crossReferenceTarget || '').trim() || 'TargetCollection'
        const result = {
          name: p.name && p.name.trim() !== '' ? p.name : placeholderName,
          dataType: [target]
        }
        if (p.description && p.description.trim() !== '' && p.description !== placeholderDescription) {
          result.description = p.description
        }
        return result
      }

      // Extract base type and ensure it doesn't contain []
      let rawBaseType = typeof p.dataType === 'string' ? p.dataType : (Array.isArray(p.dataType) ? p.dataType[0] : 'text')
      const baseType = rawBaseType ? rawBaseType.replace('[]', '') : 'text'
      const typeValue = p.isArray ? `${baseType}[]` : baseType
      const placeholderDataType = 'text'
      const placeholderTokenization = 'word'

      const finalBaseType = baseType || placeholderDataType

      const result = {
        name: p.name && p.name.trim() !== '' ? p.name : placeholderName,
        dataType: [typeValue || (p.isArray ? `${placeholderDataType}[]` : placeholderDataType)]
      }

      // Only add description if it's not empty and not the placeholder
      if (p.description && p.description.trim() !== '' && p.description !== placeholderDescription) {
        result.description = p.description
      }

      // Always include indexFilterable (true or false)
      result.indexFilterable = p.indexFilterable ?? true

      // Add indexSearchable only for text type
      if (finalBaseType === 'text') {
        // English: Always include indexSearchable for text type
        result.indexSearchable = p.indexSearchable ?? true
        // Always include tokenization for text type
        result.tokenization = p.tokenization || 'word'
      } else {
        // If not text type, set indexSearchable to false
        result.indexSearchable = false
      }

      // Add indexRangeFilters only for int, number, date types and only if true
      if (finalBaseType === 'int' || finalBaseType === 'number' || finalBaseType === 'date') {
        result.indexRangeFilters = p.indexRangeFilters ?? false
      } else {
        // If not a range-filterable type, set to false
        result.indexRangeFilters = false
      }

      // Add moduleConfig for text properties with vectorization settings
      if (finalBaseType === 'text' && (p.vectorizePropertyName !== undefined)) {
        // Get the active vectorizers from vectorConfigs to create moduleConfig
        const activeVectorizers = vectorConfigs
          .filter(vc => vc.vectorizer && vc.vectorizer !== '')
          .map(vc => vc.vectorizer)
        
        // If we have vectorizers, create moduleConfig for each one
        if (activeVectorizers.length > 0) {
          result.moduleConfig = {}
          activeVectorizers.forEach(vectorizerName => {
            const config = {}
            if (p.vectorizePropertyName !== undefined) {
              config.vectorizePropertyName = p.vectorizePropertyName
            }
            if (Object.keys(config).length > 0) {
              result.moduleConfig[vectorizerName] = config
            }
          })
        }
      }

      // Recursively process nested properties for object type
      if (finalBaseType === 'object' && p.nestedProperties && Array.isArray(p.nestedProperties) && p.nestedProperties.length > 0) {
        result.nestedProperties = p.nestedProperties.map(transformProperty)
      }

      return result
    }
    
    // Transform properties into final JSON shape:
    const transformed = (properties || []).map(transformProperty)

    setGeneratedJson((prev) => {
      if (transformed.length === 0) {
        const { properties, ...rest } = prev
        return rest
      }
      return { ...prev, properties: transformed }
    })
  }, [properties, vectorConfigs])

  // Transform vectorConfigs into vectorConfig object for JSON
  useEffect(() => {
    if (!vectorConfigs || vectorConfigs.length === 0) {
      setGeneratedJson((prev) => {
        const { vectorConfig, ...rest } = prev
        return rest
      })
      return
    }

    const vectorConfigObject = {}
    vectorConfigs.forEach((config, idx) => {
      const configName = config.name && config.name.trim() !== '' 
        ? config.name 
        : `vector_config_${idx + 1}`
      
      // If bringing own vectors, use 'none' as vectorizer
      const vectorizerName = config.bringOwnVectors ? 'none' : (config.vectorizer || 'none')
      
      // Build the vectorizer config only with non-empty values
      const moduleConfig = config.moduleConfig || {}
      const vectorizerConfig = {}
      
      // Only process moduleConfig if not bringing own vectors
      if (!config.bringOwnVectors) {
        // Only add moduleConfig fields that have values
        Object.keys(moduleConfig).forEach(key => {
          const value = moduleConfig[key]
          // Include the field if it has a meaningful value
          if (value !== undefined && value !== null && value !== '' && 
              !(Array.isArray(value) && value.length === 0)) {
            vectorizerConfig[key] = value
          }
        })
        
        // Add vectorizeClassName if it's explicitly set to true
        if (config.vectorizeClassName === true) {
          vectorizerConfig.vectorizeClassName = config.vectorizeClassName
        }
      }
      
      const vectorConfigEntry = {
        vectorizer: {
          [vectorizerName]: Object.keys(vectorizerConfig).length > 0 ? vectorizerConfig : {}
        },
        vectorIndexType: config.indexType || 'hnsw'
      }
      
      // Build indexConfig based on index type
      if (config.indexConfig && Object.keys(config.indexConfig).length > 0) {
        const indexConfig = {}
        
        if (config.indexType === 'dynamic') {
          // For dynamic index, include distanceMetric, threshold, hnsw, and flat
          if (config.indexConfig.distanceMetric && config.indexConfig.distanceMetric !== 'cosine') {
            indexConfig.distanceMetric = config.indexConfig.distanceMetric
          }
          
          if (config.indexConfig.threshold !== undefined && config.indexConfig.threshold !== 10000) {
            indexConfig.threshold = config.indexConfig.threshold
          }
          
          // Build HNSW config
          if (config.indexConfig.hnsw && Object.keys(config.indexConfig.hnsw).length > 0) {
            const hnswConfig = {}
            Object.keys(config.indexConfig.hnsw).forEach(key => {
              const value = config.indexConfig.hnsw[key]
              if (value !== undefined && value !== null && value !== '') {
                // Skip default values
                if (key === 'distanceMetric' && value === 'cosine') return
                if (key === 'efConstruction' && value === 128) return
                if (key === 'ef' && value === -1) return
                if (key === 'maxConnections' && value === 32) return
                if (key === 'dynamicEfMin' && value === 100) return
                if (key === 'dynamicEfMax' && value === 500) return
                if (key === 'dynamicEfFactor' && value === 8) return
                if (key === 'flatSearchCutoff' && value === 40000) return
                if (key === 'cleanupIntervalSeconds' && value === 300) return
                if (key === 'vectorCacheMaxObjects' && value === 1000000000000) return
                if (key === 'filterStrategy' && value === 'sweeping') return
                if (key === 'skip' && value === false) return
                // Skip quantizer field itself, we'll handle it separately
                if (key === 'quantizer') return
                hnswConfig[key] = value
              }
            })
            
            // Handle HNSW quantization
            if (config.indexConfig.hnsw.quantizer && config.indexConfig.hnsw.quantizer !== 'none') {
              const quantizerType = config.indexConfig.hnsw.quantizer
              const quantizerConfig = config.indexConfig.hnsw[quantizerType]
              
              if (quantizerConfig && Object.keys(quantizerConfig).length > 0) {
                const cleanedQuantizer = {}
                Object.keys(quantizerConfig).forEach(qKey => {
                  const qValue = quantizerConfig[qKey]
                  if (qValue !== undefined && qValue !== null && qValue !== '') {
                    cleanedQuantizer[qKey] = qValue
                  }
                })
                if (Object.keys(cleanedQuantizer).length > 0) {
                  hnswConfig[quantizerType] = cleanedQuantizer
                }
              }
            }
            
            if (Object.keys(hnswConfig).length > 0) {
              indexConfig.hnsw = hnswConfig
            }
          }
          
          // Build Flat config
          if (config.indexConfig.flat && Object.keys(config.indexConfig.flat).length > 0) {
            const flatConfig = {}
            Object.keys(config.indexConfig.flat).forEach(key => {
              const value = config.indexConfig.flat[key]
              if (value !== undefined && value !== null && value !== '') {
                // Skip default values
                if (key === 'distanceMetric' && value === 'cosine') return
                if (key === 'vectorCacheMaxObjects' && value === 1000000000000) return
                // Skip quantizer field itself, we'll handle it separately
                if (key === 'quantizer') return
                flatConfig[key] = value
              }
            })
            
            // Handle Flat quantization (only BQ for flat)
            if (config.indexConfig.flat.quantizer && config.indexConfig.flat.quantizer !== 'none') {
              const quantizerType = config.indexConfig.flat.quantizer
              const quantizerConfig = config.indexConfig.flat[quantizerType]
              
              if (quantizerConfig && Object.keys(quantizerConfig).length > 0) {
                const cleanedQuantizer = {}
                Object.keys(quantizerConfig).forEach(qKey => {
                  const qValue = quantizerConfig[qKey]
                  if (qValue !== undefined && qValue !== null && qValue !== '') {
                    cleanedQuantizer[qKey] = qValue
                  }
                })
                if (Object.keys(cleanedQuantizer).length > 0) {
                  flatConfig[quantizerType] = cleanedQuantizer
                }
              }
            }
            
            if (Object.keys(flatConfig).length > 0) {
              indexConfig.flat = flatConfig
            }
          }
        } else if (config.indexType === 'hfresh') {
          // HFresh uses its own parameter names; rq is always-on and never emitted
          const ic = config.indexConfig
          if (ic.distanceMetric && ic.distanceMetric !== 'cosine') {
            indexConfig.distance = ic.distanceMetric
          }
          if (ic.maxPostingSizeKB !== undefined && ic.maxPostingSizeKB !== 48) {
            indexConfig.maxPostingSizeKB = ic.maxPostingSizeKB
          }
          if (ic.replicas !== undefined && ic.replicas !== 4) {
            indexConfig.replicas = ic.replicas
          }
          if (ic.searchProbe !== undefined && ic.searchProbe !== 64) {
            indexConfig.searchProbe = ic.searchProbe
          }
        } else {
          // For non-dynamic index types (e.g., hnsw, flat), include known keys and skip defaults
          Object.keys(config.indexConfig).forEach(key => {
            const value = config.indexConfig[key]
            if (value === undefined || value === null || value === '') return
            // Map legacy 'distance' to 'distanceMetric'
            const outKey = key === 'distance' ? 'distanceMetric' : key
            // Skip hnsw/flat nested keys for non-dynamic types
            if (outKey === 'hnsw' || outKey === 'flat') return
            // Skip quantizer field if present (it's just for UI state)
            if (outKey === 'quantizer') return
            
            // Handle quantizer configs (pq, bq, sq, rq) - include them as-is
            if (outKey === 'pq' || outKey === 'bq' || outKey === 'sq' || outKey === 'rq') {
              if (typeof value === 'object' && value !== null) {
                const cleanedQuantizer = {}
                Object.keys(value).forEach(qKey => {
                  const qValue = value[qKey]
                  if (qValue !== undefined && qValue !== null && qValue !== '') {
                    cleanedQuantizer[qKey] = qValue
                  }
                })
                if (Object.keys(cleanedQuantizer).length > 0) {
                  indexConfig[outKey] = cleanedQuantizer
                }
              }
              return
            }
            
            // Skip default values for HNSW
            if (outKey === 'distanceMetric' && value === 'cosine') return
            if (outKey === 'efConstruction' && value === 128) return
            if (outKey === 'ef' && value === -1) return
            if (outKey === 'maxConnections' && value === 32) return
            if (outKey === 'dynamicEfMin' && value === 100) return
            if (outKey === 'dynamicEfMax' && value === 500) return
            if (outKey === 'dynamicEfFactor' && value === 8) return
            if (outKey === 'flatSearchCutoff' && value === 40000) return
            if (outKey === 'cleanupIntervalSeconds' && value === 300) return
            if (outKey === 'vectorCacheMaxObjects' && value === 1000000000000) return
            if (outKey === 'filterStrategy' && value === 'sweeping') return
            if (outKey === 'skip' && value === false) return
            if (outKey === 'threshold' && value === 10000) return
            indexConfig[outKey] = value
          })
        }
        
        if (Object.keys(indexConfig).length > 0) {
          vectorConfigEntry.vectorIndexConfig = indexConfig
        }
      }
      
      // Note: No longer using separate quantizer field - quantizers are now in indexConfig directly
      
      vectorConfigObject[configName] = vectorConfigEntry
    })

    setGeneratedJson((prev) => ({ ...prev, vectorConfig: vectorConfigObject }))
  }, [vectorConfigs])

  function prettyJson() {
    return JSON.stringify(generatedJson, null, 2)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(prettyJson())
      .then(() => {
        // You could add a toast notification here if desired
        alert('JSON copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }

  function sanitizeFilePart(str) {
    if (!str || typeof str !== 'string') return 'MyCollection'
    // Replace spaces with underscores, remove characters not allowed in filenames
    // Allow letters, numbers, underscores, hyphens
    const cleaned = str.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
    return cleaned || 'MyCollection'
  }

  function downloadJson() {
    try {
      const jsonText = prettyJson()
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const base = sanitizeFilePart(name || generatedJson.class || 'MyCollection')
      const a = document.createElement('a')
      a.href = url
      a.download = `${base}_weaviate_schema.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download JSON:', err)
      alert('Could not download JSON file')
    }
  }

  return (
    <VersionProvider weaviateVersion={weaviateVersion}>
    <div className="card">
      <div className="card-section-header">
        <h3>
          Collection Configuration
          <span>Define the structure and behavior of your Weaviate collection</span>
        </h3>
      </div>

      <div className="collapsible">
        <button
          className="collapsible-toggle"
          aria-expanded={openBasic}
          onClick={() => setOpenBasic((s) => !s)}
        >
          <span>Basic Settings</span>
          <span className="chev">{openBasic ? '▾' : '▸'}</span>
        </button>

        {openBasic && (
          <div className="collapsible-panel">
            <div className="field">
              <label htmlFor="collection-name" className="required">Collection Name</label>
              <input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  // Auto-sanitize on blur if invalid
                  if (name && !nameValidation.valid) {
                    const sanitized = sanitizeCollectionName(name)
                    if (sanitized !== name) {
                      setName(sanitized)
                    }
                  }
                }}
                placeholder="MyCollection"
                className={!nameValidation.valid ? 'input-error' : ''}
              />
              {nameValidation.error && (
                <small className="error-text" style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                  ❌ {nameValidation.error}
                </small>
              )}
              {nameValidation.warning && (
                <small className="warning-text" style={{ color: '#f59e0b', display: 'block', marginTop: '4px' }}>
                  ⚠️ {nameValidation.warning}
                </small>
              )}
              {nameValidation.valid && !nameValidation.warning && name && (
                <small className="success-text" style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                  ✓ Valid collection name
                </small>
              )}
            </div>

            <div className="field">
              <label htmlFor="collection-description">Description</label>
              <textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A Brand new collection"
                rows="3"
              />
            </div>
          </div>
        )}

      </div>

      {/* Properties collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openProperties}
            onClick={() => setOpenProperties((s) => !s)}
          >
            <span>Properties</span>
            <span className="chev">{openProperties ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.properties && (
            <a href={DOC_LINKS.properties} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>

        {openProperties && (
          <div className="collapsible-panel">
            <PropertySection properties={properties} onChange={setProperties} />
          </div>
        )}
      </div>

      {/* Vector Config collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openVectorConfig}
            onClick={() => setOpenVectorConfig((s) => !s)}
          >
            <span>Vectorizer Configuration</span>
            <span className="chev">{openVectorConfig ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.vectorConfig && (
            <a href={DOC_LINKS.vectorConfig} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>

        {openVectorConfig && (
          <div className="collapsible-panel">
            <VectorConfigSection 
              vectorConfigs={vectorConfigs} 
              onChange={setVectorConfigs}
              availableModules={availableModules}
              properties={properties}
            />
          </div>
        )}
      </div>

      {/* Generative Config collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openGenerativeConfig}
            onClick={() => setOpenGenerativeConfig((s) => !s)}
          >
            <span>Generative Configuration</span>
            <span className="chev">{openGenerativeConfig ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.generative && (
            <a href={DOC_LINKS.generative} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>

        {openGenerativeConfig && (
          <div className="collapsible-panel">
            <GenerativeConfigSection 
              config={generativeConfig} 
              setConfig={setGenerativeConfig}
            />
          </div>
        )}
      </div>

      {/* Reranker Config collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openRerankerConfig}
            onClick={() => setOpenRerankerConfig((s) => !s)}
          >
            <span>Reranker Configuration</span>
            <span className="chev">{openRerankerConfig ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.reranker && (
            <a href={DOC_LINKS.reranker} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>

        {openRerankerConfig && (
          <div className="collapsible-panel">
            <RerankerConfigSection
              config={rerankerConfig}
              setConfig={setRerankerConfig}
            />
          </div>
        )}
      </div>

      {/* Inverted Index Config collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openInvertedIndexConfig}
            onClick={() => setOpenInvertedIndexConfig((s) => !s)}
          >
            <span>Inverted Index Configuration</span>
            <span className="chev">{openInvertedIndexConfig ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.invertedIndex && (
            <a href={DOC_LINKS.invertedIndex} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>
        {openInvertedIndexConfig && (
          <div className="collapsible-panel">
            <InvertedIndexConfigSection config={invertedIndexConfig} setConfig={setInvertedIndexConfig} />
          </div>
        )}
      </div>

      {/* Multi Tenancy Config collapsible section */}
      <VersionGatedSection
        featureId="multiTenancy"
        title="Multi Tenancy Configuration"
        isOpen={openMultiTenancyConfig}
        onToggle={() => setOpenMultiTenancyConfig((s) => !s)}
      >
        <MultiTenancyConfigSection config={multiTenancyConfig} setConfig={setMultiTenancyConfig} />
      </VersionGatedSection>

      {/* Object TTL Config collapsible section */}
      <VersionGatedSection
        featureId="objectTtl"
        title="Object Time to Live"
        isOpen={openObjectTtlConfig}
        onToggle={() => setOpenObjectTtlConfig((s) => !s)}
      >
        <ObjectTtlConfigSection
          config={objectTtlConfig}
          setConfig={setObjectTtlConfig}
          properties={properties}
        />
      </VersionGatedSection>

      {/* Replication Config collapsible section */}
      <div className="collapsible">
        <div className="collapsible-header">
          <button
            className="collapsible-toggle"
            aria-expanded={openReplicationConfig}
            onClick={() => setOpenReplicationConfig((s) => !s)}
            disabled={nodesNumber === 1}
          >
            <span>Replication Configuration</span>
            <span className="chev">{openReplicationConfig ? '▾' : '▸'}</span>
          </button>
          {DOC_LINKS.replication && (
            <a href={DOC_LINKS.replication} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </a>
          )}
        </div>

        {openReplicationConfig && nodesNumber !== 1 && (
          <div className="collapsible-panel">
            <ReplicationConfigSection 
              config={replicationConfig} 
              setConfig={setReplicationConfig}
              nodesNumber={nodesNumber}
            />
          </div>
        )}
        
        {nodesNumber === 1 && (
          <div className="collapsible-panel" style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
            <p>Replication feature requires 2 or more nodes.</p>
          </div>
        )}
      </div>

      <div className="preview">
        <div className="preview-header">
          <h3>Generated JSON Schema</h3>
          <div className="preview-actions">
            <button className="btn btn-primary" onClick={copyToClipboard}>
              Copy JSON
            </button>
            <button className="btn btn-primary" onClick={downloadJson}>
              Download JSON
            </button>
          </div>
        </div>
        
        <div className="json-wrapper">
          <pre className="json-block">{prettyJson()}</pre>
        </div>
        
        {!hideCreateButton && onSubmit && typeof onSubmit === 'function' && (
          <button 
            className="btn btn-primary submit-btn"
            onClick={() => onSubmit(generatedJson)}
            style={{ 
              marginTop: 'var(--spacing-lg)', 
              width: '100%',
              padding: 'var(--spacing-md)',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Create Collection
          </button>
        )}
      </div>
    </div>
    </VersionProvider>
  )
}
