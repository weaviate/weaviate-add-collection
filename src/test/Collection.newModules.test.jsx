/**
 * Integration tests for newly added modules and module-level version gating:
 *   - generative-contextualai (gated to Weaviate 1.34.0+)
 *   - reranker-contextualai   (gated to Weaviate 1.34.0+)
 *   - reranker-cohere baseURL field round-trip
 *   - multi2vec-voyageai videoFields / dimensions round-trip
 *
 * Asserts both version-gating behaviour in the dropdowns and JSON round-trip
 * of the new fields through Collection's import/export pipeline.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Collection from '../components/Collection'

async function waitForRender(container) {
  await waitFor(() => {
    expect(container.querySelector('.json-block')).toBeTruthy()
  }, { timeout: 3000 })
}

function readJson(container) {
  return JSON.parse(container.querySelector('.json-block').textContent)
}

// The Vectorizer Configuration section is collapsed on first render and starts
// with no vector configs, so the module dropdown only exists after adding one.
async function openVectorConfig(user) {
  await user.click(screen.getByRole('button', { name: /vectorizer configuration/i }))
  await user.click(screen.getByRole('button', { name: /add vector config/i }))
}

// "Vectorizer Module" is also the name of the tab button, so match the <label>.
function vectorizerSelect(container) {
  const label = Array.from(container.querySelectorAll('label'))
    .find(l => l.textContent.trim() === 'Vectorizer Module')
  return label.parentElement.querySelector('select')
}

function optionFor(select, value) {
  return Array.from(select.options).find(o => o.value === value)
}

// ─── text2vec-digitalocean (TS client v3.13.1, Weaviate 1.38.0) ──────────────

describe('text2vec-digitalocean', () => {
  it('is offered in the vectorizer dropdown', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openVectorConfig(user)

    expect(optionFor(vectorizerSelect(container), 'text2vec-digitalocean')).toBeTruthy()
  })

  it('is enabled when no version is set', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openVectorConfig(user)

    expect(optionFor(vectorizerSelect(container), 'text2vec-digitalocean').disabled).toBe(false)
  })

  it('is enabled for Weaviate >= 1.38.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.38.0" />)
    await waitForRender(container)
    await openVectorConfig(user)

    expect(optionFor(vectorizerSelect(container), 'text2vec-digitalocean').disabled).toBe(false)
  })

  // The module did not ship until 1.38.0 -- a 1.37.x server has no such module,
  // so offering it there would produce a schema the server rejects.
  it('is disabled with help text one patch below the minimum', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.37.9" />)
    await waitForRender(container)
    await openVectorConfig(user)

    const opt = optionFor(vectorizerSelect(container), 'text2vec-digitalocean')
    expect(opt.disabled).toBe(true)
    expect(opt.textContent).toContain('1.38.0')
  })

  it('round-trips model and baseURL through import', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        vectorConfig: {
          default: {
            vectorizer: {
              'text2vec-digitalocean': {
                model: 'qwen3-embedding-0.6b',
                baseURL: 'https://inference.do-ai.run',
              },
            },
            vectorIndexType: 'hnsw',
          },
        },
      }} />
    )
    await waitForRender(container)

    const config = readJson(container).vectorConfig.default.vectorizer['text2vec-digitalocean']
    expect(config.model).toBe('qwen3-embedding-0.6b')
    expect(config.baseURL).toBe('https://inference.do-ai.run')
  })

  it('marks model as required in the config form', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openVectorConfig(user)

    await user.selectOptions(vectorizerSelect(container), 'text2vec-digitalocean')

    await waitFor(() => {
      const labels = Array.from(container.querySelectorAll('label')).map(l => l.textContent.trim())
      // The asterisk is how ModuleConfigField marks a required field.
      expect(labels).toContain('model *')
      expect(labels).toContain('baseURL')
    })
  })
})

// ─── Generative dropdown — Contextual AI gating ──────────────────────────────

describe('Generative module dropdown — Contextual AI version gating', () => {
  async function openGenerativeAndEnable(user) {
    const sectionToggle = screen.getByRole('button', { name: /generative configuration/i })
    await user.click(sectionToggle)
    await waitFor(() => screen.getByLabelText(/enable generative search/i))
    await user.click(screen.getByLabelText(/enable generative search/i))
    await waitFor(() => screen.getByLabelText('Generative Module'))
  }

  it('"generative-contextualai" is enabled when no version is set', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openGenerativeAndEnable(user)

    const select = screen.getByLabelText('Generative Module')
    const opt = Array.from(select.options).find(o => o.value === 'generative-contextualai')
    expect(opt).toBeTruthy()
    expect(opt.disabled).toBe(false)
  })

  it('"generative-contextualai" is enabled for Weaviate >= 1.34.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.34.0" />)
    await waitForRender(container)
    await openGenerativeAndEnable(user)

    const select = screen.getByLabelText('Generative Module')
    const opt = Array.from(select.options).find(o => o.value === 'generative-contextualai')
    expect(opt.disabled).toBe(false)
  })

  it('"generative-contextualai" is disabled with help text for Weaviate < 1.34.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.33.9" />)
    await waitForRender(container)
    await openGenerativeAndEnable(user)

    const select = screen.getByLabelText('Generative Module')
    const opt = Array.from(select.options).find(o => o.value === 'generative-contextualai')
    expect(opt.disabled).toBe(true)
    expect(opt.textContent).toContain('1.34.0')
    expect(opt.textContent).toContain('Requires Weaviate')
  })

  it('other generative modules remain enabled when Contextual AI is gated out', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.30.0" />)
    await waitForRender(container)
    await openGenerativeAndEnable(user)

    const select = screen.getByLabelText('Generative Module')
    const openai = Array.from(select.options).find(o => o.value === 'generative-openai')
    expect(openai.disabled).toBe(false)
  })
})

// ─── Reranker dropdown — Contextual AI gating ────────────────────────────────

describe('Reranker module dropdown — Contextual AI version gating', () => {
  async function openReranker(user) {
    const sectionToggle = screen.getByRole('button', { name: /reranker configuration/i })
    await user.click(sectionToggle)
    await waitFor(() => screen.getByLabelText('Reranker Module'))
  }

  it('"reranker-contextualai" is enabled when no version is set', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openReranker(user)

    const select = screen.getByLabelText('Reranker Module')
    const opt = Array.from(select.options).find(o => o.value === 'reranker-contextualai')
    expect(opt).toBeTruthy()
    expect(opt.disabled).toBe(false)
  })

  it('"reranker-contextualai" is enabled for Weaviate >= 1.34.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.34.0" />)
    await waitForRender(container)
    await openReranker(user)

    const select = screen.getByLabelText('Reranker Module')
    const opt = Array.from(select.options).find(o => o.value === 'reranker-contextualai')
    expect(opt.disabled).toBe(false)
  })

  it('"reranker-contextualai" is disabled with help text for Weaviate < 1.34.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.33.9" />)
    await waitForRender(container)
    await openReranker(user)

    const select = screen.getByLabelText('Reranker Module')
    const opt = Array.from(select.options).find(o => o.value === 'reranker-contextualai')
    expect(opt.disabled).toBe(true)
    expect(opt.textContent).toContain('1.34.0')
    expect(opt.textContent).toContain('Requires Weaviate')
  })
})

// ─── JSON round-trip: generative-contextualai ────────────────────────────────

describe('generative-contextualai — JSON import round-trip', () => {
  it('preserves all Contextual AI generative fields through import', async () => {
    const initial = {
      class: 'CtxlGenTest',
      description: 'Contextual AI generative round-trip',
      moduleConfig: {
        'generative-contextualai': {
          model: 'v2',
          temperature: 0.7,
          topP: 0.9,
          maxNewTokens: 100,
          systemPrompt: 'You are a helpful assistant.',
          avoidCommentary: true,
        }
      },
      properties: [
        { name: 'text', dataType: ['text'], indexFilterable: true, indexSearchable: true }
      ],
    }

    const { container } = render(<Collection initialJson={initial} />)
    await waitForRender(container)

    const json = readJson(container)
    expect(json.moduleConfig?.['generative-contextualai']).toEqual({
      model: 'v2',
      temperature: 0.7,
      topP: 0.9,
      maxNewTokens: 100,
      systemPrompt: 'You are a helpful assistant.',
      avoidCommentary: true,
    })
  })
})

// ─── JSON round-trip: reranker-contextualai ──────────────────────────────────

describe('reranker-contextualai — JSON import round-trip', () => {
  it('preserves model, instruction, and topN through import', async () => {
    const initial = {
      class: 'CtxlRerankTest',
      moduleConfig: {
        'reranker-contextualai': {
          model: 'ctxl-rerank-v2-instruct-multilingual',
          instruction: 'Rerank by relevance to legal queries.',
          topN: 10,
        }
      },
      properties: [
        { name: 'text', dataType: ['text'], indexFilterable: true, indexSearchable: true }
      ],
    }

    const { container } = render(<Collection initialJson={initial} />)
    await waitForRender(container)

    const json = readJson(container)
    expect(json.moduleConfig?.['reranker-contextualai']).toEqual({
      model: 'ctxl-rerank-v2-instruct-multilingual',
      instruction: 'Rerank by relevance to legal queries.',
      topN: 10,
    })
  })
})

// ─── JSON round-trip: multi2vec-voyageai videoFields + dimensions ────────────

describe('multi2vec-voyageai — videoFields + dimensions round-trip (PR #379)', () => {
  it('preserves videoFields, dimensions, and model through import', async () => {
    const initial = {
      class: 'VoyageMmTest',
      vectorConfig: {
        default: {
          vectorizer: {
            'multi2vec-voyageai': {
              model: 'voyage-multimodal-3.5',
              dimensions: 1024,
              imageFields: ['image'],
              textFields: ['text'],
              videoFields: ['video'],
            }
          },
          vectorIndexType: 'hnsw'
        }
      },
      properties: [
        { name: 'text',  dataType: ['text'],  indexFilterable: true, indexSearchable: true },
        { name: 'image', dataType: ['blob'],  indexFilterable: false },
        { name: 'video', dataType: ['blob'],  indexFilterable: false },
      ],
    }

    const { container } = render(<Collection initialJson={initial} />)
    await waitForRender(container)

    const json = readJson(container)
    const vec = json.vectorConfig?.default?.vectorizer?.['multi2vec-voyageai']
    expect(vec).toBeDefined()
    expect(vec.model).toBe('voyage-multimodal-3.5')
    expect(vec.dimensions).toBe(1024)
    expect(vec.imageFields).toEqual(['image'])
    expect(vec.textFields).toEqual(['text'])
    expect(vec.videoFields).toEqual(['video'])
  })
})

// ─── JSON round-trip: reranker-cohere baseURL ────────────────────────────────

describe('reranker-cohere — baseURL field round-trip (PR #398)', () => {
  it('preserves baseURL alongside model through import', async () => {
    const initial = {
      class: 'CohereRerankTest',
      moduleConfig: {
        'reranker-cohere': {
          baseURL: 'https://my-proxy.example.com/cohere',
          model: 'rerank-multilingual-v2.0',
        }
      },
      properties: [
        { name: 'text', dataType: ['text'], indexFilterable: true, indexSearchable: true }
      ],
    }

    const { container } = render(<Collection initialJson={initial} />)
    await waitForRender(container)

    const json = readJson(container)
    expect(json.moduleConfig?.['reranker-cohere']).toEqual({
      baseURL: 'https://my-proxy.example.com/cohere',
      model: 'rerank-multilingual-v2.0',
    })
  })
})
