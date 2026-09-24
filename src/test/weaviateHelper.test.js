/**
 * Tests for the raw REST schema helpers' error handling.
 *
 * These run without a Weaviate instance -- fetch is stubbed. The point is not
 * the HTTP call but the decision of what to swallow: cleanup that ignores every
 * failure leaves a stale collection behind, and the next run of the same live
 * test then fails for a reason that has nothing to do with the code under test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { deleteRawSchema } from './weaviateHelper'

afterEach(() => vi.unstubAllGlobals())

const respondWith = (status) => vi.stubGlobal('fetch', vi.fn(async () => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => 'server said no',
})))

describe('deleteRawSchema', () => {
  it('resolves when the collection was deleted', async () => {
    respondWith(200)
    await expect(deleteRawSchema('Article')).resolves.toBeUndefined()
  })

  it('resolves on 404 so it is safe to call before a test creates anything', async () => {
    respondWith(404)
    await expect(deleteRawSchema('Article')).resolves.toBeUndefined()
  })

  it('throws on a server error rather than leaving a stale collection', async () => {
    respondWith(500)
    await expect(deleteRawSchema('Article')).rejects.toThrow(/500/)
  })

  it('propagates a connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED') }))
    await expect(deleteRawSchema('Article')).rejects.toThrow(/ECONNREFUSED/)
  })
})
