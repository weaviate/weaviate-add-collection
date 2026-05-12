import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Collection from '../components/Collection'

describe('Collection Component - Generative Configuration', () => {
  it('should render generative config section', async () => {
    const { container } = render(<Collection />)

    // Check that the generative configuration section exists
    const generativeButton = screen.getByText('Generative Configuration')
    expect(generativeButton).toBeTruthy()
  })

  it('should enable generative config when checkbox is checked', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Open the generative config section
    const generativeButton = screen.getByText('Generative Configuration')
    await user.click(generativeButton)

    // Wait for the section to open and find the enable checkbox
    await waitFor(() => {
      const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
      expect(enableCheckbox).toBeTruthy()
    })
    
    const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
    await user.click(enableCheckbox)

    // Wait for the module selector to appear
    await waitFor(() => {
      const moduleSelect = screen.getByLabelText('Generative Module')
      expect(moduleSelect).toBeTruthy()
    })
  })

  it('should import generative configuration from JSON', async () => {
    const importedJson = {
      class: 'GenTest',
      description: 'Test collection with generative config',
      generative: {
        'generative-openai': {
          model: 'gpt-4',
          baseURL: 'https://api.openai.com/v1'
        }
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

    // Verify generative config is present (emitted under moduleConfig)
    expect(generatedJson.moduleConfig).toBeDefined()
    expect(generatedJson.moduleConfig['generative-openai']).toBeDefined()
    expect(generatedJson.moduleConfig['generative-openai'].model).toBe('gpt-4')
    expect(generatedJson.moduleConfig['generative-openai'].baseURL).toBe('https://api.openai.com/v1')
  })

  it('should handle different generative modules', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Open the generative config section
    const generativeButton = screen.getByText('Generative Configuration')
    await user.click(generativeButton)

    // Wait for section to open and enable generative config
    await waitFor(() => {
      const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
      expect(enableCheckbox).toBeTruthy()
    })
    
    const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
    await user.click(enableCheckbox)

    // Select a generative module
    await waitFor(() => {
      const moduleSelect = screen.getByLabelText('Generative Module')
      expect(moduleSelect).toBeTruthy()
    })

    const moduleSelect = screen.getByLabelText('Generative Module')
    await user.selectOptions(moduleSelect, 'generative-openai')

    // Wait for module config fields to appear
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.moduleConfig).toBeDefined()
      expect(generatedJson.moduleConfig['generative-openai']).toBeDefined()
    })
  })

  it('should not include generative config when disabled', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Open the generative config section
    const generativeButton = screen.getByText('Generative Configuration')
    await user.click(generativeButton)

    // Verify generative config is not in JSON by default
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.generative).toBeUndefined()
    })
  })

  it('should show module-specific configuration fields', async () => {
    const user = userEvent.setup()
    render(<Collection />)

    // Open and enable generative config
    const generativeButton = screen.getByText('Generative Configuration')
    await user.click(generativeButton)

    // Wait for section to open
    await waitFor(() => {
      const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
      expect(enableCheckbox).toBeTruthy()
    })
    
    const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
    await user.click(enableCheckbox)

    // Select Anthropic module
    await waitFor(() => {
      const moduleSelect = screen.getByLabelText('Generative Module')
      expect(moduleSelect).toBeTruthy()
    })
    
    const moduleSelect = screen.getByLabelText('Generative Module')
    await user.selectOptions(moduleSelect, 'generative-anthropic')

    // Wait for Anthropic-specific fields
    await waitFor(() => {
      // Anthropic should have fields like model, temperature, maxTokens
      const modelInput = screen.getByPlaceholderText(/Enter model/)
      expect(modelInput).toBeTruthy()
    })
  })

  it('should preserve other configs when adding generative config', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)

    // Set collection name
    const nameInput = screen.getByPlaceholderText('MyCollection')
    await user.clear(nameInput)
    await user.type(nameInput, 'TestCollection')

    // Open and enable generative config
    const generativeButton = screen.getByText('Generative Configuration')
    await user.click(generativeButton)

    // Wait for section to open
    await waitFor(() => {
      const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
      expect(enableCheckbox).toBeTruthy()
    })
    
    const enableCheckbox = screen.getByLabelText(/Enable Generative Search/)
    await user.click(enableCheckbox)

    await waitFor(() => {
      const moduleSelect = screen.getByLabelText('Generative Module')
      expect(moduleSelect).toBeTruthy()
    })
    
    const moduleSelect = screen.getByLabelText('Generative Module')
    await user.selectOptions(moduleSelect, 'generative-openai')

    // Verify both name and generative config are in JSON
    await waitFor(() => {
      const jsonBlock = container.querySelector('.json-block')
      const generatedJson = JSON.parse(jsonBlock.textContent)
      expect(generatedJson.class).toBe('TestCollection')
      expect(generatedJson.moduleConfig).toBeDefined()
      expect(generatedJson.moduleConfig['generative-openai']).toBeDefined()
    })
  })
})
