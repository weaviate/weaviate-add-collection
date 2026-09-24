/**
 * Live round-trip of the v1.37 tokenization config against a real Weaviate.
 *
 * The component-level tests prove the generated JSON has the shape we intend.
 * This proves Weaviate actually accepts that shape and gives it back
 * unchanged, which is the part a unit test cannot establish -- the wire format
 * for textAnalyzer is flat (asciiFold + asciiFoldIgnore + stopwordPreset)
 * while the TypeScript client exposes an ergonomic union, so the two are easy
 * to conflate.
 *
 * Sends raw REST rather than going through the typed client helper, which
 * drops fields it does not model. Requires Weaviate >= 1.37.2 on localhost:8080
 * (CI runs 1.37.3); see TESTING.md.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import Collection from '../components/Collection'
import { postRawSchema, getRawSchema, deleteRawSchema } from './weaviateHelper'

const COLLECTION = 'TokenizationLiveRoundTrip'

async function waitForRender(container) {
  await waitFor(() => {
    expect(container.querySelector('.json-block')).toBeTruthy()
  }, { timeout: 3000 })
}

function readJson(container) {
  return JSON.parse(container.querySelector('.json-block').textContent)
}

describe('Live — v1.37 tokenization round-trip', () => {
  beforeAll(async () => {
    await deleteRawSchema(COLLECTION)
  })

  afterAll(async () => {
    await deleteRawSchema(COLLECTION)
  })

  it('Weaviate accepts the generated schema verbatim and returns it unchanged', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: COLLECTION,
        invertedIndexConfig: { stopwordPresets: { fr: ['le', 'la', 'les'] } },
        properties: [{
          name: 'title',
          dataType: ['text'],
          tokenization: 'word',
          textAnalyzer: { asciiFold: true, asciiFoldIgnore: ['é'], stopwordPreset: 'fr' },
        }],
      }} />
    )
    await waitForRender(container)

    const generated = readJson(container)

    // Not "a schema like this one" -- the exact bytes the component produced.
    await postRawSchema(generated)
    const stored = await getRawSchema(COLLECTION)

    expect(stored.invertedIndexConfig.stopwordPresets).toEqual({ fr: ['le', 'la', 'les'] })
    expect(stored.properties.find(p => p.name === 'title').textAnalyzer).toEqual({
      asciiFold: true,
      asciiFoldIgnore: ['é'],
      stopwordPreset: 'fr',
    })
  })
})
