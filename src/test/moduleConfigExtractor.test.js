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
} from '../utils/moduleConfigExtractor'

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
