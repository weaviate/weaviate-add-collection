/**
 * Tests for invertedIndexConfig fields beyond the original BM25/stopwords set.
 *
 * Currently covers usingBlockMaxWAND (Weaviate >= 1.30.0), which is tri-state:
 * the server's own default flips from false to true for collections created on
 * 1.30 and later, so "unset" has to stay distinguishable from an explicit
 * false.
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

async function openInvertedIndex(user) {
  await user.click(screen.getByRole('button', { name: /inverted index configuration/i }))
}

function blockMaxSelect() {
  return screen.getByText('Using BlockMax WAND:').parentElement.querySelector('select')
}

describe('Collection — usingBlockMaxWAND', () => {
  it('is not emitted by default', async () => {
    const { container } = render(<Collection />)
    await waitForRender(container)

    expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
  })

  it('round-trips true', async () => {
    const { container } = render(
      <Collection initialJson={{ class: 'Article', invertedIndexConfig: { usingBlockMaxWAND: true } }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig.usingBlockMaxWAND).toBe(true)
  })

  // false is a deliberate opt-out on 1.30+, not a default, so it must survive.
  it('round-trips false', async () => {
    const { container } = render(
      <Collection initialJson={{ class: 'Article', invertedIndexConfig: { usingBlockMaxWAND: false } }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig.usingBlockMaxWAND).toBe(false)
  })

  it('stays unset when the imported config omits it', async () => {
    const { container } = render(
      <Collection initialJson={{ class: 'Article', invertedIndexConfig: { indexTimestamps: true } }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig).not.toHaveProperty('usingBlockMaxWAND')
  })

  it('can be set and cleared through the UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openInvertedIndex(user)

    await user.selectOptions(blockMaxSelect(), 'false')
    await waitFor(() => {
      expect(readJson(container).invertedIndexConfig.usingBlockMaxWAND).toBe(false)
    })

    await user.selectOptions(blockMaxSelect(), 'true')
    await waitFor(() => {
      expect(readJson(container).invertedIndexConfig.usingBlockMaxWAND).toBe(true)
    })

    await user.selectOptions(blockMaxSelect(), '')
    await waitFor(() => {
      expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
    })
  })

  it('shows "Server default" for an imported config that omits it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={{ class: 'Article' }} />)
    await waitForRender(container)
    await openInvertedIndex(user)

    expect(blockMaxSelect().value).toBe('')
  })
})

describe('Collection — usingBlockMaxWAND version gating', () => {
  function tooltipWrapper() {
    return screen.getByText('Using BlockMax WAND:').closest('[data-version-tooltip]')
  }

  it('is greyed out one patch below 1.30.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.29.9" />)
    await waitForRender(container)
    await openInvertedIndex(user)

    const wrapper = tooltipWrapper()
    expect(wrapper).toBeTruthy()
    expect(wrapper.getAttribute('data-version-tooltip')).toContain('1.30.0')
  })

  it('is active at exactly 1.30.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.30.0" />)
    await waitForRender(container)
    await openInvertedIndex(user)

    expect(tooltipWrapper()).toBeNull()
  })

  it('is active when no version is set', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openInvertedIndex(user)

    expect(tooltipWrapper()).toBeNull()
  })
})
