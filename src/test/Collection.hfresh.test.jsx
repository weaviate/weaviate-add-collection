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
