import React, { useState, useEffect } from 'react'
import Collection from './components/Collection'
import JsonSchemaImport from './components/JsonSchemaImport'

export default function App() {
  const [importedJson, setImportedJson] = useState(null)
  const [currentSchema, setCurrentSchema] = useState(null)
  const [nodesNumber, setNodesNumber] = useState(null)
  const [weaviateVersion, setWeaviateVersion] = useState('')
  // Example: You can pass availableModules from your server
  // const [availableModules, setAvailableModules] = useState(null)

  // Read nodesNumber and jsonschema from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const nodes = params.get('nodesNumber')
    if (nodes) {
      const parsed = parseInt(nodes, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setNodesNumber(parsed)
      }
    }

    const jsonschema = params.get('jsonschema')
    if (jsonschema) {
      try {
        setImportedJson(JSON.parse(jsonschema))
      } catch (err) {
        console.error('Invalid jsonschema URL parameter:', err)
      }
    }
  }, [])

  // Example: onChange callback to track schema changes
  const handleSchemaChange = (schema) => {
    setCurrentSchema(schema)
    console.log('Schema updated:', schema)
  }

  // Example: onSubmit callback to create collection
  const handleSubmit = async (schema) => {
    console.log('Creating collection with schema:', schema)
    
    // Example: Send to your Weaviate instance
    // Uncomment and modify the URL to match your Weaviate instance
    /*
    try {
      const response = await fetch('http://localhost:8080/v1/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      })
      if (response.ok) {
        alert('Collection created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create collection: ${error.error?.[0]?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
      alert(`Error: ${error.message}`)
    }
    */
    
    // For demo purposes, just show an alert
    alert(`Would create collection: ${schema.class}\n\nCheck console for full schema.`)
  }

  return (
    <div className="container">
      <div className="card-header">
        <h1>Weaviate — Add Collection</h1>
        <small className="hint build-info">
          <a href="https://www.npmjs.com/package/@weaviate/add-collection" target="_blank" rel="noopener noreferrer">
            @weaviate/add-collection v{__APP_VERSION__}
          </a>
          {__APP_COMMIT__ && (
            <>
              {' · '}
              <a href={`https://github.com/weaviate/weaviate-add-collection/commit/${__APP_COMMIT__}`} target="_blank" rel="noopener noreferrer">
                {__APP_COMMIT__}
              </a>
            </>
          )}
        </small>
      </div>
      
      <div className="card-section">
        <div className="field version-field">
          <label>
            Weaviate Server Version
            <span className="label-hint">(optional)</span>
          </label>
          <input
            type="text"
            value={weaviateVersion}
            onChange={(e) => setWeaviateVersion(e.target.value)}
            placeholder="e.g. 1.24.0 — leave blank to show all features"
          />
          <small className="hint">Fields unavailable in this version will be greyed out with a tooltip</small>
        </div>
      </div>

      <JsonSchemaImport onSchemaLoad={setImportedJson} />

      <Collection
        initialJson={importedJson}
        onChange={handleSchemaChange}
        onSubmit={handleSubmit}
        nodesNumber={nodesNumber}
        hideCreateButton={true}
        weaviateVersion={weaviateVersion || null}
        // availableModules={availableModules} // Optional: pass server modules here
      />
    </div>
  )
}
