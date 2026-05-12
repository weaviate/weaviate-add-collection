import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Collection from '../components/Collection'

describe('Collection Component - Replication Configuration', () => {
  it('should import replication configuration from JSON', async () => {
    const importedJson = {
      class: 'ReplicatedCollection',
      description: 'Replication Test Collection',
      replicationConfig: {
        factor: 3,
        asyncEnabled: true,
        deletionStrategy: 'DeleteOnConflict'
      },
      properties: [],
      vectorConfig: {
        default: {
          vectorizer: { none: {} },
          vectorIndexType: 'hnsw'
        }
      }
    }

    const { container } = render(<Collection initialJson={importedJson} />)

    // Wait for the component to render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    }, { timeout: 3000 })

    // Get the generated JSON from the component
    const jsonBlock = container.querySelector('.json-block')
    const generatedJson = JSON.parse(jsonBlock.textContent)

    // Verify replication config is present with non-default values
    expect(generatedJson.replicationConfig).toBeDefined()
    expect(generatedJson.replicationConfig.factor).toBe(3)
    expect(generatedJson.replicationConfig.asyncEnabled).toBe(true)
    expect(generatedJson.replicationConfig.deletionStrategy).toBe('DeleteOnConflict')
  })

  it('should not include replication config when all values are defaults', async () => {
    const importedJson = {
      class: 'DefaultReplication',
      description: 'Default Replication Collection',
      replicationConfig: {
        factor: 1,
        asyncEnabled: false,
        deletionStrategy: 'NoAutomatedResolution'
      },
      properties: [],
      vectorConfig: {
        default: {
          vectorizer: { none: {} },
          vectorIndexType: 'hnsw'
        }
      }
    }

    const { container } = render(<Collection initialJson={importedJson} />)

    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    }, { timeout: 3000 })

    const jsonBlock = container.querySelector('.json-block')
    const generatedJson = JSON.parse(jsonBlock.textContent)

    // Verify replicationConfig is present with only factor (default value)
    expect(generatedJson.replicationConfig).toBeDefined()
    expect(generatedJson.replicationConfig.factor).toBe(1)
    // asyncEnabled and deletionStrategy should not be included (they're defaults)
    expect(generatedJson.replicationConfig.asyncEnabled).toBeUndefined()
    expect(generatedJson.replicationConfig.deletionStrategy).toBeUndefined()
  })

  it('should handle all deletion strategy options', async () => {
    const strategies = ['NoAutomatedResolution', 'DeleteOnConflict', 'TimeBasedResolution']
    
    for (const strategy of strategies) {
      const importedJson = {
        class: 'StrategyTest',
        description: 'Strategy Test Collection',
        replicationConfig: {
          factor: 2,
          asyncEnabled: true, // Must be true for deletionStrategy to appear in JSON
          deletionStrategy: strategy
        },
        properties: [],
        vectorConfig: {
          default: {
            vectorizer: { none: {} },
            vectorIndexType: 'hnsw'
          }
        }
      }

      const { container, unmount } = render(<Collection initialJson={importedJson} />)

      await waitFor(() => {
        const jsonBlock = container.querySelector('.json-block')
        expect(jsonBlock).toBeTruthy()
      }, { timeout: 3000 })

      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)

      expect(generatedJson.replicationConfig).toBeDefined()
      expect(generatedJson.replicationConfig.factor).toBe(2)
      expect(generatedJson.replicationConfig.asyncEnabled).toBe(true)
      
      // Only non-default values appear in the JSON
      // NoAutomatedResolution is the default, so it won't appear
      if (strategy === 'NoAutomatedResolution') {
        // When strategy is default, it won't appear in JSON
        expect(generatedJson.replicationConfig.deletionStrategy).toBeUndefined()
      } else {
        // Non-default strategies will appear in the JSON when asyncEnabled is true
        expect(generatedJson.replicationConfig.deletionStrategy).toBe(strategy)
      }
      
      unmount()
    }
  })

  it('should update replication factor through UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Wait for initial render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    })

    // Find and click the Replication Configuration toggle to expand it
    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    expect(replicationToggle).toBeTruthy()
    await user.click(replicationToggle)

    // Wait for the section to expand and find the replication factor input
    await waitFor(() => {
      const factorInput = container.querySelector('input[type="number"][min="1"]')
      expect(factorInput).toBeTruthy()
    })

    const factorInput = container.querySelector('input[type="number"][min="1"]')
    
    // Triple click to select all, then type new value
    await user.tripleClick(factorInput)
    await user.keyboard('3')

    // Wait for state update
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.replicationConfig).toBeDefined()
      expect(generatedJson.replicationConfig.factor).toBe(3)
    })
  })

  it('should respect nodesNumber as maximum replication factor', async () => {
    const user = userEvent.setup()
    const nodesNumber = 5
    const { container } = render(<Collection nodesNumber={nodesNumber} />)

    // Wait for initial render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    })

    // Click the Replication Configuration toggle to expand it
    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    await user.click(replicationToggle)

    // Wait for the section to expand and find the replication factor input
    await waitFor(() => {
      const factorInput = container.querySelector('input[type="number"][min="1"]')
      expect(factorInput).toBeTruthy()
    })

    const factorInput = container.querySelector('input[type="number"][min="1"]')
    expect(factorInput.max).toBe(nodesNumber.toString())

    // Verify the hint is displayed
    const hint = screen.getByText(`Maximum: ${nodesNumber} (based on number of nodes)`)
    expect(hint).toBeTruthy()
  })

  it('should toggle async enabled through UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Wait for initial render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    })

    // Click the Replication Configuration toggle to expand it
    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    await user.click(replicationToggle)

    // Wait for the section to expand
    await waitFor(() => {
      const factorInput = container.querySelector('input[type="number"][min="1"]')
      expect(factorInput).toBeTruthy()
    })

    // First, set replication factor to 2 or more to show async enabled field
    const factorInput = container.querySelector('input[type="number"][min="1"]')
    
    await user.tripleClick(factorInput)
    await user.keyboard('2')

    // Wait for the async enabled field to appear
    await waitFor(() => {
      const label = screen.queryByText('Async Enabled:')
      expect(label).toBeTruthy()
    })

    // Find the async enabled checkbox by label
    const label = screen.getByText('Async Enabled:')
    const asyncCheckbox = label.parentElement.querySelector('input[type="checkbox"]')
    expect(asyncCheckbox).toBeTruthy()
    expect(asyncCheckbox.checked).toBe(false)

    // Click the checkbox
    await user.click(asyncCheckbox)

    // Wait for state update
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.replicationConfig).toBeDefined()
      expect(generatedJson.replicationConfig.asyncEnabled).toBe(true)
    })
  })

  it('should change deletion strategy through UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Wait for initial render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    })

    // Click the Replication Configuration toggle to expand it
    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    await user.click(replicationToggle)

    // Wait for the section to expand
    await waitFor(() => {
      const factorInput = container.querySelector('input[type="number"][min="1"]')
      expect(factorInput).toBeTruthy()
    })

    // First, set replication factor to 2 or more to show async enabled field
    const factorInput = container.querySelector('input[type="number"][min="1"]')
    await user.tripleClick(factorInput)
    await user.keyboard('2')

    // Wait for the async enabled field to appear
    await waitFor(() => {
      const label = screen.queryByText('Async Enabled:')
      expect(label).toBeTruthy()
    })

    // Enable async to show deletion strategy field
    const asyncLabel = screen.getByText('Async Enabled:')
    const asyncCheckbox = asyncLabel.parentElement.querySelector('input[type="checkbox"]')
    await user.click(asyncCheckbox)

    // Wait for deletion strategy field to appear
    await waitFor(() => {
      const strategyLabel = screen.queryByText('Deletion Strategy:')
      expect(strategyLabel).toBeTruthy()
    })

    // Find the deletion strategy select by label
    const strategyLabel = screen.getByText('Deletion Strategy:')
    const strategySelect = strategyLabel.parentElement.querySelector('select')
    expect(strategySelect).toBeTruthy()
    expect(strategySelect.value).toBe('NoAutomatedResolution')

    // Change to DeleteOnConflict
    await user.selectOptions(strategySelect, 'DeleteOnConflict')

    // Wait for state update
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.replicationConfig).toBeDefined()
      expect(generatedJson.replicationConfig.deletionStrategy).toBe('DeleteOnConflict')
    })
  })

  it('should include only non-default values in generated JSON', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Wait for initial render
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    })

    // Click the Replication Configuration toggle to expand it
    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    await user.click(replicationToggle)

    // Wait for the section to expand
    await waitFor(() => {
      const factorInput = container.querySelector('input[type="number"][min="1"]')
      expect(factorInput).toBeTruthy()
    })

    // Change only the replication factor
    const factorInput = container.querySelector('input[type="number"][min="1"]')
    
    // Triple click to select all, then type new value
    await user.tripleClick(factorInput)
    await user.keyboard('2')
    
    // Wait for state update - factor 2 should show replicationConfig with only factor
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.replicationConfig).toBeDefined()
      expect(generatedJson.replicationConfig.factor).toBe(2)
      // asyncEnabled and deletionStrategy should not be included (they're defaults)
      expect(generatedJson.replicationConfig.asyncEnabled).toBeUndefined()
      expect(generatedJson.replicationConfig.deletionStrategy).toBeUndefined()
    }, { timeout: 3000 })
  })

  // ── asyncConfig import ────────────────────────────────────────────────────

  it('should import all asyncConfig fields from replicationConfig', async () => {
    const importedJson = {
      class: 'AsyncConfigImport',
      replicationConfig: {
        factor: 3,
        asyncEnabled: true,
        asyncConfig: {
          maxWorkers: 5,
          hashtreeHeight: 12,
          frequency: 15000,
          frequencyWhilePropagating: 1500,
          diffBatchSize: 500,
          propagationTimeout: 30,
          propagationLimit: 5000,
          propagationConcurrency: 3,
        },
      },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    const generatedJson = JSON.parse(container.querySelector('.json-block').textContent)
    const ac = generatedJson.replicationConfig?.asyncConfig
    expect(ac).toBeDefined()
    expect(ac.maxWorkers).toBe(5)
    expect(ac.hashtreeHeight).toBe(12)
    expect(ac.frequency).toBe(15000)
    expect(ac.frequencyWhilePropagating).toBe(1500)
    expect(ac.diffBatchSize).toBe(500)
    expect(ac.propagationTimeout).toBe(30)
    expect(ac.propagationLimit).toBe(5000)
    expect(ac.propagationConcurrency).toBe(3)
  })

  it('should import partial asyncConfig, omitting fields that were not provided', async () => {
    const importedJson = {
      class: 'PartialAsyncConfig',
      replicationConfig: {
        factor: 2,
        asyncEnabled: true,
        asyncConfig: { maxWorkers: 10, frequency: 20000 },
      },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    const ac = JSON.parse(container.querySelector('.json-block').textContent).replicationConfig?.asyncConfig
    expect(ac).toBeDefined()
    expect(ac.maxWorkers).toBe(10)
    expect(ac.frequency).toBe(20000)
    expect(ac.hashtreeHeight).toBeUndefined()
    expect(ac.diffBatchSize).toBeUndefined()
    expect(ac.propagationConcurrency).toBeUndefined()
  })

  it('should not emit asyncConfig when no asyncConfig fields are populated', async () => {
    const importedJson = {
      class: 'NoAsyncConfigFields',
      replicationConfig: { factor: 2, asyncEnabled: true },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    const rc = JSON.parse(container.querySelector('.json-block').textContent).replicationConfig
    expect(rc.asyncEnabled).toBe(true)
    expect(rc.asyncConfig).toBeUndefined()
  })

  it('should not emit asyncConfig when asyncEnabled is false, even if asyncConfig is in the import', async () => {
    const importedJson = {
      class: 'AsyncDisabled',
      replicationConfig: {
        factor: 3,
        asyncEnabled: false,
        asyncConfig: { maxWorkers: 5 },
      },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    const rc = JSON.parse(container.querySelector('.json-block').textContent).replicationConfig
    expect(rc.asyncConfig).toBeUndefined()
  })

  // ── asyncConfig version gating (replicationAsyncConfig, >= 1.36.0) ─────────

  it('should show asyncConfig section without version gate when no version is set', async () => {
    const user = userEvent.setup()
    const importedJson = {
      class: 'AsyncGateNoVersion',
      replicationConfig: { factor: 2, asyncEnabled: true },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    await user.click(screen.getByText('Replication Configuration').closest('button'))

    await waitFor(() => expect(screen.queryByText('Async Replication Config')).toBeTruthy())
    const heading = screen.getByText('Async Replication Config')
    expect(heading.closest('[data-version-tooltip]')).toBeNull()
  })

  it('should show asyncConfig section without version gate when version >= 1.36.0', async () => {
    const user = userEvent.setup()
    const importedJson = {
      class: 'AsyncGateAbove',
      replicationConfig: { factor: 2, asyncEnabled: true },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection weaviateVersion="1.36.0" initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    await user.click(screen.getByText('Replication Configuration').closest('button'))

    await waitFor(() => expect(screen.queryByText('Async Replication Config')).toBeTruthy())
    const heading = screen.getByText('Async Replication Config')
    expect(heading.closest('[data-version-tooltip]')).toBeNull()
  })

  it('should show asyncConfig section with version gate overlay when version < 1.36.0', async () => {
    const user = userEvent.setup()
    const importedJson = {
      class: 'AsyncGateBelow',
      replicationConfig: { factor: 2, asyncEnabled: true },
      properties: [],
      vectorConfig: { default: { vectorizer: { none: {} }, vectorIndexType: 'hnsw' } },
    }

    const { container } = render(<Collection weaviateVersion="1.35.9" initialJson={importedJson} />)
    await waitFor(() => expect(container.querySelector('.json-block')).toBeTruthy(), { timeout: 3000 })

    await user.click(screen.getByText('Replication Configuration').closest('button'))

    await waitFor(() => expect(screen.queryByText('Async Replication Config')).toBeTruthy())
    const heading = screen.getByText('Async Replication Config')
    expect(heading.closest('[data-version-tooltip]')).not.toBeNull()
    expect(heading.closest('[data-version-tooltip]').dataset.versionTooltip).toMatch(/1\.36\.0/)
  })

  it('should handle complex replication configuration from import', async () => {
    const importedJson = {
      class: 'ComplexReplication',
      description: 'Complex Replication Test',
      replicationConfig: {
        factor: 5,
        asyncEnabled: true,
        deletionStrategy: 'TimeBasedResolution'
      },
      properties: [
        {
          name: 'text',
          dataType: ['text'],
          indexFilterable: true,
          indexSearchable: true
        }
      ],
      vectorConfig: {
        default: {
          vectorizer: {
            'text2vec-openai': {
              model: 'text-embedding-3-small'
            }
          },
          vectorIndexType: 'hnsw'
        }
      }
    }

    const { container } = render(<Collection initialJson={importedJson} />)

    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      expect(jsonBlock).toBeTruthy()
    }, { timeout: 3000 })

    const jsonBlock = container.querySelector('.json-block')
    const generatedJson = JSON.parse(jsonBlock.textContent)

    // Verify all replication config values
    expect(generatedJson.replicationConfig).toBeDefined()
    expect(generatedJson.replicationConfig.factor).toBe(5)
    expect(generatedJson.replicationConfig.asyncEnabled).toBe(true)
    expect(generatedJson.replicationConfig.deletionStrategy).toBe('TimeBasedResolution')
  })

  // ─── asyncConfig UI interaction tests ────────────────────────────────────
  // Helper: open the Replication Configuration section, set factor=2, enable
  // async, and return the container plus a userEvent instance.
  async function openSectionAndEnableAsync(container) {
    const user = userEvent.setup()
    await waitFor(() => {
      expect(container.querySelector('.json-block')).toBeTruthy()
    })

    const replicationToggle = screen.getByText('Replication Configuration').closest('button')
    await user.click(replicationToggle)

    await waitFor(() => {
      expect(container.querySelector('input[type="number"][min="1"]')).toBeTruthy()
    })

    const factorInput = container.querySelector('input[type="number"][min="1"]')
    await user.tripleClick(factorInput)
    await user.keyboard('2')

    await waitFor(() => {
      expect(screen.queryByText('Async Enabled:')).toBeTruthy()
    })

    const asyncCheckbox = screen.getByText('Async Enabled:').parentElement.querySelector('input[type="checkbox"]')
    await user.click(asyncCheckbox)

    await waitFor(() => {
      expect(screen.queryByText('Max Workers:')).toBeTruthy()
    })

    return { user }
  }

  function inputForLabel(labelText) {
    return screen.getByText(labelText).parentElement.querySelector('input[type="number"]')
  }

  it('should write a typed asyncConfig value into the generated JSON', async () => {
    const { container } = render(<Collection />)
    const { user } = await openSectionAndEnableAsync(container)

    const maxWorkers = inputForLabel('Max Workers:')
    await user.type(maxWorkers, '7')

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      expect(json.replicationConfig?.asyncConfig?.maxWorkers).toBe(7)
    })
  })

  it('should remove an asyncConfig field from JSON when the user clears its input', async () => {
    const { container } = render(<Collection />)
    const { user } = await openSectionAndEnableAsync(container)

    const maxWorkers = inputForLabel('Max Workers:')
    await user.type(maxWorkers, '7')

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      expect(json.replicationConfig.asyncConfig.maxWorkers).toBe(7)
    })

    await user.clear(maxWorkers)

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      // The whole asyncConfig block should be dropped (no fields populated)
      expect(json.replicationConfig?.asyncConfig).toBeUndefined()
    })
  })

  it('should drop asyncConfig entirely when async is disabled after values are entered', async () => {
    const { container } = render(<Collection />)
    const { user } = await openSectionAndEnableAsync(container)

    await user.type(inputForLabel('Max Workers:'), '4')
    await user.type(inputForLabel('Diff Batch Size:'), '500')

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      expect(json.replicationConfig.asyncConfig).toEqual({ maxWorkers: 4, diffBatchSize: 500 })
    })

    const asyncCheckbox = screen.getByText('Async Enabled:').parentElement.querySelector('input[type="checkbox"]')
    await user.click(asyncCheckbox)

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      // When async is back to its default (off) the emitter omits both
      // asyncEnabled and asyncConfig from replicationConfig entirely.
      expect(json.replicationConfig?.asyncEnabled).toBeUndefined()
      expect(json.replicationConfig?.asyncConfig).toBeUndefined()
    })
  })

  it('should omit asyncConfig fields whose value is not a finite integer', async () => {
    // Browsers reject most non-numeric input in <input type=number>, but
    // decimals (e.g. "1.5") and scientific notation slip through. The
    // serializer must drop these so JSON never emits null for a bad value.
    const { container } = render(<Collection />)
    const { user } = await openSectionAndEnableAsync(container)

    const maxWorkers = inputForLabel('Max Workers:')
    await user.type(maxWorkers, '1.5')

    // Type a valid integer in another field so asyncConfig isn't empty
    await user.type(inputForLabel('Diff Batch Size:'), '500')

    await waitFor(() => {
      const json = JSON.parse(container.querySelector('.json-block').textContent)
      expect(json.replicationConfig.asyncConfig).toBeDefined()
      // diffBatchSize is a clean integer and must round-trip
      expect(json.replicationConfig.asyncConfig.diffBatchSize).toBe(500)
      // maxWorkers="1.5" failed the integer check and must be omitted
      expect(json.replicationConfig.asyncConfig.maxWorkers).toBeUndefined()
    })
  })
})
