import React from 'react';
import { DEFAULT_SHARDING_CONFIG } from '../constants/shardingDefaults';

const ShardingConfigSection = ({ config = DEFAULT_SHARDING_CONFIG, setConfig, replicationFactor = null }) => {
  const update = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  // The client documents sharding and replication as mutually exclusive, but
  // Collection.jsx emits each from its own effect and auto-sets the
  // replication factor from nodesNumber, so they can end up in the same
  // schema. Coordinating the two effects would fight the one-effect-per-key
  // design, so this warns instead of blocking -- the server has the final say.
  const conflictsWithReplication = replicationFactor !== null && replicationFactor >= 2;

  return (
    <div>
      {conflictsWithReplication && (
        <small className="hint" style={{ display: 'block', marginBottom: '12px', color: '#b45309' }}>
          A replication factor of {replicationFactor} is also set. Weaviate treats sharding and
          replication as mutually exclusive — set only one of them.
        </small>
      )}

      <div className="field">
        <label>Desired Count:</label>
        <input
          type="number"
          step="1"
          min="1"
          value={config.desiredCount}
          onChange={e => update('desiredCount', e.target.value)}
          placeholder="1"
        />
        <small className="hint">Number of physical shards for this collection (default: 1).</small>
      </div>

      <div className="field">
        <label>Virtual Per Physical:</label>
        <input
          type="number"
          step="1"
          min="1"
          value={config.virtualPerPhysical}
          onChange={e => update('virtualPerPhysical', e.target.value)}
          placeholder="128"
        />
        <small className="hint">
          Virtual shards per physical shard. Higher values smooth out rebalancing (default: 128).
        </small>
      </div>

      <div className="field">
        <label>Desired Virtual Count:</label>
        <input
          type="number"
          step="1"
          min="1"
          value={config.desiredVirtualCount}
          onChange={e => update('desiredVirtualCount', e.target.value)}
          placeholder="128"
        />
        <small className="hint">
          Total virtual shards. Normally left unset — it follows desiredCount × virtualPerPhysical.
        </small>
      </div>
    </div>
  );
};

export default ShardingConfigSection;
