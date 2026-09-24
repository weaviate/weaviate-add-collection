/**
 * Tests for the sharding configuration section.
 *
 * Only three of the shardingConfig fields are settable at create time. The
 * server reports back actualCount, actualVirtualCount, key, strategy and
 * function as well; those must survive an import without being echoed back
 * into the generated schema.
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

async function openSharding(user) {
  await user.click(screen.getByRole('button', { name: /sharding configuration/i }))
}

function inputForLabel(labelText) {
  return screen.getByText(labelText).parentElement.querySelector('input[type="number"]')
}

describe('Collection — shardingConfig', () => {
  it('is not emitted by default', async () => {
    const { container } = render(<Collection />)
    await waitForRender(container)

    expect(readJson(container)).not.toHaveProperty('shardingConfig')
  })

  it('round-trips the three create-time fields', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        shardingConfig: { desiredCount: 3, virtualPerPhysical: 128, desiredVirtualCount: 384 },
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).shardingConfig).toEqual({
      desiredCount: 3,
      virtualPerPhysical: 128,
      desiredVirtualCount: 384,
    })
  })

  // A schema exported from a live server carries these; they are outputs, and
  // sending them back is not meaningful.
  it('accepts but never re-emits the server-only fields', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        shardingConfig: {
          desiredCount: 2,
          virtualPerPhysical: 128,
          desiredVirtualCount: 256,
          actualCount: 2,
          actualVirtualCount: 256,
          key: '_id',
          strategy: 'hash',
          function: 'murmur3',
        },
      }} />
    )
    await waitForRender(container)

    const sharding = readJson(container).shardingConfig
    expect(sharding).toEqual({ desiredCount: 2, virtualPerPhysical: 128, desiredVirtualCount: 256 })
    for (const key of ['actualCount', 'actualVirtualCount', 'key', 'strategy', 'function']) {
      expect(sharding).not.toHaveProperty(key)
    }
  })

  it('emits only the fields that are set', async () => {
    const { container } = render(
      <Collection initialJson={{ class: 'Article', shardingConfig: { desiredCount: 4 } }} />
    )
    await waitForRender(container)

    expect(readJson(container).shardingConfig).toEqual({ desiredCount: 4 })
  })

  it('drops a non-integer value rather than emitting null', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openSharding(user)

    await user.type(inputForLabel('Desired Count:'), '1.5')

    await waitFor(() => {
      expect(readJson(container)).not.toHaveProperty('shardingConfig')
    })
  })

  it('can be set and cleared through the UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openSharding(user)

    const desiredCount = inputForLabel('Desired Count:')
    await user.type(desiredCount, '3')
    await waitFor(() => {
      expect(readJson(container).shardingConfig).toEqual({ desiredCount: 3 })
    })

    await user.clear(desiredCount)
    await waitFor(() => {
      expect(readJson(container)).not.toHaveProperty('shardingConfig')
    })
  })
})

describe('Collection — sharding and replication coexistence', () => {
  // Weaviate treats the two as mutually exclusive, but Collection.jsx emits
  // each from its own effect and auto-sets the replication factor from
  // nodesNumber. Enforcing exclusivity would require coordinating two
  // independent effects, so the UI warns and the server has the final say.
  // This test records that deliberate choice.
  it('emits both when both are set, and warns in the UI', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Collection nodesNumber={3} initialJson={{
        class: 'Article',
        replicationConfig: { factor: 3 },
        shardingConfig: { desiredCount: 2 },
      }} />
    )
    await waitForRender(container)

    const json = readJson(container)
    expect(json.replicationConfig.factor).toBe(3)
    expect(json.shardingConfig).toEqual({ desiredCount: 2 })

    await openSharding(user)
    expect(screen.getByText(/mutually exclusive/i)).toBeTruthy()
  })

  it('shows no warning when only sharding is set', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Collection initialJson={{ class: 'Article', shardingConfig: { desiredCount: 2 } }} />
    )
    await waitForRender(container)
    await openSharding(user)

    expect(screen.queryByText(/mutually exclusive/i)).toBeNull()
  })
})
