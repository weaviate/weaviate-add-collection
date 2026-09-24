import React from 'react';
import TagInput from './TagInput';
import DOC_LINKS from '../constants/docLinks.json';
import { VersionGated } from '../context/VersionContext';
import { DEFAULT_INVERTED_INDEX_CONFIG } from '../constants/invertedIndexDefaults';

const InvertedIndexConfigSection = ({ config = DEFAULT_INVERTED_INDEX_CONFIG, setConfig }) => {
  const update = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const presets = config.stopwords_presets || [];

  const updatePreset = (index, changes) => {
    update('stopwords_presets', presets.map((preset, i) => (
      i === index ? { ...preset, ...changes } : preset
    )));
  };

  const addPreset = () => update('stopwords_presets', [...presets, { name: '', words: [] }]);

  const removePreset = (index) => update('stopwords_presets', presets.filter((_, i) => i !== index));

  return (
    <div>
      <div className="field">
        <label>BM25 b:</label>
        <input type="number" step="0.01" value={config.bm25_b} onChange={e => update('bm25_b', parseFloat(e.target.value))} />
      </div>
      <div className="field">
        <label>BM25 k1:</label>
        <input type="number" step="0.01" value={config.bm25_k1} onChange={e => update('bm25_k1', parseFloat(e.target.value))} />
      </div>
      <div className="field">
        <label>Cleanup Interval (s):</label>
        <input type="number" value={config.cleanup_interval_seconds} onChange={e => update('cleanup_interval_seconds', parseInt(e.target.value))} />
      </div>
      <div className="field">
        <label>Index Timestamps:</label>
        <input type="checkbox" checked={config.index_timestamps} onChange={e => update('index_timestamps', e.target.checked)} />
      </div>
      <div className="field">
        <label>Index Property Length:</label>
        <input type="checkbox" checked={config.index_property_length} onChange={e => update('index_property_length', e.target.checked)} />
      </div>
      <div className="field">
        <label>Index Null State:</label>
        <input type="checkbox" checked={config.index_null_state} onChange={e => update('index_null_state', e.target.checked)} />
      </div>
      <VersionGated featureId="usingBlockMaxWand">
        <div className="field">
          <label>Using BlockMax WAND:</label>
          <select
            value={config.using_block_max_wand === null || config.using_block_max_wand === undefined
              ? ''
              : String(config.using_block_max_wand)}
            onChange={e => update(
              'using_block_max_wand',
              e.target.value === '' ? null : e.target.value === 'true'
            )}
          >
            <option value="">Server default</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
          <small className="hint">
            BlockMax WAND speeds up BM25 and hybrid queries. Leave on “Server default” unless you
            need to pin it: Weaviate enables it automatically for collections created on 1.30 and
            later, so the effective default depends on the server version.
          </small>
        </div>
      </VersionGated>
      <div className="field">
        <label>Stopwords Preset:</label>
        <select value={config.stopwords_preset} onChange={e => update('stopwords_preset', e.target.value)}>
          <option value="en">en</option>
          <option value="none">none</option>
        </select>
      </div>
      <div className="field">
        <TagInput tags={config.stopwords_additions} setTags={tags => update('stopwords_additions', tags)} label="Stopwords Additions" />
      </div>
      <div className="field">
        <TagInput tags={config.stopwords_removals} setTags={tags => update('stopwords_removals', tags)} label="Stopwords Removals" />
      </div>

      <VersionGated featureId="stopwordPresets">
        <div className="nested-section">
          <div className="nested-section-title">
            Stopword Presets
            {DOC_LINKS.stopwordPresets && (
              <a href={DOC_LINKS.stopwordPresets} target="_blank" rel="noopener noreferrer" title="View documentation" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </a>
            )}
          </div>
          <small className="hint" style={{ display: 'block', marginBottom: '12px' }}>
            Named stopword lists that individual text properties can select via their Text
            Analyzer. A preset named after a built-in (<code>en</code>, <code>none</code>)
            replaces it. Presets without a name or without any words are not included in the
            generated schema.
          </small>

          {presets.map((preset, index) => (
            <div key={index} className="nested-section" style={{ marginBottom: '8px' }}>
              <div className="field">
                <label>Preset Name</label>
                <input
                  type="text"
                  value={preset.name || ''}
                  onChange={e => updatePreset(index, { name: e.target.value })}
                  placeholder="e.g. fr"
                />
              </div>
              <div className="field">
                <TagInput
                  tags={preset.words || []}
                  setTags={words => updatePreset(index, { words })}
                  label="Stopwords"
                  placeholder="Add stopword"
                />
              </div>
              <button type="button" onClick={() => removePreset(index)}>Delete Preset</button>
            </div>
          ))}

          <button type="button" onClick={addPreset}>Add Preset</button>
        </div>
      </VersionGated>
    </div>
  );
};

export default InvertedIndexConfigSection;
