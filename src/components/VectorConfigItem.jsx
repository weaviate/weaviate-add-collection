import React, { useState } from 'react'
import { indexTypeOptions, getVectorizerModuleOptions } from '../constants/options'
import ModuleConfigForm from './ModuleConfigForm'
import { VersionGated, useVersionFilteredOptions } from '../context/VersionContext'
import DOC_LINKS from '../constants/docLinks.json'

export default function VectorConfigItem({
  value,
  onChange,
  onDelete,
  index,
  availableModules = null,
  properties = []
}) {
  const [activeTab, setActiveTab] = useState('vectorizer')
  const [dynamicSubTab, setDynamicSubTab] = useState('hnsw')
  const vectorizerOptions = useVersionFilteredOptions(getVectorizerModuleOptions(availableModules))

  // Version-filtered index type options (removes 'dynamic' if below 1.25.0)
  const filteredIndexTypeOptions = useVersionFilteredOptions(indexTypeOptions)
  // Whether RQ quantization is available in the current version
  const filteredFlatQuantizerOptions = useVersionFilteredOptions([
    { value: 'none', label: 'None' },
    {
      value: 'rq', label: 'Rotational Quantization (RQ) — Recommended', featureId: 'rqQuantizationFlat',
      description: 'Recommended. Applies orthogonal rotations to preserve vector relationships with minimal recall loss.',
      docKey: 'compressionRq'
    },
    {
      value: 'bq', label: 'Binary Quantization (BQ)',
      description: 'Extreme compression by encoding each dimension as a single bit (~32× reduction). Works best with high-dimensional vectors.',
      docKey: 'compressionBq'
    },
  ])
  const filteredHnswQuantizerOptions = useVersionFilteredOptions([
    { value: 'none', label: 'None' },
    {
      value: 'rq', label: 'Rotational Quantization (RQ) — Recommended', featureId: 'rqQuantizationHnsw',
      description: 'Recommended. Applies orthogonal rotations to preserve vector relationships with minimal recall loss.',
      docKey: 'compressionRq'
    },
    {
      value: 'pq', label: 'Product Quantization (PQ)',
      description: 'Splits vectors into sub-vectors and encodes each segment separately. Requires a training phase. Good for large datasets.',
      docKey: 'compressionPq'
    },
    {
      value: 'bq', label: 'Binary Quantization (BQ)',
      description: 'Extreme compression by encoding each dimension as a single bit (~32× reduction). Works best with high-dimensional vectors.',
      docKey: 'compressionBq'
    },
    {
      value: 'sq', label: 'Scalar Quantization (SQ)',
      description: 'Compresses each dimension to 8 bits (~4× reduction). Good balance between recall, speed, and memory savings.',
      docKey: 'compressionSq'
    },
  ])

  function update(field, val) {
    onChange({ ...value, [field]: val })
  }

  function updateModuleConfig(moduleConfig) {
    update('moduleConfig', moduleConfig)
  }

  // Handle property selection for vectorization
  function handlePropertyToggle(propertyName) {
    const currentProperties = value.moduleConfig?.properties || []
    const isSelected = currentProperties.includes(propertyName)
    
    let newProperties
    if (isSelected) {
      // Remove property
      newProperties = currentProperties.filter(p => p !== propertyName)
    } else {
      // Add property
      newProperties = [...currentProperties, propertyName]
    }
    
    updateModuleConfig({
      ...value.moduleConfig,
      properties: newProperties
    })
  }

  function selectAllProperties() {
    // Only select text properties
    const textPropertyNames = properties
      .filter(p => p.dataType === 'text')
      .map(p => p.name)
      .filter(name => name && name.trim() !== '')
    
    updateModuleConfig({
      ...value.moduleConfig,
      properties: textPropertyNames
    })
  }

  function deselectAllProperties() {
    updateModuleConfig({
      ...value.moduleConfig,
      properties: []
    })
  }

  return (
    <div className="property-item">
      <div className="property-item-header">
        <h4>Vector Config #{index + 1}</h4>
        <button 
          type="button" 
          className="btn btn-danger btn-sm" 
          onClick={onDelete}
          title="Delete this vector config"
        >
          Delete
        </button>
      </div>

      <div className="property-item-body">
        {/* Basic fields - always visible */}
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            value={value.name || ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g., default, semantic, contextual"
          />
          <small className="hint">Unique name for this vector configuration</small>
        </div>

        {/* Bring my own vectors toggle */}
        <div className="field">
          <label htmlFor={`bring-own-vectors-${index}`}>
            <input
              id={`bring-own-vectors-${index}`}
              type="checkbox"
              checked={value.bringOwnVectors || false}
              onChange={(e) => update('bringOwnVectors', e.target.checked)}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            I will bring my own vectors
          </label>
          <small className="hint">Check this if you will provide pre-computed vectors instead of using a vectorizer</small>
        </div>

        {/* Vectorize Collection Name - common to all modules - hidden when bringing own vectors */}
        {!value.bringOwnVectors && (
          <div className="field">
            <label htmlFor={`vectorize-class-name-${index}`}>
              <input
                id={`vectorize-class-name-${index}`}
                type="checkbox"
                checked={value.vectorizeClassName || false}
                onChange={(e) => update('vectorizeClassName', e.target.checked)}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              Vectorize Collection Name
            </label>
            <small className="hint">Whether to vectorize the collection name</small>
          </div>
        )}

        {/* Property Selection for Vectorization - hidden when bringing own vectors */}
        {!value.bringOwnVectors && properties.length > 0 && (
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ marginBottom: 0 }}>Properties to Vectorize</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={selectAllProperties}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={deselectAllProperties}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {properties.filter(p => p.dataType === 'text').length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#666',
                  fontSize: '14px'
                }}>
                  No text properties available. Only text fields can be vectorized.
                </div>
              ) : (
                properties
                  .filter(property => property.dataType === 'text')
                  .map((property, idx) => {
                    const propertyName = property.name || `new_property${idx + 1}`
                    const isSelected = (value.moduleConfig?.properties || []).includes(propertyName)
                    
                    return (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        <label 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePropertyToggle(propertyName)}
                            style={{ width: 'auto', marginRight: '8px' }}
                          />
                          <span style={{ fontWeight: isSelected ? '600' : '400' }}>
                            {propertyName}
                          </span>
                          {property.dataType && (
                            <span style={{ 
                              marginLeft: '8px', 
                              color: '#666', 
                              fontSize: '12px',
                              fontStyle: 'italic'
                            }}>
                              ({property.dataType}{property.isArray ? '[]' : ''})
                            </span>
                          )}
                        </label>
                      </div>
                    )
                  })
              )}
            </div>
            <small className="hint">
              Only text properties can be vectorized. Select which text properties should be included in this vector
              {(value.moduleConfig?.properties || []).length > 0 && (
                <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                  ({(value.moduleConfig?.properties || []).length} selected)
                </span>
              )}
            </small>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <div className="tabs-header">
            <button
              type="button"
              className={`tab-button ${activeTab === 'vectorizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('vectorizer')}
            >
              Vectorizer Module
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'index' ? 'active' : ''}`}
              onClick={() => setActiveTab('index')}
            >
              Index Configuration
            </button>
            {/* Hide Compression/Quantization tab for dynamic and hfresh index types */}
            {value.indexType !== 'dynamic' && value.indexType !== 'hfresh' && (
              <button
                type="button"
                className={`tab-button ${activeTab === 'compression' ? 'active' : ''}`}
                onClick={() => setActiveTab('compression')}
              >
                Compression/Quantization
              </button>
            )}
          </div>

          <div className="tabs-content">
            {/* Tab 1: Vectorizer Module */}
            {activeTab === 'vectorizer' && (
              <div className="tab-panel">
                {value.bringOwnVectors ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>Vectorizer configuration is disabled when bringing your own vectors.</p>
                    <small className="hint">You will provide pre-computed vectors directly, so no vectorizer is needed.</small>
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label>Vectorizer Module</label>
                      <select
                        value={value.vectorizer || ''}
                        onChange={(e) => update('vectorizer', e.target.value)}
                      >
                        <option value="">Select a vectorizer module...</option>
                        {vectorizerOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}
                          </option>
                        ))}
                      </select>
                      {value.vectorizer && vectorizerOptions.find(opt => opt.value === value.vectorizer)?.documentationHref && (
                        <small className="hint">
                          <a 
                            href={vectorizerOptions.find(opt => opt.value === value.vectorizer).documentationHref} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View documentation ↗
                          </a>
                        </small>
                      )}
                    </div>

                    {/* Dynamic module configuration form based on selected vectorizer */}
                    {value.vectorizer && (
                      <ModuleConfigForm
                        moduleName={value.vectorizer}
                        config={value.moduleConfig || {}}
                        onChange={updateModuleConfig}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab 2: Index Configuration */}
            {activeTab === 'index' && (
              <div className="tab-panel">
                <div className="field">
                  <label htmlFor={`index-type-${index}`}>Index Type</label>
                  <select
                    id={`index-type-${index}`}
                    value={value.indexType || 'hnsw'}
                    onChange={(e) => update('indexType', e.target.value)}
                  >
                    {filteredIndexTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const opt = filteredIndexTypeOptions.find(o => o.value === (value.indexType || 'hnsw'))
                    return (
                      <small className="hint">
                        {opt?.description}
                        {opt?.docKey && DOC_LINKS[opt.docKey] && <>{' '}<a href={DOC_LINKS[opt.docKey]} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
                      </small>
                    )
                  })()}
                </div>

                {/* HNSW Configuration */}
                {(value.indexType === 'hnsw' || !value.indexType) && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>HNSW Parameters</h5>
                    
                    <div className="field">
                      <label>Distance Metric</label>
                      <select
                        value={value.indexConfig?.distanceMetric || 'cosine'}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, distanceMetric: e.target.value })}
                      >
                        <option value="cosine">Cosine</option>
                        <option value="dot">Dot Product</option>
                        <option value="l2-squared">L2 Squared</option>
                        <option value="manhattan">Manhattan</option>
                        <option value="hamming">Hamming</option>
                      </select>
                      <small className="hint">Distance metric for vector comparison</small>
                    </div>

                    <div className="field">
                      <label>ef Construction</label>
                      <input
                        type="number"
                        value={value.indexConfig?.efConstruction || 128}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, efConstruction: parseInt(e.target.value) || 128 })}
                        placeholder="128"
                      />
                      <small className="hint">Higher values = better quality, slower indexing (default: 128)</small>
                    </div>

                    <div className="field">
                      <label>ef</label>
                      <input
                        type="number"
                        value={value.indexConfig?.ef || -1}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, ef: parseInt(e.target.value) || -1 })}
                        placeholder="-1 (dynamic)"
                      />
                      <small className="hint">Higher values = better recall, slower search (default: -1 = dynamic)</small>
                    </div>

                    <div className="field">
                      <label>Max Connections</label>
                      <input
                        type="number"
                        value={value.indexConfig?.maxConnections || 32}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, maxConnections: parseInt(e.target.value) || 32 })}
                        placeholder="32"
                      />
                      <small className="hint">Number of connections per node (default: 32)</small>
                    </div>

                    <div className="field">
                      <label>Dynamic Ef Min</label>
                      <input
                        type="number"
                        value={value.indexConfig?.dynamicEfMin || 100}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, dynamicEfMin: parseInt(e.target.value) || 100 })}
                        placeholder="100"
                      />
                      <small className="hint">Minimum value for dynamic ef (default: 100)</small>
                    </div>

                    <div className="field">
                      <label>Dynamic Ef Max</label>
                      <input
                        type="number"
                        value={value.indexConfig?.dynamicEfMax || 500}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, dynamicEfMax: parseInt(e.target.value) || 500 })}
                        placeholder="500"
                      />
                      <small className="hint">Maximum value for dynamic ef (default: 500)</small>
                    </div>

                    <div className="field">
                      <label>Dynamic Ef Factor</label>
                      <input
                        type="number"
                        value={value.indexConfig?.dynamicEfFactor || 8}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, dynamicEfFactor: parseInt(e.target.value) || 8 })}
                        placeholder="8"
                      />
                      <small className="hint">Factor for dynamic ef calculation (default: 8)</small>
                    </div>

                    <div className="field">
                      <label>Flat Search Cutoff</label>
                      <input
                        type="number"
                        value={value.indexConfig?.flatSearchCutoff || 40000}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, flatSearchCutoff: parseInt(e.target.value) || 40000 })}
                        placeholder="40000"
                      />
                      <small className="hint">When to use flat search instead (default: 40000)</small>
                    </div>

                    <div className="field">
                      <label>Cleanup Interval Seconds</label>
                      <input
                        type="number"
                        value={value.indexConfig?.cleanupIntervalSeconds || 300}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, cleanupIntervalSeconds: parseInt(e.target.value) || 300 })}
                        placeholder="300"
                      />
                      <small className="hint">Interval between cleanup operations (default: 300)</small>
                    </div>

                    <div className="field">
                      <label>Vector Cache Max Objects</label>
                      <input
                        type="number"
                        value={value.indexConfig?.vectorCacheMaxObjects || 1000000000000}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 })}
                        placeholder="1000000000000"
                      />
                      <small className="hint">Maximum objects in vector cache (default: 1000000000000)</small>
                    </div>

                    <div className="field">
                      <label>Filter Strategy</label>
                      <select
                        value={value.indexConfig?.filterStrategy || 'sweeping'}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, filterStrategy: e.target.value })}
                      >
                        <option value="sweeping">Sweeping</option>
                        <option value="acorn">Acorn</option>
                      </select>
                      <small className="hint">Strategy for filtering results (default: sweeping)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`hnsw-skip-${index}`}>
                        <input
                          id={`hnsw-skip-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.skip || false}
                          onChange={(e) => update('indexConfig', { ...value.indexConfig, skip: e.target.checked })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Skip HNSW Index
                      </label>
                      <small className="hint">Skip building the HNSW index (default: false)</small>
                    </div>
                  </div>
                )}

                {/* Flat Index Configuration */}
                {value.indexType === 'flat' && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Flat Index Parameters</h5>
                    
                    <div className="field">
                      <label>Distance Metric</label>
                      <select
                        value={value.indexConfig?.distanceMetric || 'cosine'}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, distanceMetric: e.target.value })}
                      >
                        <option value="cosine">Cosine</option>
                        <option value="dot">Dot Product</option>
                        <option value="l2-squared">L2 Squared</option>
                        <option value="manhattan">Manhattan</option>
                        <option value="hamming">Hamming</option>
                      </select>
                      <small className="hint">Distance metric for vector comparison</small>
                    </div>

                    <div className="field">
                      <label>Vector Cache Max Objects</label>
                      <input
                        type="number"
                        value={value.indexConfig?.vectorCacheMaxObjects || 1000000000000}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 })}
                        placeholder="1000000000000"
                      />
                      <small className="hint">Maximum objects in the vector cache (default: 1000000000000)</small>
                    </div>

                    {/* Flat Quantization - BQ and RQ available */}
                    <div className="field" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <label htmlFor={`flat-quantizer-${index}`}>Quantization Type</label>
                      <select
                        id={`flat-quantizer-${index}`}
                        value={
                          value.indexConfig?.bq ? 'bq' :
                          value.indexConfig?.rq ? 'rq' :
                          'none'
                        }
                        onChange={(e) => {
                          const newType = e.target.value
                          const newIndexConfig = { ...value.indexConfig }
                          
                          // Remove all quantizer configs
                          delete newIndexConfig.bq
                          delete newIndexConfig.rq
                          
                          // Add quantizer config with enabled: true if not 'none'
                          if (newType !== 'none') {
                            newIndexConfig[newType] = { enabled: true }
                          }
                          
                          update('indexConfig', newIndexConfig)
                        }}
                      >
                        {filteredFlatQuantizerOptions.map(opt => (
                          <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}</option>
                        ))}
                      </select>
                      {(() => {
                        const qType = value.indexConfig?.bq ? 'bq' : value.indexConfig?.rq ? 'rq' : 'none'
                        const opt = filteredFlatQuantizerOptions.find(o => o.value === qType)
                        return (
                          <small className="hint">
                            {opt?.description || 'Quantization compresses vectors to reduce memory usage.'}
                            {opt?.docKey && DOC_LINKS[opt.docKey] && <>{' '}<a href={DOC_LINKS[opt.docKey]} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
                          </small>
                        )
                      })()}
                    </div>

                    {/* BQ Configuration for Flat */}
                    {value.indexConfig?.bq && (
                      <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                        <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>BQ Settings</h6>
                        
                        <div className="field">
                          <label>Rescore Limit</label>
                          <input
                            type="number"
                            value={value.indexConfig?.bq?.rescoreLimit ?? -1}
                            onChange={(e) => update('indexConfig', { 
                              ...value.indexConfig, 
                              bq: { ...(value.indexConfig?.bq || {}), rescoreLimit: parseInt(e.target.value) }
                            })}
                            placeholder="-1 (unlimited)"
                          />
                          <small className="hint">Number of candidates to rescore (-1 = unlimited, default: -1)</small>
                        </div>

                        <div className="field">
                          <label htmlFor={`flat-bq-cache-${index}`}>
                            <input
                              id={`flat-bq-cache-${index}`}
                              type="checkbox"
                              checked={value.indexConfig?.bq?.cache || false}
                              onChange={(e) => update('indexConfig', { 
                                ...value.indexConfig, 
                                bq: { ...(value.indexConfig?.bq || {}), cache: e.target.checked }
                              })}
                              style={{ width: 'auto', marginRight: '8px' }}
                            />
                            Cache
                          </label>
                          <small className="hint">Enable caching for BQ (default: false)</small>
                        </div>

                        <div className="field">
                          <label htmlFor={`flat-bq-enabled-${index}`}>
                            <input
                              id={`flat-bq-enabled-${index}`}
                              type="checkbox"
                              checked={value.indexConfig?.bq?.enabled !== false}
                              onChange={(e) => update('indexConfig', { 
                                ...value.indexConfig, 
                                bq: { ...(value.indexConfig?.bq || {}), enabled: e.target.checked }
                              })}
                              style={{ width: 'auto', marginRight: '8px' }}
                            />
                            Enabled
                          </label>
                          <small className="hint">Enable Binary Quantization (default: true)</small>
                        </div>
                      </div>
                    )}

                    {/* RQ Configuration for Flat (regular, non-dynamic) */}
                    <VersionGated featureId="rqQuantizationFlat">
                    {value.indexConfig?.rq && (
                      <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                        <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>RQ Settings</h6>
                        
                        <div className="field">
                          <label>Bits</label>
                          <select
                            value={value.indexConfig?.rq?.bits || 8}
                            onChange={(e) => update('indexConfig', { 
                              ...value.indexConfig, 
                              rq: { ...(value.indexConfig?.rq || {}), bits: parseInt(e.target.value) }
                            })}
                          >
                            <option value="1">1</option>
                            <option value="8">8</option>
                          </select>
                          <small className="hint">Number of bits for quantization (default: 8)</small>
                        </div>

                        <div className="field">
                          <label>Rescore Limit</label>
                          <input
                            type="number"
                            value={value.indexConfig?.rq?.rescoreLimit || 20}
                            onChange={(e) => update('indexConfig', { 
                              ...value.indexConfig, 
                              rq: { ...(value.indexConfig?.rq || {}), rescoreLimit: parseInt(e.target.value) || 20 }
                            })}
                            placeholder="20"
                          />
                          <small className="hint">Number of candidates to rescore (default: 20)</small>
                        </div>

                        <div className="field">
                          <label htmlFor={`flat-rq-enabled-regular-${index}`}>
                            <input
                              id={`flat-rq-enabled-regular-${index}`}
                              type="checkbox"
                              checked={value.indexConfig?.rq?.enabled !== false}
                              onChange={(e) => update('indexConfig', { 
                                ...value.indexConfig, 
                                rq: { ...(value.indexConfig?.rq || {}), enabled: e.target.checked }
                              })}
                              style={{ width: 'auto', marginRight: '8px' }}
                            />
                            Enabled
                          </label>
                          <small className="hint">Enable Rotational Quantization (default: true)</small>
                        </div>
                      </div>
                    )}
                    </VersionGated>
                  </div>
                )}

                {/* HFresh Index Configuration */}
                {value.indexType === 'hfresh' && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>HFresh Parameters</h5>

                    {/* RQ always-on banner */}
                    <div style={{
                      padding: '10px 14px',
                      marginBottom: '16px',
                      borderRadius: '4px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      fontSize: '13px',
                      color: '#0369a1'
                    }}>
                      <strong>Rotational Quantization (RQ) is always enabled</strong> for HFresh indexes and cannot be disabled. It is built-in and immutable.
                    </div>

                    <div className="field">
                      <label>Distance Metric <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(immutable after creation)</span></label>
                      <select
                        value={value.indexConfig?.distanceMetric || 'cosine'}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, distanceMetric: e.target.value })}
                      >
                        <option value="cosine">Cosine</option>
                        <option value="l2-squared">L2 Squared</option>
                      </select>
                      <small className="hint">Only cosine and l2-squared are supported for HFresh</small>
                    </div>

                    <div className="field">
                      <label>Max Posting Size (KB)</label>
                      <input
                        type="number"
                        value={value.indexConfig?.maxPostingSizeKB ?? 48}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, maxPostingSizeKB: parseInt(e.target.value) || 48 })}
                        placeholder="48"
                        min="8"
                        max="1024"
                      />
                      <small className="hint">Maximum size in KB for a posting list. Range: 8–1024 (default: 48)</small>
                    </div>

                    <div className="field">
                      <label>Replicas <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(immutable after creation)</span></label>
                      <input
                        type="number"
                        value={value.indexConfig?.replicas ?? 4}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, replicas: parseInt(e.target.value) || 4 })}
                        placeholder="4"
                        min="1"
                        max="10"
                      />
                      <small className="hint">Number of posting lists in which a vector is added. Range: 1–10 (default: 4)</small>
                    </div>

                    <div className="field">
                      <label>Search Probe</label>
                      <input
                        type="number"
                        value={value.indexConfig?.searchProbe ?? 64}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, searchProbe: parseInt(e.target.value) || 64 })}
                        placeholder="64"
                      />
                      <small className="hint">Number of posting lists to search during a query (default: 64)</small>
                    </div>
                  </div>
                )}

                {/* Dynamic Index Configuration */}
                {value.indexType === 'dynamic' && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Dynamic Index Parameters</h5>
                    
                    <div className="field">
                      <label>Distance Metric</label>
                      <select
                        value={value.indexConfig?.distanceMetric || 'cosine'}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, distanceMetric: e.target.value })}
                      >
                        <option value="cosine">Cosine</option>
                        <option value="dot">Dot Product</option>
                        <option value="l2-squared">L2 Squared</option>
                        <option value="manhattan">Manhattan</option>
                        <option value="hamming">Hamming</option>
                      </select>
                      <small className="hint">Distance metric for vector comparison</small>
                    </div>

                    <div className="field">
                      <label>Threshold</label>
                      <input
                        type="number"
                        value={value.indexConfig?.threshold || 10000}
                        onChange={(e) => update('indexConfig', { ...value.indexConfig, threshold: parseInt(e.target.value) || 10000 })}
                        placeholder="10000"
                      />
                      <small className="hint">Number of objects before switching from flat to HNSW (default: 10000)</small>
                    </div>

                    {/* Sub-tabs for HNSW and Flat configurations */}
                    <div className="tabs" style={{ marginTop: '16px' }}>
                      <div className="tabs-header">
                        <button
                          type="button"
                          className={`tab-button ${dynamicSubTab === 'hnsw' ? 'active' : ''}`}
                          onClick={() => setDynamicSubTab('hnsw')}
                        >
                          HNSW Config
                        </button>
                        <button
                          type="button"
                          className={`tab-button ${dynamicSubTab === 'flat' ? 'active' : ''}`}
                          onClick={() => setDynamicSubTab('flat')}
                        >
                          Flat Config
                        </button>
                      </div>

                      <div className="tabs-content">
                        {/* HNSW Configuration for Dynamic */}
                        {dynamicSubTab === 'hnsw' && (
                          <div className="tab-panel">
                            <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>HNSW Parameters</h6>
                            
                            <div className="field">
                              <label>Distance Metric</label>
                              <select
                                value={value.indexConfig?.hnsw?.distanceMetric || 'cosine'}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), distanceMetric: e.target.value }
                                })}
                              >
                                <option value="cosine">Cosine</option>
                                <option value="dot">Dot Product</option>
                                <option value="l2-squared">L2 Squared</option>
                                <option value="manhattan">Manhattan</option>
                                <option value="hamming">Hamming</option>
                              </select>
                              <small className="hint">Distance metric for HNSW index</small>
                            </div>

                            <div className="field">
                              <label>ef Construction</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.efConstruction || 128}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), efConstruction: parseInt(e.target.value) || 128 }
                                })}
                                placeholder="128"
                              />
                              <small className="hint">Higher values = better quality, slower indexing (default: 128)</small>
                            </div>

                            <div className="field">
                              <label>ef</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.ef || -1}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), ef: parseInt(e.target.value) || -1 }
                                })}
                                placeholder="-1 (dynamic)"
                              />
                              <small className="hint">Higher values = better recall, slower search (default: -1 = dynamic)</small>
                            </div>

                            <div className="field">
                              <label>Max Connections</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.maxConnections || 32}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), maxConnections: parseInt(e.target.value) || 32 }
                                })}
                                placeholder="32"
                              />
                              <small className="hint">Number of connections per node (default: 32)</small>
                            </div>

                            <div className="field">
                              <label>Dynamic Ef Min</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.dynamicEfMin || 100}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), dynamicEfMin: parseInt(e.target.value) || 100 }
                                })}
                                placeholder="100"
                              />
                              <small className="hint">Minimum value for dynamic ef (default: 100)</small>
                            </div>

                            <div className="field">
                              <label>Dynamic Ef Max</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.dynamicEfMax || 500}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), dynamicEfMax: parseInt(e.target.value) || 500 }
                                })}
                                placeholder="500"
                              />
                              <small className="hint">Maximum value for dynamic ef (default: 500)</small>
                            </div>

                            <div className="field">
                              <label>Dynamic Ef Factor</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.dynamicEfFactor || 8}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), dynamicEfFactor: parseInt(e.target.value) || 8 }
                                })}
                                placeholder="8"
                              />
                              <small className="hint">Factor for dynamic ef calculation (default: 8)</small>
                            </div>

                            <div className="field">
                              <label>Flat Search Cutoff</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.flatSearchCutoff || 40000}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), flatSearchCutoff: parseInt(e.target.value) || 40000 }
                                })}
                                placeholder="40000"
                              />
                              <small className="hint">When to use flat search instead (default: 40000)</small>
                            </div>

                            <div className="field">
                              <label>Cleanup Interval Seconds</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.cleanupIntervalSeconds || 300}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), cleanupIntervalSeconds: parseInt(e.target.value) || 300 }
                                })}
                                placeholder="300"
                              />
                              <small className="hint">Interval between cleanup operations (default: 300)</small>
                            </div>

                            <div className="field">
                              <label>Vector Cache Max Objects</label>
                              <input
                                type="number"
                                value={value.indexConfig?.hnsw?.vectorCacheMaxObjects || 1000000000000}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                                })}
                                placeholder="1000000000000"
                              />
                              <small className="hint">Maximum objects in vector cache (default: 1000000000000)</small>
                            </div>

                            <div className="field">
                              <label>Filter Strategy</label>
                              <select
                                value={value.indexConfig?.hnsw?.filterStrategy || 'sweeping'}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  hnsw: { ...(value.indexConfig?.hnsw || {}), filterStrategy: e.target.value }
                                })}
                              >
                                <option value="sweeping">Sweeping</option>
                                <option value="acorn">Acorn</option>
                              </select>
                              <small className="hint">Strategy for filtering results (default: sweeping)</small>
                            </div>

                            <div className="field">
                              <label htmlFor={`hnsw-skip-${index}`}>
                                <input
                                  id={`hnsw-skip-${index}`}
                                  type="checkbox"
                                  checked={value.indexConfig?.hnsw?.skip || false}
                                  onChange={(e) => update('indexConfig', { 
                                    ...value.indexConfig, 
                                    hnsw: { ...(value.indexConfig?.hnsw || {}), skip: e.target.checked }
                                  })}
                                  style={{ width: 'auto', marginRight: '8px' }}
                                />
                                Skip HNSW Index
                              </label>
                              <small className="hint">Skip building the HNSW index (default: false)</small>
                            </div>

                            {/* HNSW Quantization */}
                            <div className="field" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                              <label htmlFor={`hnsw-quantizer-${index}`}>Quantization Type</label>
                              <select
                                id={`hnsw-quantizer-${index}`}
                                value={value.indexConfig?.hnsw?.quantizer || 'none'}
                                onChange={(e) => {
                                  const newType = e.target.value
                                  const newHnswConfig = { ...(value.indexConfig?.hnsw || {}) }
                                  
                                  // Remove all quantizer configs
                                  delete newHnswConfig.pq
                                  delete newHnswConfig.bq
                                  delete newHnswConfig.sq
                                  delete newHnswConfig.rq
                                  
                                  // Set quantizer type
                                  newHnswConfig.quantizer = newType
                                  
                                  // Add the new quantizer config with enabled: true if not 'none'
                                  if (newType !== 'none') {
                                    newHnswConfig[newType] = { enabled: true }
                                  }
                                  
                                  update('indexConfig', { 
                                    ...value.indexConfig, 
                                    hnsw: newHnswConfig
                                  })
                                }}
                              >
                                {filteredHnswQuantizerOptions.map(opt => (
                                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}</option>
                                ))}
                              </select>
                              {(() => {
                                const qType = value.indexConfig?.hnsw?.quantizer || 'none'
                                const opt = filteredHnswQuantizerOptions.find(o => o.value === qType)
                                return (
                                  <small className="hint">
                                    {opt?.description || 'Quantization compresses vectors to reduce memory usage.'}
                                    {opt?.docKey && DOC_LINKS[opt.docKey] && <>{' '}<a href={DOC_LINKS[opt.docKey]} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
                                  </small>
                                )
                              })()}
                            </div>

                            {/* PQ Configuration for HNSW */}
                            {value.indexConfig?.hnsw?.quantizer === 'pq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>PQ Settings</h6>
                                
                                <div className="field">
                                  <label>Segments</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.pq?.segments || 256}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        pq: { ...(value.indexConfig?.hnsw?.pq || {}), segments: parseInt(e.target.value) || 256 }
                                      }
                                    })}
                                    placeholder="256"
                                  />
                                  <small className="hint">Number of segments (default: 256)</small>
                                </div>

                                <div className="field">
                                  <label>Centroids</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.pq?.centroids || 256}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        pq: { ...(value.indexConfig?.hnsw?.pq || {}), centroids: parseInt(e.target.value) || 256 }
                                      }
                                    })}
                                    placeholder="256"
                                  />
                                  <small className="hint">Number of centroids per segment (default: 256)</small>
                                </div>

                                <div className="field">
                                  <label>Training Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.pq?.trainingLimit || 100000}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        pq: { ...(value.indexConfig?.hnsw?.pq || {}), trainingLimit: parseInt(e.target.value) || 100000 }
                                      }
                                    })}
                                    placeholder="100000"
                                  />
                                  <small className="hint">Maximum number of vectors used for training (default: 100000)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-pq-enabled-${index}`}>
                                    <input
                                      id={`hnsw-pq-enabled-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.pq?.enabled !== false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        hnsw: { 
                                          ...(value.indexConfig?.hnsw || {}), 
                                          pq: { ...(value.indexConfig?.hnsw?.pq || {}), enabled: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Enabled
                                  </label>
                                  <small className="hint">Enable Product Quantization (default: true)</small>
                                </div>

                                <div className="field">
                                  <label>Encoder Type</label>
                                  <select
                                    value={value.indexConfig?.hnsw?.pq?.encoder?.type || 'kmeans'}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        pq: { 
                                          ...(value.indexConfig?.hnsw?.pq || {}), 
                                          encoder: { ...(value.indexConfig?.hnsw?.pq?.encoder || {}), type: e.target.value }
                                        }
                                      }
                                    })}
                                  >
                                    <option value="kmeans">K-means</option>
                                    <option value="tile">Tile</option>
                                  </select>
                                  <small className="hint">Encoder type for PQ (default: kmeans)</small>
                                </div>

                                <div className="field">
                                  <label>Distribution</label>
                                  <select
                                    value={value.indexConfig?.hnsw?.pq?.encoder?.distribution || 'log-normal'}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        pq: { 
                                          ...(value.indexConfig?.hnsw?.pq || {}), 
                                          encoder: { ...(value.indexConfig?.hnsw?.pq?.encoder || {}), distribution: e.target.value }
                                        }
                                      }
                                    })}
                                  >
                                    <option value="log-normal">Log-normal</option>
                                    <option value="normal">Normal</option>
                                  </select>
                                  <small className="hint">Distribution type (default: log-normal)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-pq-bit-compression-${index}`}>
                                    <input
                                      id={`hnsw-pq-bit-compression-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.pq?.internalBitCompression || false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        hnsw: { 
                                          ...(value.indexConfig?.hnsw || {}), 
                                          pq: { ...(value.indexConfig?.hnsw?.pq || {}), internalBitCompression: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Internal Bit Compression
                                  </label>
                                  <small className="hint">Enable internal bit compression (default: false)</small>
                                </div>
                              </div>
                            )}

                            {/* BQ Configuration for HNSW */}
                            {value.indexConfig?.hnsw?.quantizer === 'bq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>BQ Settings</h6>
                                
                                <div className="field">
                                  <label>Rescore Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.bq?.rescoreLimit ?? -1}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        bq: { ...(value.indexConfig?.hnsw?.bq || {}), rescoreLimit: parseInt(e.target.value) }
                                      }
                                    })}
                                    placeholder="-1 (unlimited)"
                                  />
                                  <small className="hint">Number of candidates to rescore (-1 = unlimited, default: -1)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-bq-cache-${index}`}>
                                    <input
                                      id={`hnsw-bq-cache-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.bq?.cache || false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        hnsw: { 
                                          ...(value.indexConfig?.hnsw || {}), 
                                          bq: { ...(value.indexConfig?.hnsw?.bq || {}), cache: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Cache
                                  </label>
                                  <small className="hint">Enable caching for BQ (default: false)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-bq-enabled-${index}`}>
                                    <input
                                      id={`hnsw-bq-enabled-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.bq?.enabled !== false}
                                      onChange={(e) => update('indexConfig', {
                                        ...value.indexConfig,
                                        hnsw: {
                                          ...(value.indexConfig?.hnsw || {}),
                                          bq: { ...(value.indexConfig?.hnsw?.bq || {}), enabled: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Enabled
                                  </label>
                                  <small className="hint">Enable Binary Quantization (default: true)</small>
                                </div>

                                <div className="field">
                                  <label>Vector Cache Max Objects</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.bq?.vectorCacheMaxObjects || 1000000000000}
                                    onChange={(e) => update('indexConfig', {
                                      ...value.indexConfig,
                                      hnsw: {
                                        ...(value.indexConfig?.hnsw || {}),
                                        bq: { ...(value.indexConfig?.hnsw?.bq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                                      }
                                    })}
                                    placeholder="1000000000000"
                                  />
                                  <small className="hint">Maximum objects in the memory cache for BQ (default: 1000000000000)</small>
                                </div>
                              </div>
                            )}

                            {/* SQ Configuration for HNSW */}
                            {value.indexConfig?.hnsw?.quantizer === 'sq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>SQ Settings</h6>
                                
                                <div className="field">
                                  <label>Rescore Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.sq?.rescoreLimit ?? -1}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        sq: { ...(value.indexConfig?.hnsw?.sq || {}), rescoreLimit: parseInt(e.target.value) }
                                      }
                                    })}
                                    placeholder="-1 (unlimited)"
                                  />
                                  <small className="hint">Number of candidates to rescore (-1 = unlimited, default: -1)</small>
                                </div>

                                <div className="field">
                                  <label>Training Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.sq?.trainingLimit || 100000}
                                    onChange={(e) => update('indexConfig', {
                                      ...value.indexConfig,
                                      hnsw: {
                                        ...(value.indexConfig?.hnsw || {}),
                                        sq: { ...(value.indexConfig?.hnsw?.sq || {}), trainingLimit: parseInt(e.target.value) || 100000 }
                                      }
                                    })}
                                    placeholder="100000"
                                  />
                                  <small className="hint">Maximum number of vectors used for training (default: 100000)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-sq-cache-${index}`}>
                                    <input
                                      id={`hnsw-sq-cache-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.sq?.cache || false}
                                      onChange={(e) => update('indexConfig', {
                                        ...value.indexConfig,
                                        hnsw: {
                                          ...(value.indexConfig?.hnsw || {}),
                                          sq: { ...(value.indexConfig?.hnsw?.sq || {}), cache: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Cache
                                  </label>
                                  <small className="hint">Cache vectors in memory (default: false)</small>
                                </div>

                                <div className="field">
                                  <label>Vector Cache Max Objects</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.sq?.vectorCacheMaxObjects || 1000000000000}
                                    onChange={(e) => update('indexConfig', {
                                      ...value.indexConfig,
                                      hnsw: {
                                        ...(value.indexConfig?.hnsw || {}),
                                        sq: { ...(value.indexConfig?.hnsw?.sq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                                      }
                                    })}
                                    placeholder="1000000000000"
                                  />
                                  <small className="hint">Maximum objects in the memory cache for SQ (default: 1000000000000)</small>
                                </div>
                              </div>
                            )}

                            {/* RQ Configuration for HNSW */}
                            <VersionGated featureId="rqQuantizationHnsw">
                            {value.indexConfig?.hnsw?.quantizer === 'rq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>RQ Settings</h6>
                                
                                <div className="field">
                                  <label>Bits</label>
                                  <select
                                    value={value.indexConfig?.hnsw?.rq?.bits || 8}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        rq: { ...(value.indexConfig?.hnsw?.rq || {}), bits: parseInt(e.target.value) }
                                      }
                                    })}
                                  >
                                    <option value="1">1</option>
                                    <option value="8">8</option>
                                  </select>
                                  <small className="hint">Number of bits for quantization (default: 8)</small>
                                </div>

                                <div className="field">
                                  <label>Rescore Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.rq?.rescoreLimit || 20}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      hnsw: { 
                                        ...(value.indexConfig?.hnsw || {}), 
                                        rq: { ...(value.indexConfig?.hnsw?.rq || {}), rescoreLimit: parseInt(e.target.value) || 20 }
                                      }
                                    })}
                                    placeholder="20"
                                  />
                                  <small className="hint">Number of candidates to rescore (default: 20)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-rq-enabled-${index}`}>
                                    <input
                                      id={`hnsw-rq-enabled-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.rq?.enabled !== false}
                                      onChange={(e) => update('indexConfig', {
                                        ...value.indexConfig,
                                        hnsw: {
                                          ...(value.indexConfig?.hnsw || {}),
                                          rq: { ...(value.indexConfig?.hnsw?.rq || {}), enabled: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Enabled
                                  </label>
                                  <small className="hint">Enable Rotational Quantization (default: true)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`hnsw-rq-cache-${index}`}>
                                    <input
                                      id={`hnsw-rq-cache-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.hnsw?.rq?.cache || false}
                                      onChange={(e) => update('indexConfig', {
                                        ...value.indexConfig,
                                        hnsw: {
                                          ...(value.indexConfig?.hnsw || {}),
                                          rq: { ...(value.indexConfig?.hnsw?.rq || {}), cache: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Cache
                                  </label>
                                  <small className="hint">Cache vectors in memory (default: false)</small>
                                </div>

                                <div className="field">
                                  <label>Vector Cache Max Objects</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.hnsw?.rq?.vectorCacheMaxObjects || 1000000000000}
                                    onChange={(e) => update('indexConfig', {
                                      ...value.indexConfig,
                                      hnsw: {
                                        ...(value.indexConfig?.hnsw || {}),
                                        rq: { ...(value.indexConfig?.hnsw?.rq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                                      }
                                    })}
                                    placeholder="1000000000000"
                                  />
                                  <small className="hint">Maximum objects in the memory cache for RQ (default: 1000000000000)</small>
                                </div>
                              </div>
                            )}
                            </VersionGated>
                          </div>
                        )}

                        {/* Flat Configuration for Dynamic */}
                        {dynamicSubTab === 'flat' && (
                          <div className="tab-panel">
                            <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>Flat Parameters</h6>
                            
                            <div className="field">
                              <label>Distance Metric</label>
                              <select
                                value={value.indexConfig?.flat?.distanceMetric || 'cosine'}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  flat: { ...(value.indexConfig?.flat || {}), distanceMetric: e.target.value }
                                })}
                              >
                                <option value="cosine">Cosine</option>
                                <option value="dot">Dot Product</option>
                                <option value="l2-squared">L2 Squared</option>
                                <option value="manhattan">Manhattan</option>
                                <option value="hamming">Hamming</option>
                              </select>
                              <small className="hint">Distance metric for Flat index</small>
                            </div>

                            <div className="field">
                              <label>Vector Cache Max Objects</label>
                              <input
                                type="number"
                                value={value.indexConfig?.flat?.vectorCacheMaxObjects || 1000000000000}
                                onChange={(e) => update('indexConfig', { 
                                  ...value.indexConfig, 
                                  flat: { ...(value.indexConfig?.flat || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                                })}
                                placeholder="1000000000000"
                              />
                              <small className="hint">Maximum objects in vector cache (default: 1000000000000)</small>
                            </div>

                            {/* Flat Quantization - BQ and RQ available */}
                            <div className="field" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                              <label htmlFor={`dynamic-flat-quantizer-${index}`}>Quantization Type</label>
                              <select
                                id={`dynamic-flat-quantizer-${index}`}
                                value={value.indexConfig?.flat?.quantizer || 'none'}
                                onChange={(e) => {
                                  const newType = e.target.value
                                  const newFlatConfig = { ...(value.indexConfig?.flat || {}) }
                                  
                                  // Remove all quantizer configs
                                  delete newFlatConfig.bq
                                  delete newFlatConfig.rq
                                  
                                  // Set quantizer type
                                  newFlatConfig.quantizer = newType
                                  
                                  // Add the new quantizer config with enabled: true if not 'none'
                                  if (newType !== 'none') {
                                    newFlatConfig[newType] = { enabled: true }
                                  }
                                  
                                  update('indexConfig', { 
                                    ...value.indexConfig, 
                                    flat: newFlatConfig
                                  })
                                }}
                              >
                                {filteredFlatQuantizerOptions.map(opt => (
                                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}</option>
                                ))}
                              </select>
                              {(() => {
                                const qType = value.indexConfig?.flat?.quantizer || 'none'
                                const opt = filteredFlatQuantizerOptions.find(o => o.value === qType)
                                return (
                                  <small className="hint">
                                    {opt?.description || 'Quantization compresses vectors to reduce memory usage.'}
                                    {opt?.docKey && DOC_LINKS[opt.docKey] && <>{' '}<a href={DOC_LINKS[opt.docKey]} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
                                  </small>
                                )
                              })()}
                            </div>

                            {/* BQ Configuration for Flat */}
                            {value.indexConfig?.flat?.quantizer === 'bq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>BQ Settings</h6>
                                
                                <div className="field">
                                  <label>Rescore Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.flat?.bq?.rescoreLimit ?? -1}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      flat: { 
                                        ...(value.indexConfig?.flat || {}), 
                                        bq: { ...(value.indexConfig?.flat?.bq || {}), rescoreLimit: parseInt(e.target.value) }
                                      }
                                    })}
                                    placeholder="-1 (unlimited)"
                                  />
                                  <small className="hint">Number of candidates to rescore (-1 = unlimited, default: -1)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`flat-bq-cache-${index}`}>
                                    <input
                                      id={`flat-bq-cache-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.flat?.bq?.cache || false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        flat: { 
                                          ...(value.indexConfig?.flat || {}), 
                                          bq: { ...(value.indexConfig?.flat?.bq || {}), cache: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Cache
                                  </label>
                                  <small className="hint">Enable caching for BQ (default: false)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`flat-bq-enabled-${index}`}>
                                    <input
                                      id={`flat-bq-enabled-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.flat?.bq?.enabled !== false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        flat: { 
                                          ...(value.indexConfig?.flat || {}), 
                                          bq: { ...(value.indexConfig?.flat?.bq || {}), enabled: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Enabled
                                  </label>
                                  <small className="hint">Enable Binary Quantization (default: true)</small>
                                </div>
                              </div>
                            )}

                            {/* RQ Configuration for Flat */}
                            <VersionGated featureId="rqQuantizationFlat">
                            {value.indexConfig?.flat?.quantizer === 'rq' && (
                              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '4px' }} className="quantization-config">
                                <h6 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 500 }}>RQ Settings</h6>
                                
                                <div className="field">
                                  <label>Bits</label>
                                  <select
                                    value={value.indexConfig?.flat?.rq?.bits || 8}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      flat: { 
                                        ...(value.indexConfig?.flat || {}), 
                                        rq: { ...(value.indexConfig?.flat?.rq || {}), bits: parseInt(e.target.value) }
                                      }
                                    })}
                                  >
                                    <option value="1">1</option>
                                    <option value="8">8</option>
                                  </select>
                                  <small className="hint">Number of bits for quantization (default: 8)</small>
                                </div>

                                <div className="field">
                                  <label>Rescore Limit</label>
                                  <input
                                    type="number"
                                    value={value.indexConfig?.flat?.rq?.rescoreLimit || 20}
                                    onChange={(e) => update('indexConfig', { 
                                      ...value.indexConfig, 
                                      flat: { 
                                        ...(value.indexConfig?.flat || {}), 
                                        rq: { ...(value.indexConfig?.flat?.rq || {}), rescoreLimit: parseInt(e.target.value) || 20 }
                                      }
                                    })}
                                    placeholder="20"
                                  />
                                  <small className="hint">Number of candidates to rescore (default: 20)</small>
                                </div>

                                <div className="field">
                                  <label htmlFor={`flat-rq-enabled-${index}`}>
                                    <input
                                      id={`flat-rq-enabled-${index}`}
                                      type="checkbox"
                                      checked={value.indexConfig?.flat?.rq?.enabled !== false}
                                      onChange={(e) => update('indexConfig', { 
                                        ...value.indexConfig, 
                                        flat: { 
                                          ...(value.indexConfig?.flat || {}), 
                                          rq: { ...(value.indexConfig?.flat?.rq || {}), enabled: e.target.checked }
                                        }
                                      })}
                                      style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    Enabled
                                  </label>
                                  <small className="hint">Enable Rotational Quantization (default: true)</small>
                                </div>
                              </div>
                            )}
                            </VersionGated>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Compression/Quantization */}
            {activeTab === 'compression' && (
              <div className="tab-panel">
                <div className="field">
                  <label htmlFor={`compression-quantizer-${index}`}>Quantization Type</label>
                  {(() => {
                    const isFlatIndex = value.indexType === 'flat'
                    const quantizerOptions = isFlatIndex ? filteredFlatQuantizerOptions : filteredHnswQuantizerOptions
                    const qType = isFlatIndex
                      ? (value.indexConfig?.bq ? 'bq' : value.indexConfig?.rq ? 'rq' : 'none')
                      : (value.indexConfig?.pq ? 'pq' : value.indexConfig?.bq ? 'bq' : value.indexConfig?.sq ? 'sq' : value.indexConfig?.rq ? 'rq' : 'none')
                    const selectedOpt = quantizerOptions.find(o => o.value === qType)
                    return (
                      <>
                        <select
                          id={`compression-quantizer-${index}`}
                          value={qType}
                          onChange={(e) => {
                            const newType = e.target.value
                            const newIndexConfig = { ...value.indexConfig }
                            delete newIndexConfig.pq
                            delete newIndexConfig.bq
                            delete newIndexConfig.sq
                            delete newIndexConfig.rq
                            if (newType !== 'none') {
                              newIndexConfig[newType] = { enabled: true }
                            }
                            update('indexConfig', newIndexConfig)
                          }}
                        >
                          {quantizerOptions.map(opt => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}</option>
                          ))}
                        </select>
                        <small className="hint">
                          {selectedOpt?.description || 'Quantization compresses vectors to reduce memory usage at the cost of some recall accuracy.'}
                          {selectedOpt?.docKey && DOC_LINKS[selectedOpt.docKey] && <>{' '}<a href={DOC_LINKS[selectedOpt.docKey]} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
                        </small>
                      </>
                    )
                  })()}
                </div>

                {/* Product Quantization Configuration */}
                {value.indexConfig?.pq && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Product Quantization Settings</h5>

                    <div className="field">
                      <label htmlFor={`pq-enabled-${index}`}>
                        <input
                          id={`pq-enabled-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.pq?.enabled !== false}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            pq: { ...(value.indexConfig?.pq || {}), enabled: e.target.checked }
                          })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Enabled
                      </label>
                      <small className="hint">Enable Product Quantization (default: true)</small>
                    </div>

                    <div className="field">
                      <label>Segments</label>
                      <input
                        type="number"
                        value={value.indexConfig?.pq?.segments || 0}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          pq: { ...(value.indexConfig?.pq || {}), segments: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="0 (auto)"
                      />
                      <small className="hint">Number of segments (0 = auto, recommended: 0, 96, 128, 256)</small>
                    </div>

                    <div className="field">
                      <label>Centroids</label>
                      <input
                        type="number"
                        value={value.indexConfig?.pq?.centroids || 256}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          pq: { ...(value.indexConfig?.pq || {}), centroids: parseInt(e.target.value) || 256 }
                        })}
                        placeholder="256"
                      />
                      <small className="hint">Number of centroids per segment (default: 256)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`pq-training-limit-${index}`}>
                        <input
                          id={`pq-training-limit-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.pq?.trainingLimit !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('indexConfig', {
                                ...value.indexConfig,
                                pq: { ...(value.indexConfig?.pq || {}), trainingLimit: 100000 }
                              })
                            } else {
                              const { trainingLimit, ...rest } = value.indexConfig?.pq || {}
                              update('indexConfig', {
                                ...value.indexConfig,
                                pq: rest
                              })
                            }
                          }}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Set Training Limit
                      </label>
                      {value.indexConfig?.pq?.trainingLimit !== undefined && (
                        <input
                          type="number"
                          value={value.indexConfig?.pq?.trainingLimit || 100000}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            pq: { ...(value.indexConfig?.pq || {}), trainingLimit: parseInt(e.target.value) || 100000 }
                          })}
                          placeholder="100000"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                      <small className="hint">Maximum number of vectors used for training (default: 100000)</small>
                    </div>

                    <div className="field">
                      <label>Encoder Type</label>
                      <select
                        value={value.indexConfig?.pq?.encoder?.type || 'kmeans'}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          pq: {
                            ...(value.indexConfig?.pq || {}),
                            encoder: { ...(value.indexConfig?.pq?.encoder || {}), type: e.target.value }
                          }
                        })}
                      >
                        <option value="kmeans">K-means</option>
                        <option value="tile">Tile</option>
                      </select>
                      <small className="hint">Encoder used to fit the centroids (default: kmeans)</small>
                    </div>

                    <div className="field">
                      <label>Encoder Distribution</label>
                      <select
                        value={value.indexConfig?.pq?.encoder?.distribution || 'log-normal'}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          pq: {
                            ...(value.indexConfig?.pq || {}),
                            encoder: { ...(value.indexConfig?.pq?.encoder || {}), distribution: e.target.value }
                          }
                        })}
                      >
                        <option value="log-normal">Log-normal</option>
                        <option value="normal">Normal</option>
                      </select>
                      <small className="hint">Data distribution assumed by the tile encoder (default: log-normal)</small>
                    </div>
                  </div>
                )}

                {/* Binary Quantization Configuration */}
                {value.indexConfig?.bq && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Binary Quantization Settings</h5>

                    <div className="field">
                      <label htmlFor={`bq-enabled-tab3-${index}`}>
                        <input
                          id={`bq-enabled-tab3-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.bq?.enabled !== false}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            bq: { ...(value.indexConfig?.bq || {}), enabled: e.target.checked }
                          })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Enabled
                      </label>
                      <small className="hint">Enable Binary Quantization (default: true)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`bq-rescore-limit-${index}`}>
                        <input
                          id={`bq-rescore-limit-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.bq?.rescoreLimit !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('indexConfig', {
                                ...value.indexConfig,
                                bq: { ...(value.indexConfig?.bq || {}), rescoreLimit: -1 }
                              })
                            } else {
                              const { rescoreLimit, ...rest } = value.indexConfig?.bq || {}
                              update('indexConfig', {
                                ...value.indexConfig,
                                bq: rest
                              })
                            }
                          }}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Set Rescore Limit
                      </label>
                      {value.indexConfig?.bq?.rescoreLimit !== undefined && (
                        <input
                          type="number"
                          value={value.indexConfig?.bq?.rescoreLimit || -1}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            bq: { ...(value.indexConfig?.bq || {}), rescoreLimit: parseInt(e.target.value) }
                          })}
                          placeholder="-1 (unlimited)"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                      <small className="hint">Number of candidates to rescore (-1 = unlimited, default: -1)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`bq-cache-tab3-${index}`}>
                        <input
                          id={`bq-cache-tab3-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.bq?.cache || false}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            bq: { ...(value.indexConfig?.bq || {}), cache: e.target.checked }
                          })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Cache
                      </label>
                      <small className="hint">Cache vectors in memory (default: false)</small>
                    </div>

                    <div className="field">
                      <label>Vector Cache Max Objects</label>
                      <input
                        type="number"
                        value={value.indexConfig?.bq?.vectorCacheMaxObjects || 1000000000000}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          bq: { ...(value.indexConfig?.bq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                        })}
                        placeholder="1000000000000"
                      />
                      <small className="hint">Maximum objects in the memory cache for BQ (default: 1000000000000)</small>
                    </div>
                  </div>
                )}

                {/* Scalar Quantization Configuration */}
                {value.indexConfig?.sq && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Scalar Quantization Settings</h5>
                    
                    <div className="field">
                      <label htmlFor={`sq-rescore-limit-${index}`}>
                        <input
                          id={`sq-rescore-limit-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.sq?.rescoreLimit !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                sq: { ...(value.indexConfig?.sq || {}), rescoreLimit: -1 }
                              })
                            } else {
                              const { rescoreLimit, ...rest } = value.indexConfig?.sq || {}
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                sq: rest
                              })
                            }
                          }}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Set Rescore Limit
                      </label>
                      {value.indexConfig?.sq?.rescoreLimit !== undefined && (
                        <input
                          type="number"
                          value={value.indexConfig?.sq?.rescoreLimit || -1}
                          onChange={(e) => update('indexConfig', { 
                            ...value.indexConfig, 
                            sq: { ...(value.indexConfig?.sq || {}), rescoreLimit: parseInt(e.target.value) }
                          })}
                          placeholder="-1 (unlimited)"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                      <small className="hint">Number of candidates to rescore (-1 = unlimited)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`sq-training-limit-${index}`}>
                        <input
                          id={`sq-training-limit-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.sq?.trainingLimit !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                sq: { ...(value.indexConfig?.sq || {}), trainingLimit: 100000 }
                              })
                            } else {
                              const { trainingLimit, ...rest } = value.indexConfig?.sq || {}
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                sq: rest
                              })
                            }
                          }}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Set Training Limit
                      </label>
                      {value.indexConfig?.sq?.trainingLimit !== undefined && (
                        <input
                          type="number"
                          value={value.indexConfig?.sq?.trainingLimit || 100000}
                          onChange={(e) => update('indexConfig', { 
                            ...value.indexConfig, 
                            sq: { ...(value.indexConfig?.sq || {}), trainingLimit: parseInt(e.target.value) || 100000 }
                          })}
                          placeholder="100000"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                      <small className="hint">Maximum number of vectors used for training (default: 100000)</small>
                    </div>

                    <div className="field">
                      <label>Vector Cache Max Objects</label>
                      <input
                        type="number"
                        value={value.indexConfig?.sq?.vectorCacheMaxObjects || 1000000000000}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          sq: { ...(value.indexConfig?.sq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                        })}
                        placeholder="1000000000000"
                      />
                      <small className="hint">Maximum objects in the memory cache for SQ (default: 1000000000000)</small>
                    </div>
                  </div>
                )}

                {/* Rotational Quantization Configuration */}
                <VersionGated featureId="rqQuantizationHnsw">
                {value.indexConfig?.rq && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Rotational Quantization Settings</h5>
                    
                    <div className="field">
                      <label>Bits</label>
                      <select
                        value={value.indexConfig?.rq?.bits || 8}
                        onChange={(e) => update('indexConfig', { 
                          ...value.indexConfig, 
                          rq: { ...(value.indexConfig?.rq || {}), bits: parseInt(e.target.value) }
                        })}
                      >
                        <option value="1">1</option>
                        <option value="8">8</option>
                      </select>
                      <small className="hint">Number of bits for quantization (default: 8)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`rq-rescore-limit-${index}`}>
                        <input
                          id={`rq-rescore-limit-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.rq?.rescoreLimit !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                rq: { ...(value.indexConfig?.rq || {}), rescoreLimit: 20 }
                              })
                            } else {
                              const { rescoreLimit, ...rest } = value.indexConfig?.rq || {}
                              update('indexConfig', { 
                                ...value.indexConfig, 
                                rq: rest
                              })
                            }
                          }}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Set Rescore Limit
                      </label>
                      {value.indexConfig?.rq?.rescoreLimit !== undefined && (
                        <input
                          type="number"
                          value={value.indexConfig?.rq?.rescoreLimit || 20}
                          onChange={(e) => update('indexConfig', { 
                            ...value.indexConfig, 
                            rq: { ...(value.indexConfig?.rq || {}), rescoreLimit: parseInt(e.target.value) || 20 }
                          })}
                          placeholder="20"
                          style={{ marginTop: '8px' }}
                        />
                      )}
                      <small className="hint">Number of candidates to rescore (default: 20)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`rq-enabled-${index}`}>
                        <input
                          id={`rq-enabled-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.rq?.enabled !== false}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            rq: { ...(value.indexConfig?.rq || {}), enabled: e.target.checked }
                          })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Enabled
                      </label>
                      <small className="hint">Enable Rotational Quantization (default: true)</small>
                    </div>

                    <div className="field">
                      <label htmlFor={`rq-cache-tab3-${index}`}>
                        <input
                          id={`rq-cache-tab3-${index}`}
                          type="checkbox"
                          checked={value.indexConfig?.rq?.cache || false}
                          onChange={(e) => update('indexConfig', {
                            ...value.indexConfig,
                            rq: { ...(value.indexConfig?.rq || {}), cache: e.target.checked }
                          })}
                          style={{ width: 'auto', marginRight: '8px' }}
                        />
                        Cache
                      </label>
                      <small className="hint">Cache vectors in memory (default: false)</small>
                    </div>

                    <div className="field">
                      <label>Vector Cache Max Objects</label>
                      <input
                        type="number"
                        value={value.indexConfig?.rq?.vectorCacheMaxObjects || 1000000000000}
                        onChange={(e) => update('indexConfig', {
                          ...value.indexConfig,
                          rq: { ...(value.indexConfig?.rq || {}), vectorCacheMaxObjects: parseInt(e.target.value) || 1000000000000 }
                        })}
                        placeholder="1000000000000"
                      />
                      <small className="hint">Maximum objects in the memory cache for RQ (default: 1000000000000)</small>
                    </div>
                  </div>
                )}
                </VersionGated>

                {!value.indexConfig?.pq && !value.indexConfig?.bq && !value.indexConfig?.sq && !value.indexConfig?.rq && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      No compression is applied. Vectors are stored in full precision.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
