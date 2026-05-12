import React from 'react';
import { VersionGated } from '../context/VersionContext';
import DOC_LINKS from '../constants/docLinks.json';
import { DEFAULT_REPLICATION_ASYNC_CONFIG } from '../constants/replicationDefaults';

const defaultConfig = {
  factor: 1,
  asyncEnabled: false,
  deletionStrategy: 'NoAutomatedResolution',
  asyncConfig: { ...DEFAULT_REPLICATION_ASYNC_CONFIG },
};

const ReplicationConfigSection = ({ config = defaultConfig, setConfig, nodesNumber = null }) => {
  const update = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const updateAsyncConfig = (field, value) => {
    setConfig({ ...config, asyncConfig: { ...(config.asyncConfig || {}), [field]: value } });
  };

  // Determine the maximum replication factor based on nodesNumber
  const maxFactor = nodesNumber && nodesNumber > 0 ? nodesNumber : 100;

  return (
    <div>
        
      <div className="field">
        <label>Replication Factor:</label>
        <input 
          type="number" 
          min="1"
          max={maxFactor}
          value={config.factor === null ? '' : config.factor} 
          onChange={e => {
            const val = e.target.value;
            update('factor', val === '' ? null : parseInt(val, 10) || null);
          }}
          placeholder="1"
        />
        {nodesNumber && nodesNumber > 0 ? (
          <small className="hint">Maximum: {maxFactor} (based on number of nodes)</small>
        ) : (
          <small className="hint">Feature available for clusters with multiple nodes</small>
        )}
      </div>
      {config.factor !== null && config.factor >= 2 && (
        <>
          <VersionGated featureId="replicationAsyncEnabled">
            <div className="field">
              <label>
                Async Enabled:
                {DOC_LINKS.replicationAsyncEnabled && (
                  <a href={DOC_LINKS.replicationAsyncEnabled} target="_blank" rel="noopener noreferrer" title="View documentation" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </a>
                )}
              </label>
              <input
                type="checkbox"
                checked={config.asyncEnabled}
                onChange={e => update('asyncEnabled', e.target.checked)}
              />
            </div>
          </VersionGated>
          <VersionGated featureId="replicationDeletionStrategy">
            {config.asyncEnabled && (
              <div className="field">
                <label>Deletion Strategy:</label>
                <select
                  value={config.deletionStrategy}
                  onChange={e => update('deletionStrategy', e.target.value)}
                >
                  <option value="NoAutomatedResolution">NoAutomatedResolution</option>
                  <option value="DeleteOnConflict">DeleteOnConflict</option>
                  <option value="TimeBasedResolution">TimeBasedResolution</option>
                </select>
              </div>
            )}
          </VersionGated>
          <VersionGated featureId="replicationAsyncConfig">
            {config.asyncEnabled && (
              <div className="nested-section">
                <div className="nested-section-title">
                  Async Replication Config
                  {DOC_LINKS.replicationAsyncConfig && (
                    <a href={DOC_LINKS.replicationAsyncConfig} target="_blank" rel="noopener noreferrer" title="View documentation" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="View documentation">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </a>
                  )}
                </div>
                <div className="field">
                  <label>Max Workers:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.asyncConfig?.maxWorkers ?? ''}
                    onChange={e => updateAsyncConfig('maxWorkers', e.target.value)}
                    placeholder="3 (single-tenant) / 30 (multi-tenant)"
                  />
                </div>
                <div className="field">
                  <label>Hashtree Height:</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="20"
                    value={config.asyncConfig?.hashtreeHeight ?? ''}
                    onChange={e => updateAsyncConfig('hashtreeHeight', e.target.value)}
                    placeholder="16 (single-tenant) / 10 (multi-tenant)"
                  />
                  <small className="hint">Range: 0–20</small>
                </div>
                <div className="field">
                  <label>Frequency (ms):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={config.asyncConfig?.frequency ?? ''}
                    onChange={e => updateAsyncConfig('frequency', e.target.value)}
                    placeholder="30000"
                  />
                </div>
                <div className="field">
                  <label>Frequency While Propagating (ms):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={config.asyncConfig?.frequencyWhilePropagating ?? ''}
                    onChange={e => updateAsyncConfig('frequencyWhilePropagating', e.target.value)}
                    placeholder="3000"
                  />
                </div>
                <div className="field">
                  <label>Diff Batch Size:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="10000"
                    value={config.asyncConfig?.diffBatchSize ?? ''}
                    onChange={e => updateAsyncConfig('diffBatchSize', e.target.value)}
                    placeholder="1000"
                  />
                  <small className="hint">Range: 1–10000</small>
                </div>
                <div className="field">
                  <label>Propagation Timeout (s):</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={config.asyncConfig?.propagationTimeout ?? ''}
                    onChange={e => updateAsyncConfig('propagationTimeout', e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="field">
                  <label>Propagation Limit:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="1000000"
                    value={config.asyncConfig?.propagationLimit ?? ''}
                    onChange={e => updateAsyncConfig('propagationLimit', e.target.value)}
                    placeholder="10000"
                  />
                  <small className="hint">Range: 1–1,000,000</small>
                </div>
                <div className="field">
                  <label>Propagation Concurrency:</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="20"
                    value={config.asyncConfig?.propagationConcurrency ?? ''}
                    onChange={e => updateAsyncConfig('propagationConcurrency', e.target.value)}
                    placeholder="5"
                  />
                  <small className="hint">Range: 1–20</small>
                </div>
              </div>
            )}
          </VersionGated>
        </>
      )}
    </div>
  );
};

export default ReplicationConfigSection;
