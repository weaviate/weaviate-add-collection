/**
 * Unit tests for moduleConfigExtractor.js — verifies that field definitions
 * for vectorizer, generative, and reranker modules expose the fields the
 * Weaviate REST API supports (per typescript-client v3.11.0 and v3.12.0).
 */
import { describe, it, expect } from 'vitest'
import {
  getModuleConfigFields,
  getGenerativeConfigFields,
  hasGenerativeConfigOptions,
  getRerankerConfigFields,
  hasRerankerConfigOptions,
  getAllModuleConfigs,
} from '../utils/moduleConfigExtractor'
import { getVectorizerModuleOptions } from '../constants/options'

// ─── Dropdown/field-table parity ──────────────────────────────────────────────

/**
 * Module support lives in two hand-maintained files that have to agree:
 * VECTORIZER_CONFIG_FIELDS in moduleConfigExtractor.js says what a module can
 * be configured with, and allAvailableModules in constants/options.js decides
 * whether it can be picked at all. They had drifted badly enough that 17
 * modules with complete field definitions were unreachable from the UI, which
 * is invisible from either file alone.
 */
describe('vectorizer dropdown ↔ field-table parity', () => {
  // qna-openai is a question-answering module, not a vectorizer. It predates
  // this test and is surfaced by getVectorizerModuleOptions only because the
  // filter there excludes backup-/generative-/reranker- prefixes and nothing
  // else. Tracked separately; excluded here so the parity check stays honest
  // about everything else.
  const KNOWN_NON_VECTORIZERS = new Set(['qna-openai'])

  it('every module with field definitions is selectable in the dropdown', () => {
    const selectable = new Set(getVectorizerModuleOptions().map(o => o.value))
    const unreachable = Object.keys(getAllModuleConfigs()).filter(m => !selectable.has(m))

    expect(unreachable).toEqual([])
  })

  it('every selectable vectorizer has field definitions', () => {
    const defined = new Set(Object.keys(getAllModuleConfigs()))
    const undefinedFields = getVectorizerModuleOptions()
      .map(o => o.value)
      .filter(m => !defined.has(m) && !KNOWN_NON_VECTORIZERS.has(m))

    expect(undefinedFields).toEqual([])
  })
})

// ─── Modules present in the client union but missing from both repo files ─────

describe('multi2multivec-weaviate (Multi2MultivecWeaviateConfig)', () => {
  it('exposes baseURL, model and imageFields', () => {
    const byName = Object.fromEntries(
      getModuleConfigFields('multi2multivec-weaviate').map(f => [f.name, f])
    )

    expect(byName.baseURL?.type).toBe('string')
    expect(byName.model?.type).toBe('string')
    expect(byName.imageFields?.type).toBe('string[]')
  })

  it('does not declare textFields — this module vectorizes images only', () => {
    const names = getModuleConfigFields('multi2multivec-weaviate').map(f => f.name)
    expect(names).not.toContain('textFields')
  })
})

describe('text2vec-google-gemini (Text2VecGoogleGeminiConfig)', () => {
  it('exposes model and titleProperty', () => {
    const byName = Object.fromEntries(
      getModuleConfigFields('text2vec-google-gemini').map(f => [f.name, f])
    )

    expect(byName.model?.type).toBe('string')
    expect(byName.titleProperty?.type).toBe('string')
  })

  it('matches the deprecated text2vec-google-ai-studio it replaces', () => {
    const gemini = getModuleConfigFields('text2vec-google-gemini').map(f => f.name).sort()
    const aiStudio = getModuleConfigFields('text2vec-google-ai-studio').map(f => f.name).sort()

    expect(gemini).toEqual(aiStudio)
  })
})

describe('multi2vec-google-gemini (Multi2VecGoogleGeminiConfig)', () => {
  // The client types this as Omit<Multi2VecGoogleConfig, 'location' | 'projectId' | 'apiEndpoint'>.
  it('drops the GCP-only fields from multi2vec-google', () => {
    const names = getModuleConfigFields('multi2vec-google-gemini').map(f => f.name)

    expect(names).not.toContain('location')
    expect(names).not.toContain('projectId')
    expect(names).not.toContain('apiEndpoint')
  })

  it('keeps every other multi2vec-google field', () => {
    const gemini = new Set(getModuleConfigFields('multi2vec-google-gemini').map(f => f.name))
    const inherited = getModuleConfigFields('multi2vec-google')
      .map(f => f.name)
      .filter(n => !['location', 'projectId', 'apiEndpoint'].includes(n))

    expect(inherited.filter(n => !gemini.has(n))).toEqual([])
  })
})

// ─── v3.12.0 PR #398: baseURL on reranker-cohere ──────────────────────────────

describe('reranker-cohere — baseURL (TS client v3.12.0 PR #398)', () => {
  it('exposes a baseURL field', () => {
    const fields = getRerankerConfigFields('reranker-cohere')
    const baseURL = fields.find(f => f.name === 'baseURL')
    expect(baseURL).toBeDefined()
    expect(baseURL.type).toBe('string')
  })

  it('still exposes the existing model field', () => {
    const fields = getRerankerConfigFields('reranker-cohere')
    expect(fields.find(f => f.name === 'model')).toBeDefined()
  })
})

// ─── v3.11.0 PR #379: voyage-multimodal-3.5 (video) ───────────────────────────

describe('multi2vec-voyageai — video + dimensions (TS client v3.11.0 PR #379)', () => {
  it('exposes a videoFields field as string[]', () => {
    const fields = getModuleConfigFields('multi2vec-voyageai')
    const videoFields = fields.find(f => f.name === 'videoFields')
    expect(videoFields).toBeDefined()
    expect(videoFields.type).toBe('string[]')
  })

  it('exposes a dimensions field as number', () => {
    const fields = getModuleConfigFields('multi2vec-voyageai')
    const dimensions = fields.find(f => f.name === 'dimensions')
    expect(dimensions).toBeDefined()
    expect(dimensions.type).toBe('number')
  })

  it('preserves pre-existing fields (model, textFields, imageFields)', () => {
    const fields = getModuleConfigFields('multi2vec-voyageai')
    const names = fields.map(f => f.name)
    expect(names).toContain('model')
    expect(names).toContain('textFields')
    expect(names).toContain('imageFields')
    expect(names).toContain('weights')
  })
})

// ─── v3.11.0 PR #355: Contextual AI generative + reranker ────────────────────

describe('generative-contextualai (TS client v3.11.0 PR #355)', () => {
  it('reports having configuration options', () => {
    expect(hasGenerativeConfigOptions('generative-contextualai')).toBe(true)
  })

  it('exposes all six documented fields with correct types', () => {
    const fields = getGenerativeConfigFields('generative-contextualai')
    const byName = Object.fromEntries(fields.map(f => [f.name, f]))

    expect(byName.model?.type).toBe('string')
    expect(byName.temperature?.type).toBe('number')
    expect(byName.topP?.type).toBe('number')
    expect(byName.maxNewTokens?.type).toBe('number')
    expect(byName.systemPrompt?.type).toBe('string')
    expect(byName.avoidCommentary?.type).toBe('boolean')
  })
})

describe('reranker-contextualai (TS client v3.11.0 PR #355)', () => {
  it('reports having configuration options', () => {
    expect(hasRerankerConfigOptions('reranker-contextualai')).toBe(true)
  })

  it('exposes model, instruction, and topN fields with correct types', () => {
    const fields = getRerankerConfigFields('reranker-contextualai')
    const byName = Object.fromEntries(fields.map(f => [f.name, f]))

    expect(byName.model?.type).toBe('string')
    expect(byName.instruction?.type).toBe('string')
    expect(byName.topN?.type).toBe('number')
  })
})
