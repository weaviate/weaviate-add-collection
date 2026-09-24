import React, { useState, useEffect } from 'react'
import { tokenizationOptions, dataTypeOptions } from '../constants/options'
import DOC_LINKS from '../constants/docLinks.json'
import { validatePropertyName, sanitizePropertyName } from '../utils/propertyNameValidator'
import NestedPropertySection from './NestedPropertySection'
import TagInput from './TagInput'
import { VersionGated, useVersionFilteredOptions } from '../context/VersionContext'
import { createDefaultTextAnalyzer, BUILTIN_STOPWORD_PRESETS } from '../constants/tokenizationDefaults'

export default function PropertyItem({ value, onChange, onDelete, index, isNested = false, depth = 0, stopwordPresetNames = [] }) {
  const filteredTokenizationOptions = useVersionFilteredOptions(tokenizationOptions)
  const [nameValidation, setNameValidation] = useState({ valid: true, error: null, warning: null })
  
  useEffect(() => {
    // Validate the name whenever it changes
    if (value.name) {
      const validation = validatePropertyName(value.name)
      setNameValidation(validation)
    } else {
      setNameValidation({ valid: true, error: null, warning: null })
    }
  }, [value.name])
  
  function update(key, val) {
    onChange({ ...value, [key]: val })
  }
  
  function handleNameChange(newName) {
    update('name', newName)
  }
  
  function handleNameBlur() {
    // Auto-sanitize on blur if invalid
    if (value.name && !nameValidation.valid) {
      const sanitized = sanitizePropertyName(value.name)
      if (sanitized !== value.name) {
        update('name', sanitized)
      }
    }
  }

  function updateTextAnalyzer(field, fieldValue) {
    update('textAnalyzer', {
      ...createDefaultTextAnalyzer(),
      ...(value.textAnalyzer || {}),
      [field]: fieldValue,
    })
  }

  function updateDataType(val) {
    // When changing data type, reset type-specific properties
    const newValue = {
      name: value.name,
      description: value.description,
      dataType: val,
      isArray: value.isArray,
      indexFilterable: value.indexFilterable
    }

    // Only add properties relevant to the new data type
    if (val === 'text') {
      newValue.tokenization = 'word'
      newValue.indexSearchable = true
    } else if (val === 'int' || val === 'number' || val === 'date') {
      newValue.indexRangeFilters = false
    } else if (val === 'object') {
      newValue.nestedProperties = []
      newValue.indexSearchable = false
    } else if (val === 'cross-reference') {
      newValue.crossReferenceTarget = ''
      newValue.isArray = false
      newValue.indexFilterable = false
    }

    onChange(newValue)
  }

  function updateNestedProperties(nestedProps) {
    update('nestedProperties', nestedProps)
  }

  return (
    <div className="property-item card">
      <div className="property-header">
        <strong>{value.name && value.name.trim() !== '' ? value.name : `Property ${index + 1}`}</strong>
        <div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete && onDelete()}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="field">
        <label>Name</label>
        <input 
          value={value.name || ''} 
          onChange={(e) => handleNameChange(e.target.value)} 
          onBlur={handleNameBlur}
          placeholder={`new_property${index + 1}`}
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
        {nameValidation.valid && !nameValidation.warning && value.name && (
          <small className="success-text" style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
            ✓ Valid property name
          </small>
        )}
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={value.description || ''} onChange={(e) => update('description', e.target.value)} placeholder={`Description for new_property${index + 1}`} />
      </div>      

      <div className="field field--row">
        <div className="data-type-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label className="data-type-label" style={{ margin: 0 }}>Data Type</label>
            {(() => {
              const opt = dataTypeOptions.find(o => o.value === (value.dataType || 'text'))
              const href = (opt?.docKey && DOC_LINKS[opt.docKey]) || DOC_LINKS.dataType
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="doc-link" title="View documentation">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </a>
              )
            })()}
          </div>
          <select className="data-type-select" value={value.dataType || 'text'} onChange={(e) => updateDataType(e.target.value)}>
            {dataTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {value.dataType !== 'cross-reference' && (
          <div className="array-group">
            <label className="array-label">
              <input type="checkbox" checked={!!value.isArray} onChange={(e) => update('isArray', e.target.checked)} />
              <span>array</span>
            </label>
          </div>
        )}
      </div>

      {value.dataType === 'cross-reference' && (
        <div className="field" style={{ marginTop: '12px' }}>
          <label>Target Collection</label>
          <input
            type="text"
            value={value.crossReferenceTarget || ''}
            onChange={(e) => update('crossReferenceTarget', e.target.value)}
            placeholder="e.g. Article, Author"
          />
          <small className="hint">
            The name of the collection this property links to. Must start with an uppercase letter and exist previously.{' '}
            <a href={DOC_LINKS.crossReference} target="_blank" rel="noopener noreferrer">View documentation ↗</a>
          </small>
        </div>
      )}

      {value.dataType === 'text' && (
        <>
          <div className="field">
            <label>Tokenization</label>
            <select value={value.tokenization || 'word'} onChange={(e) => update('tokenization', e.target.value)}>
              {filteredTokenizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}{opt.helpText ? ` — ${opt.helpText}` : ''}
                </option>
              ))}
            </select>
            <small className="help-text">
              {filteredTokenizationOptions.find(opt => opt.value === (value.tokenization || 'word'))?.description}
              {DOC_LINKS.tokenization && <>{' '}<a href={DOC_LINKS.tokenization} target="_blank" rel="noopener noreferrer">View documentation ↗</a></>}
            </small>
          </div>

          <VersionGated featureId="textAnalyzer">
            <div className="nested-section">
              <div className="nested-section-title">
                Text Analyzer
                {DOC_LINKS.textAnalyzer && (
                  <a href={DOC_LINKS.textAnalyzer} target="_blank" rel="noopener noreferrer" title="View documentation" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </a>
                )}
              </div>

              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={value.textAnalyzer?.asciiFold || false}
                    onChange={(e) => updateTextAnalyzer('asciiFold', e.target.checked)}
                    style={{ width: 'auto', marginRight: '8px' }}
                  />
                  <span>ASCII Fold</span>
                </label>
                <small className="hint">
                  Folds accents and diacritics to their base characters, so “école” matches “ecole”.
                  Cannot be changed after the property is created.
                </small>
              </div>

              {value.textAnalyzer?.asciiFold && (
                <div className="field">
                  <TagInput
                    tags={value.textAnalyzer?.asciiFoldIgnore || []}
                    setTags={(tags) => updateTextAnalyzer('asciiFoldIgnore', tags)}
                    label="ASCII Fold Ignore"
                    placeholder="Add character"
                  />
                  <small className="hint">
                    Characters to leave unfolded. Editable later, but changes only affect data
                    indexed afterwards — existing objects are not re-indexed.
                  </small>
                </div>
              )}

              {/* The server only honours stopwordPreset for 'word' tokenization. */}
              {(value.tokenization || 'word') === 'word' && (
                <div className="field">
                  <label>Stopword Preset</label>
                  <select
                    value={value.textAnalyzer?.stopwordPreset || ''}
                    onChange={(e) => updateTextAnalyzer('stopwordPreset', e.target.value)}
                  >
                    <option value="">Use collection default</option>
                    {BUILTIN_STOPWORD_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                    {stopwordPresetNames
                      .filter((preset) => !BUILTIN_STOPWORD_PRESETS.includes(preset))
                      .map((preset) => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                  </select>
                  <small className="hint">
                    Overrides the collection-level stopwords for this property. Define your own
                    presets under Inverted Index Configuration.
                  </small>
                </div>
              )}
            </div>
          </VersionGated>

          <div className="field">
            <h5 style={{ margin: '12px 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Vectorization Settings (per-property)</h5>
            <small className="hint" style={{ display: 'block', marginBottom: '12px' }}>
              Configure how this property should be vectorized. These settings apply to all vectorizers unless overridden.
            </small>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={value.vectorizePropertyName || false}
                  onChange={(e) => update('vectorizePropertyName', e.target.checked)}
                  style={{ width: 'auto', marginRight: '8px' }}
                />
                <span>Vectorize Property Name</span>
              </label>
              <small className="hint" style={{ marginLeft: '24px', marginTop: '-4px' }}>
                Include the property name itself when creating embeddings
              </small>
            </div>
          </div>
        </>
      )}



      {value.dataType !== 'cross-reference' && (
        <div className="row">
          <label><input type="checkbox" checked={!!value.indexFilterable} onChange={(e) => update('indexFilterable', e.target.checked)} /> indexFilterable</label>
          {value.dataType === 'text' && (
            <label><input type="checkbox" checked={!!value.indexSearchable} onChange={(e) => update('indexSearchable', e.target.checked)} /> indexSearchable</label>
          )}
          {(value.dataType === 'int' || value.dataType === 'number' || value.dataType === 'date') && (
            <VersionGated featureId="indexRangeFilters">
              <label><input type="checkbox" checked={!!value.indexRangeFilters} onChange={(e) => update('indexRangeFilters', e.target.checked)} /> indexRangeFilters</label>
            </VersionGated>
          )}
        </div>
      )}

      {value.dataType === 'object' && (
        <NestedPropertySection 
          nestedProperties={value.nestedProperties || []}
          onChange={updateNestedProperties}
          depth={depth + 1}
          stopwordPresetNames={stopwordPresetNames}
        />
      )}

    </div>
  )
}
