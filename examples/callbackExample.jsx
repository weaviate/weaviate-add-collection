/**
 * Example: Using Collection component with onChange and onSubmit callbacks
 * 
 * This example demonstrates the programmatic contract for schema handoff
 * without needing to scrape the DOM.
 */

import React, { useState, useCallback } from 'react';
import Collection from '@weaviate/add-collection';

export default function CallbackExample() {
  const [currentSchema, setCurrentSchema] = useState(null);
  const [history, setHistory] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  // Track all schema changes
  const handleSchemaChange = useCallback((schema) => {
    setCurrentSchema(schema);
    // You could validate the schema here
    console.log('Current schema:', schema);
  }, []);

  // Handle collection creation
  const handleSubmit = async (schema) => {
    setIsCreating(true);
    
    try {
      // Example: POST to Weaviate
      const response = await fetch('http://localhost:8080/v1/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.[0]?.message || 'Failed to create collection');
      }

      // Success
      alert(`Collection "${schema.class}" created successfully!`);
      
      // Add to history
      setHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        schema,
        status: 'success'
      }]);

    } catch (error) {
      console.error('Error creating collection:', error);
      alert(`Error: ${error.message}`);
      
      // Add to history with error status
      setHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        schema,
        status: 'error',
        error: error.message
      }]);
    } finally {
      setIsCreating(false);
    }
  };

  // Example: Validate schema before submission
  const validateSchema = (schema) => {
    const errors = [];
    
    if (!schema.class || schema.class.trim() === '') {
      errors.push('Collection name is required');
    }
    
    if (!schema.properties || schema.properties.length === 0) {
      errors.push('At least one property is required');
    }
    
    if (schema.properties) {
      schema.properties.forEach((prop, idx) => {
        if (!prop.name || prop.name.trim() === '') {
          errors.push(`Property ${idx + 1} is missing a name`);
        }
      });
    }
    
    return errors;
  };

  // Example: Custom submit with validation
  const handleValidatedSubmit = (schema) => {
    const errors = validateSchema(schema);
    
    if (errors.length > 0) {
      alert('Validation errors:\n' + errors.join('\n'));
      return;
    }
    
    handleSubmit(schema);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Collection Builder with Callbacks</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Current Schema Summary</h3>
        {currentSchema ? (
          <div>
            <p><strong>Name:</strong> {currentSchema.class || 'Not set'}</p>
            <p><strong>Properties:</strong> {currentSchema.properties?.length || 0}</p>
            <p><strong>Vectorizers:</strong> {Object.keys(currentSchema.vectorConfig || {}).length || 0}</p>
            <p><strong>Multi-tenancy:</strong> {currentSchema.multiTenancyConfig?.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        ) : (
          <p>No schema generated yet</p>
        )}
      </div>

      <Collection
        onChange={handleSchemaChange}
        onSubmit={handleValidatedSubmit}
      />

      {history.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>Creation History</h3>
          <ul>
            {history.map((entry, idx) => (
              <li key={idx} style={{ marginBottom: '10px' }}>
                <strong>{entry.schema.class}</strong> - 
                {new Date(entry.timestamp).toLocaleString()} - 
                <span style={{ color: entry.status === 'success' ? 'green' : 'red' }}>
                  {entry.status}
                </span>
                {entry.error && <div style={{ color: 'red' }}>{entry.error}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
