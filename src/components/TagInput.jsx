import React, { useId, useState } from 'react';

/**
 * Editable list of unique short strings, rendered as removable pills.
 *
 * Used for stopword additions/removals, user-defined stopword preset word
 * lists, and the textAnalyzer asciiFoldIgnore character list. Duplicates are
 * silently ignored rather than rejected, and Enter commits without submitting
 * the surrounding form.
 *
 * Several of these render on one page, so the label is tied to its input by a
 * useId-generated id rather than a hardcoded one, and the per-tag remove
 * buttons name both the tag and the list -- "×" alone is meaningless to a
 * screen reader, and "Remove en" is ambiguous when two lists are visible.
 */
export default function TagInput({ tags, setTags, label, placeholder = 'Add tag' }) {
  const [input, setInput] = useState('');
  const inputId = useId();

  const addTag = () => {
    const value = input.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
      setInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="tag-input-section">
      <label htmlFor={inputId}>{label}</label>
      <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
        {tags.map(tag => (
          <span key={tag} className="tag" style={{
            background: '#e0e7ef',
            borderRadius: '16px',
            padding: '4px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.95em',
            color: '#2a3a4d',
            border: '1px solid #b6c2d6',
          }}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}${label ? ` from ${label}` : ''}`}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: '#6b7a90',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1em',
                lineHeight: '1',
              }}
            >&times;</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          id={inputId}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1, padding: '4px 8px', borderRadius: '8px', border: '1px solid #b6c2d6' }}
        />
        <button type="button" onClick={addTag} style={{
          padding: '4px 12px',
          borderRadius: '8px',
          border: '1px solid #b6c2d6',
          background: '#f5f8fa',
          color: '#2a3a4d',
          cursor: 'pointer',
        }} aria-label={label ? `Add to ${label}` : 'Add'}>Add</button>
      </div>
    </div>
  );
}
