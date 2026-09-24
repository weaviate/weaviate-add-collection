/**
 * Shared defaults for the inverted index config.
 *
 * These are the *server's* defaults, not merely initial form values: the
 * serialization effect in Collection.jsx diffs against this object and only
 * emits the keys that differ, so that a collection the user never touched
 * produces no `invertedIndexConfig` key at all. Changing a value here changes
 * what gets omitted from the generated schema.
 *
 * Note the UI uses snake_case keys and the wire format uses camelCase; the
 * mapping lives in the Collection.jsx effect, not here.
 */
export const DEFAULT_INVERTED_INDEX_CONFIG = {
  bm25_b: 0.75,
  bm25_k1: 1.2,
  cleanup_interval_seconds: 60,
  index_timestamps: false,
  index_property_length: false,
  index_null_state: false,
  // Tri-state: null means "leave it to the server". A plain boolean cannot
  // express that, and the server default is version-dependent -- false before
  // 1.30, true for collections created after -- so there is no single correct
  // value to default to. Only an explicit true/false is emitted.
  using_block_max_wand: null,
  stopwords_preset: 'en',
  stopwords_additions: [],
  stopwords_removals: [],
  // User-defined stopword presets (Weaviate >= 1.37.2), held as an ordered list
  // of { name, words } rows rather than the wire format's { [name]: words }
  // object. An object cannot represent a half-typed row -- there is no valid
  // empty key, and renaming a preset would lose its position and its words.
  // Serialization converts to the object shape and drops invalid rows.
  stopwords_presets: [],
}

/**
 * Fresh copy for use as component state.
 *
 * DEFAULT_INVERTED_INDEX_CONFIG holds arrays, so a plain spread would alias
 * them across every consumer. Use this anywhere the result is stored in state;
 * use the constant directly only for read-only diffing.
 */
export const createDefaultInvertedIndexConfig = () => ({
  ...DEFAULT_INVERTED_INDEX_CONFIG,
  stopwords_additions: [],
  stopwords_removals: [],
  stopwords_presets: [],
})

/**
 * Convert the UI's ordered `{ name, words }` rows into the wire format's
 * `{ [name]: words }` object.
 *
 * The server rejects empty or whitespace-only preset names, empty word lists,
 * and empty words, so half-finished rows are dropped here rather than emitted
 * as invalid schema. A later row with the same name wins, matching object
 * semantics.
 *
 * Both the serialization effect and the per-property preset picker go through
 * this, so the picker can never offer a preset that will not be emitted.
 */
export const buildStopwordPresets = (rows) => {
  const presets = {}
  ;(Array.isArray(rows) ? rows : []).forEach(({ name, words } = {}) => {
    const presetName = (name || '').trim()
    const presetWords = (Array.isArray(words) ? words : [])
      .map(word => (word || '').trim())
      .filter(Boolean)
    if (presetName && presetWords.length > 0) presets[presetName] = presetWords
  })
  return presets
}
