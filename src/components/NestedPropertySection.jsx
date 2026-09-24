import React from 'react'
import PropertyItem from './PropertyItem'

const emptyNestedProperty = () => ({
  name: '',
  dataType: 'text',
  description: '',
  indexFilterable: true,
  indexRangeFilters: false,
  indexSearchable: true,
  isArray: false,
  tokenization: 'word'
})

export default function NestedPropertySection({ nestedProperties = [], onChange, depth = 1, stopwordPresetNames = [] }) {
  const propsList = nestedProperties.length > 0 ? nestedProperties : []

  function updateAt(i, next) {
    const nextList = propsList.map((p, idx) => (idx === i ? next : p))
    onChange && onChange(nextList)
  }

  function deleteAt(i) {
    const nextList = propsList.filter((_, idx) => idx !== i)
    onChange && onChange(nextList)
  }

  function addNew() {
    const nextList = [...propsList, emptyNestedProperty()]
    onChange && onChange(nextList)
  }

  const indentStyle = {
    marginLeft: `${depth * 20}px`,
    borderLeft: '2px solid #e5e7eb',
    paddingLeft: '16px'
  }

  return (
    <div className="nested-property-section" style={indentStyle}>
      <h5 style={{ margin: '12px 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
        Nested Properties
      </h5>
      <small className="hint" style={{ display: 'block', marginBottom: '12px' }}>
        Define the properties within this object. Nested properties can also be objects themselves.
      </small>
      
      <div className="section-body">
        {propsList.map((p, i) => (
          <PropertyItem 
            key={i} 
            index={i} 
            value={p} 
            onChange={(v) => updateAt(i, v)} 
            onDelete={() => deleteAt(i)}
            isNested={true}
            depth={depth}
            stopwordPresetNames={stopwordPresetNames}
          />
        ))}
      </div>
      
      <div className="section-footer" style={{ marginTop: '8px' }}>
        <button type="button" className="btn btn-primary" onClick={addNew}>
          Add nested property
        </button>
      </div>
    </div>
  )
}
