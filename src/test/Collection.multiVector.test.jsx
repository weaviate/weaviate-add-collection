/**
 * Tests for HNSW multi-vector (ColBERT) and MUVERA encoding.
 *
 * The wire shape uses nested `enabled` flags:
 *   multivector: { enabled, aggregation, muvera: { enabled, ksim, dprojections, repetitions } }
 * rather than the TypeScript client's ergonomic `encoding: { type: 'muvera' }`
 * union. Verified against a live Weaviate 1.37.3 instance.
 *
 * multivector is HNSW-only: flat has no such setting, and a dynamic index
 * starts flat before switching, so neither may carry it.
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

function indexConfigOf(container, name = 'default') {
  return readJson(container).vectorConfig[name].vectorIndexConfig
}

function hnswWith(indexConfig, indexType = 'hnsw') {
  return {
    class: 'Article',
    vectorConfig: {
      default: {
        vectorizer: { none: {} },
        vectorIndexType: indexType,
        vectorIndexConfig: indexConfig,
      },
    },
  }
}

const fullMultivector = {
  enabled: true,
  aggregation: 'maxSim',
  muvera: { enabled: true, ksim: 4, dprojections: 16, repetitions: 10 },
}

describe('Collection — multivector round-trip', () => {
  it('survives an import with MUVERA', async () => {
    const { container } = render(<Collection initialJson={hnswWith({ multivector: fullMultivector })} />)
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual(fullMultivector)
  })

  it('survives an import without MUVERA', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({ multivector: { enabled: true, aggregation: 'maxSim' } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual({ enabled: true, aggregation: 'maxSim' })
  })

  // Dropping the only key leaves nothing behind, so vectorIndexConfig itself
  // is omitted rather than emitted empty.
  it('is omitted when enabled is false', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({ multivector: { enabled: false, aggregation: 'maxSim' } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container) || {}).not.toHaveProperty('multivector')
  })

  it('drops the muvera block when muvera is disabled', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({
        multivector: { enabled: true, muvera: { enabled: false, ksim: 4 } },
      })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual({ enabled: true })
  })

  it('drops a non-integer muvera value rather than emitting null', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({
        multivector: { enabled: true, muvera: { enabled: true, ksim: 1.5, dprojections: 'abc', repetitions: 10 } },
      })} />
    )
    await waitForRender(container)

    const muvera = indexConfigOf(container).multivector.muvera
    expect(muvera).toEqual({ enabled: true, repetitions: 10 })
    expect(muvera).not.toHaveProperty('ksim')
    expect(muvera).not.toHaveProperty('dprojections')
  })
})

describe('Collection — multivector is HNSW-only', () => {
  it('is not emitted for a flat index', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({ multivector: fullMultivector }, 'flat')} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container) || {}).not.toHaveProperty('multivector')
  })

  it('is not emitted inside a dynamic index hnsw sub-config', async () => {
    const { container } = render(
      <Collection initialJson={hnswWith({
        threshold: 20000,
        hnsw: { multivector: fullMultivector, efConstruction: 256 },
        flat: {},
      }, 'dynamic')} />
    )
    await waitForRender(container)

    const indexConfig = indexConfigOf(container)
    expect(indexConfig.hnsw).not.toHaveProperty('multivector')
    expect(indexConfig.hnsw.efConstruction).toBe(256)
  })
})

describe('Collection — multivector UI', () => {
  async function openHnswIndexTab(user) {
    await user.click(screen.getByRole('button', { name: /vectorizer configuration/i }))
    await user.click(screen.getByRole('button', { name: /add vector config/i }))
    await user.click(screen.getByRole('button', { name: /^index configuration$/i }))
  }

  it('emits multivector once enabled, and removes it once disabled', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openHnswIndexTab(user)

    const toggle = screen.getByLabelText(/enable multi-vector/i)
    await user.click(toggle)
    await waitFor(() => {
      expect(indexConfigOf(container, 'default').multivector).toEqual({ enabled: true })
    })

    await user.click(screen.getByLabelText(/enable multi-vector/i))
    await waitFor(() => {
      expect(indexConfigOf(container, 'default') || {}).not.toHaveProperty('multivector')
    })
  })

  it('only offers MUVERA once multi-vector is on', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openHnswIndexTab(user)

    expect(screen.queryByLabelText(/enable muvera/i)).toBeNull()

    await user.click(screen.getByLabelText(/enable multi-vector/i))
    expect(screen.getByLabelText(/enable muvera/i)).toBeTruthy()
  })
})

describe('Collection — multivector version gating', () => {
  async function openHnswIndexTab(user) {
    await user.click(screen.getByRole('button', { name: /vectorizer configuration/i }))
    await user.click(screen.getByRole('button', { name: /add vector config/i }))
    await user.click(screen.getByRole('button', { name: /^index configuration$/i }))
  }

  function tooltipFor(text) {
    return screen.getByText(text).closest('[data-version-tooltip]')
  }

  it('multi-vector is greyed out one patch below 1.29.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.28.9" />)
    await waitForRender(container)
    await openHnswIndexTab(user)

    const wrapper = tooltipFor('Multi-Vector (ColBERT)')
    expect(wrapper).toBeTruthy()
    expect(wrapper.getAttribute('data-version-tooltip')).toContain('1.29.0')
  })

  it('multi-vector is active at 1.29.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.29.0" />)
    await waitForRender(container)
    await openHnswIndexTab(user)

    expect(tooltipFor('Multi-Vector (ColBERT)')).toBeNull()
  })

  // MUVERA landed two minors after multi-vector itself.
  it('MUVERA is greyed out at 1.30.0 while multi-vector is not', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.30.0" />)
    await waitForRender(container)
    await openHnswIndexTab(user)
    await user.click(screen.getByLabelText(/enable multi-vector/i))

    expect(tooltipFor('Multi-Vector (ColBERT)')).toBeNull()
    const muvera = tooltipFor('MUVERA Encoding')
    expect(muvera).toBeTruthy()
    expect(muvera.getAttribute('data-version-tooltip')).toContain('1.31.0')
  })

  it('MUVERA is active at 1.31.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.31.0" />)
    await waitForRender(container)
    await openHnswIndexTab(user)
    await user.click(screen.getByLabelText(/enable multi-vector/i))

    expect(tooltipFor('MUVERA Encoding')).toBeNull()
  })
})
