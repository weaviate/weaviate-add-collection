import React from 'react'
import { allAvailableModules } from '../constants/options'
import { getRerankerConfigFields, hasRerankerConfigOptions } from '../utils/moduleConfigExtractor'
import { useVersionFilteredOptions } from '../context/VersionContext'
import ModuleConfigField from './ModuleConfigField'

/**
 * Component for configuring reranker capabilities
 */
export default function RerankerConfigSection({ config, setConfig }) {
  const rerankerModules = useVersionFilteredOptions(
    Object.entries(allAvailableModules)
      .filter(([key]) => key.startsWith('reranker-'))
      .map(([key, value]) => ({
        value: key,
        label: value.name || key,
        documentationHref: value.documentationHref,
        featureId: value.featureId
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )

  const update = (field, value) => {
    setConfig({ ...config, [field]: value })
  }

  const updateModuleConfig = (field, value) => {
    update('moduleConfig', {
      ...config.moduleConfig,
      [field]: value
    })
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="reranker-module">Reranker Module</label>
        <select
          id="reranker-module"
          value={config.module || ''}
          onChange={(e) => {
            // Update both module and reset module config at the same time
            setConfig({
              ...config,
              enabled: e.target.value !== '',
              module: e.target.value,
              moduleConfig: {}
            })
          }}
        >
          <option value="">None (disabled)</option>
          {rerankerModules.map((mod) => (
            <option key={mod.value} value={mod.value} disabled={mod.disabled}>
              {mod.label}{mod.helpText ? ` — ${mod.helpText}` : ''}
            </option>
          ))}
        </select>
        {config.module && (
          <>
            <small className="hint">
              {rerankerModules.find((m) => m.value === config.module)?.documentationHref && (
                <a
                  href={rerankerModules.find((m) => m.value === config.module).documentationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View documentation ↗
                </a>
              )}
            </small>
          </>
        )}
      </div>

      {config.module && hasRerankerConfigOptions(config.module) && (
        <div style={{ marginTop: '16px' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
            Module Configuration for {config.module}
          </h5>
          {getRerankerConfigFields(config.module).map((field) => {
            const moduleConfig = config.moduleConfig || {}
            const value = moduleConfig[field.name] || ''
            return (
              <ModuleConfigField
                key={field.name}
                field={field}
                value={value}
                onChange={updateModuleConfig}
                idPrefix="reranker-config"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
