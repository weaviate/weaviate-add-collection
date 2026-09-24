/**
 * Defaults for the per-property textAnalyzer config (Weaviate >= 1.37.2).
 *
 * stopwordPreset is '' rather than null so the <select> stays controlled and
 * "" can mean "inherit the collection-level invertedIndexConfig.stopwords",
 * which is distinct from explicitly choosing the built-in 'none' preset.
 *
 * Two server-side constraints worth knowing when editing this:
 *   - asciiFold is immutable after the property is created.
 *   - asciiFoldIgnore can be changed later, but only affects data indexed
 *     after the change; it does not retroactively re-index.
 *
 * The wire format is flat (asciiFold + asciiFoldIgnore + stopwordPreset). The
 * TypeScript client exposes an ergonomic `asciiFold: boolean | { ignore }`
 * union instead, but this project emits raw REST schema JSON, so the flat
 * shape is what belongs here.
 */
export const DEFAULT_TEXT_ANALYZER = {
  asciiFold: false,
  asciiFoldIgnore: [],
  stopwordPreset: '',
}

/**
 * Fresh copy for use as component state -- asciiFoldIgnore is an array and
 * would otherwise be aliased across every property.
 */
export const createDefaultTextAnalyzer = () => ({
  ...DEFAULT_TEXT_ANALYZER,
  asciiFoldIgnore: [],
})

/** Built-in presets the server always understands, offered alongside any user-defined ones. */
export const BUILTIN_STOPWORD_PRESETS = ['en', 'none']
