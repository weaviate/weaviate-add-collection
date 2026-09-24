/**
 * Defaults for the collection sharding config.
 *
 * Empty strings (not numbers) so <input type="number"> stays controlled and
 * "not set" is distinguishable from 0. Serialization coerces non-empty values
 * to integers and drops anything failing Number.isFinite + Number.isInteger,
 * matching the async replication config.
 *
 * Only the three create-time knobs are editable. The server also returns
 * actualCount, actualVirtualCount, key, strategy and function on read; those
 * are tolerated on import -- a schema carrying them loads without error -- but
 * they are dropped rather than held in state, and never emitted. They are
 * outputs, not settings.
 */
export const DEFAULT_SHARDING_CONFIG = {
  virtualPerPhysical: '',
  desiredCount: '',
  desiredVirtualCount: '',
}

/**
 * Keys the server reports back but that must never be sent.
 *
 * Import already drops these by only reading the create-time keys, so the
 * serializer's check against this list is a second line of defence for state
 * set any other way.
 */
export const SHARDING_READ_ONLY_KEYS = [
  'actualCount',
  'actualVirtualCount',
  'key',
  'strategy',
  'function',
]

export const createDefaultShardingConfig = () => ({ ...DEFAULT_SHARDING_CONFIG })
