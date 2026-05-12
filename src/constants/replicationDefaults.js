/**
 * Shared defaults for the per-collection async replication config.
 *
 * Empty strings (not numbers) so that <input type="number"> stays controlled
 * and a "not set" value can be distinguished from 0. Serialization in
 * Collection.jsx coerces non-empty values to integers and drops anything that
 * doesn't pass Number.isFinite + Number.isInteger.
 */
export const DEFAULT_REPLICATION_ASYNC_CONFIG = {
  maxWorkers: '',
  hashtreeHeight: '',
  frequency: '',
  frequencyWhilePropagating: '',
  diffBatchSize: '',
  propagationTimeout: '',
  propagationLimit: '',
  propagationConcurrency: '',
}
