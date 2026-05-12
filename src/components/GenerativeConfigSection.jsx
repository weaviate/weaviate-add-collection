import React from 'react'
import { allAvailableModules } from '../constants/options'
import { getGenerativeConfigFields, hasGenerativeConfigOptions } from '../utils/moduleConfigExtractor'
import { useVersionFilteredOptions } from '../context/VersionContext'
import ModuleConfigField from './ModuleConfigField'

/**
 * Component for configuring generative search capabilities (RAG)
 */
export default function GenerativeConfigSection({ config, setConfig }) {
  const generativeModules = useVersionFilteredOptions(
    Object.entries(allAvailableModules)
      .filter(([key]) => key.startsWith('generative-'))
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
        <label htmlFor="generative-enabled">
          <input
            id="generative-enabled"
            type="checkbox"
            checked={config.enabled || false}
            onChange={(e) => update('enabled', e.target.checked)}
            style={{ width: 'auto', marginRight: '8px' }}
          />
          Enable Generative Search
        </label>
        <small className="hint">
          This allows you to use generative AI models to generate responses based on your data.
        </small>
      </div>

      {config.enabled && (
        <>
          <div className="field">
            <label htmlFor="generative-module">Generative Module</label>
            <select
              id="generative-module"
              value={config.module || ''}
              onChange={(e) => {
                // Update both module and reset module config at the same time
                setConfig({
                  ...config,
                  module: e.target.value,
                  moduleConfig: {}
                })
              }}
              disabled={!config.enabled}
            >
              <option value="">Select a generative module...</option>
              {generativeModules.map((mod) => (
                <option key={mod.value} value={mod.value} disabled={mod.disabled}>
                  {mod.label}{mod.helpText ? ` — ${mod.helpText}` : ''}
                </option>
              ))}
            </select>
            {config.module && (
              <>
                <small className="hint">
                  {generativeModules.find((m) => m.value === config.module)?.documentationHref && (
                    <a
                      href={generativeModules.find((m) => m.value === config.module).documentationHref}
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

          {config.module && hasGenerativeConfigOptions(config.module) && (
            <div style={{ marginTop: '16px' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                Module Configuration for {config.module}
              </h5>
              {getGenerativeConfigFields(config.module).map((field) => {
                const moduleConfig = config.moduleConfig || {}
                const value = moduleConfig[field.name] || ''
                return (
                  <ModuleConfigField
                    key={field.name}
                    field={field}
                    value={value}
                    onChange={updateModuleConfig}
                    idPrefix="generative-config"
                  />
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
