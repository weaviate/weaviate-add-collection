/**
 * Tests for HFresh index parameters.
 *
 * searchProbe has no fixed default to elide: the server raised it from 64 to
 * 256 in 1.37.10 / 1.38.2 / 1.39.0 (weaviate 1e624931d). Any value the user
 * set is therefore always emitted, and an empty field means "server default".
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

function hfreshWith(indexConfig, vectorizer = { none: {} }) {
  return {
    class: 'Article',
    vectorConfig: {
      default: { vectorizer, vectorIndexType: 'hfresh', vectorIndexConfig: indexConfig },
    },
  }
}

async function openHfreshIndexTab(user, container) {
  await user.click(screen.getByRole('button', { name: /vectorizer configuration/i }))
  await user.click(screen.getByRole('button', { name: /add vector config/i }))
  await user.click(screen.getByRole('button', { name: /^index configuration$/i }))
  await user.selectOptions(container.querySelector('#index-type-0'), 'hfresh')
}

function searchProbeInput() {
  const label = screen.getByText('Search Probe')
  return label.parentElement.querySelector('input')
}

describe('HFresh searchProbe', () => {
  // 64 used to be elided as "the default", which silently became 256 on
  // servers from 1.37.10 onward.
  it('emits an imported 64 instead of eliding it', async () => {
    const { container } = render(<Collection initialJson={hfreshWith({ searchProbe: 64 })} />)
    await waitForRender(container)

    expect(indexConfigOf(container).searchProbe).toBe(64)
  })

  it('emits an imported 256', async () => {
    const { container } = render(<Collection initialJson={hfreshWith({ searchProbe: 256 })} />)
    await waitForRender(container)

    expect(indexConfigOf(container).searchProbe).toBe(256)
  })

  it('is omitted when never set, leaving it to the server', async () => {
    const { container } = render(<Collection initialJson={hfreshWith({ replicas: 6 })} />)
    await waitForRender(container)

    expect(indexConfigOf(container)).not.toHaveProperty('searchProbe')
  })

  it('starts empty in the UI and emits nothing until typed', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openHfreshIndexTab(user, container)

    expect(searchProbeInput().value).toBe('')
    expect(indexConfigOf(container) || {}).not.toHaveProperty('searchProbe')

    await user.type(searchProbeInput(), '64')
    await waitFor(() => expect(indexConfigOf(container).searchProbe).toBe(64))

    await user.clear(searchProbeInput())
    await waitFor(() => expect(indexConfigOf(container) || {}).not.toHaveProperty('searchProbe'))
  })
})

// HFresh only stores multi-vectors MUVERA-encoded (weaviate #13883): the server
// rejects multivector.enabled without muvera.enabled. Supported for
// bring-your-own multi-vectors since 1.40.0; multi-vector vectorizers on HFresh
// since 1.40.6 / 1.41.0.
describe('HFresh multi-vector — export', () => {
  const muvera = { enabled: true, ksim: 4, dprojections: 16, repetitions: 10 }

  it('round-trips a full MUVERA config', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ multivector: { enabled: true, muvera } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual({ enabled: true, muvera })
  })

  it('forces muvera on when only multivector.enabled is set', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ multivector: { enabled: true, muvera: { enabled: false, ksim: 3 } } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual({ enabled: true, muvera: { enabled: true, ksim: 3 } })
  })

  it('implies multivector.enabled from muvera.enabled alone', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ multivector: { muvera: { enabled: true } } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).toEqual({ enabled: true, muvera: { enabled: true } })
  })

  it('drops the HNSW-only aggregation setting', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ multivector: { enabled: true, aggregation: 'maxSim', muvera } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container).multivector).not.toHaveProperty('aggregation')
  })

  it('is omitted when both flags are off', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ replicas: 6, multivector: { enabled: false, muvera: { enabled: false } } })} />
    )
    await waitForRender(container)

    expect(indexConfigOf(container)).not.toHaveProperty('multivector')
  })

  it('keeps the other HFresh parameters alongside it', async () => {
    const { container } = render(
      <Collection initialJson={hfreshWith({ replicas: 6, searchProbe: 128, multivector: { enabled: true, muvera } })} />
    )
    await waitForRender(container)

    const ic = indexConfigOf(container)
    expect(ic.replicas).toBe(6)
    expect(ic.searchProbe).toBe(128)
    expect(ic.multivector.muvera.enabled).toBe(true)
  })
})

describe('HFresh multi-vector — UI', () => {
  it('one toggle emits both flags, and removes them when turned off', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openHfreshIndexTab(user, container)

    expect(screen.queryByLabelText('KSim')).toBeNull()

    await user.click(container.querySelector('#hfresh-multivector-enabled-0'))
    await waitFor(() => {
      expect(indexConfigOf(container).multivector).toEqual({ enabled: true, muvera: { enabled: true } })
    })

    await user.type(container.querySelector('#hfresh-muvera-ksim-0'), '5')
    await waitFor(() => expect(indexConfigOf(container).multivector.muvera.ksim).toBe(5))

    await user.click(container.querySelector('#hfresh-multivector-enabled-0'))
    await waitFor(() => expect(indexConfigOf(container) || {}).not.toHaveProperty('multivector'))
  })

  it('has no separate MUVERA on/off toggle', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openHfreshIndexTab(user, container)
    await user.click(container.querySelector('#hfresh-multivector-enabled-0'))

    expect(screen.queryByLabelText(/enable muvera/i)).toBeNull()
  })
})

describe('HFresh multi-vector — version gating', () => {
  function tooltip() {
    return screen.getByText('Multi-Vector (MUVERA)').closest('[data-version-tooltip]')
  }

  it('is greyed out one patch below 1.40.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.39.99" />)
    await waitForRender(container)
    await openHfreshIndexTab(user, container)

    expect(tooltip()?.getAttribute('data-version-tooltip')).toContain('1.40.0')
  })

  it('is active at 1.40.0', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection weaviateVersion="1.40.0" />)
    await waitForRender(container)
    await openHfreshIndexTab(user, container)

    expect(tooltip()).toBeNull()
  })
})
