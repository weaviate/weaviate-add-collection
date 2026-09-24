import React from 'react'
import PropertyItem from './PropertyItem'

const emptyProperty = () => ({
  name: '',
    dataType: 'text',
  description: '',
  indexFilterable: true,
  indexRangeFilters: false,
    indexSearchable: true,
    isArray: false,
  tokenization: 'word'
})

export default function PropertySection({ properties = [], onChange, stopwordPresetNames = [] }) {
  // Start with one empty property by default if no properties provided
  const propsList = properties.length > 0 ? properties : [emptyProperty()]

  function updateAt(i, next) {
    const nextList = propsList.map((p, idx) => (idx === i ? next : p))
    onChange && onChange(nextList)
  }

  function deleteAt(i) {
    const nextList = propsList.filter((_, idx) => idx !== i)
    // If deleting the last property, ensure we keep at least one empty property
    if (nextList.length === 0) {
      const newList = [emptyProperty()]
      onChange && onChange(newList)
      return
    }
    onChange && onChange(nextList)
  }

  function addNew() {
    const nextList = [...propsList, emptyProperty()]
    onChange && onChange(nextList)
  }

  return (
    <div className="card property-section">
      <div className="section-body">
        {propsList.map((p, i) => (
          <PropertyItem key={i} index={i} value={p} onChange={(v) => updateAt(i, v)} onDelete={() => deleteAt(i)} stopwordPresetNames={stopwordPresetNames} />
        ))}
      </div>
      <div className="section-footer">
        <div></div> {/* Empty div for flexbox spacing */}
        <div>
          <button type="button" className="btn btn-primary" onClick={addNew}>Add property</button>
        </div>
      </div>
    </div>
  )
}
