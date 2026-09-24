/**
 * Tests for tokenization configuration.
 *
 * Covers the gse_ch tokenization method (Weaviate >= 1.34.0), which the
 * TypeScript client only surfaced in its v1.37 schema refresh even though the
 * server has accepted it since 1.34.0.
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

function tokenizationSelect() {
  return screen.getByText('Tokenization').parentElement.querySelector('select')
}

function optionFor(select, value) {
  return Array.from(select.options).find(o => o.value === value)
}

const withTextProperty = {
  class: 'Article',
  properties: [{ name: 'title', dataType: ['text'] }],
}

// ─── gse_ch dropdown option ───────────────────────────────────────────────────

describe('Collection — gse_ch tokenization option', () => {
  it('is offered in the tokenization dropdown', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(optionFor(tokenizationSelect(), 'gse_ch')).toBeTruthy()
  })

  it('is enabled when no version is set', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(optionFor(tokenizationSelect(), 'gse_ch').disabled).toBe(false)
  })

  it('is enabled for version >= 1.34.0', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.34.0" />)
    await waitForRender(container)

    expect(optionFor(tokenizationSelect(), 'gse_ch').disabled).toBe(false)
  })

  it('is still enabled well above the minimum', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.37.3" />)
    await waitForRender(container)

    expect(optionFor(tokenizationSelect(), 'gse_ch').disabled).toBe(false)
  })

  it('is disabled with help text one patch below the minimum', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.33.9" />)
    await waitForRender(container)

    const option = optionFor(tokenizationSelect(), 'gse_ch')
    expect(option.disabled).toBe(true)
    expect(option.textContent).toContain('1.34.0')
  })

  it('does not disable the ungated built-in methods', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.20.0" />)
    await waitForRender(container)

    const select = tokenizationSelect()
    for (const value of ['word', 'lowercase', 'whitespace', 'field']) {
      expect(optionFor(select, value).disabled).toBe(false)
    }
  })
})

// ─── Per-property textAnalyzer (Weaviate >= 1.37.2) ───────────────────────────

function asciiFoldCheckbox() {
  return screen.getByText('ASCII Fold').parentElement.querySelector('input[type="checkbox"]')
}

describe('Collection — property textAnalyzer round-trip', () => {
  it('survives an import unchanged', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{
          name: 'title',
          dataType: ['text'],
          tokenization: 'word',
          textAnalyzer: { asciiFold: true, asciiFoldIgnore: ['é'], stopwordPreset: 'legal' },
        }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0].textAnalyzer).toEqual({
      asciiFold: true,
      asciiFoldIgnore: ['é'],
      stopwordPreset: 'legal',
    })
  })

  // Only the recursion in processProperty/transformProperty covers nested
  // properties, so this is the case most likely to regress.
  it('survives an import on a nested property', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{
          name: 'author',
          dataType: ['object'],
          nestedProperties: [{
            name: 'bio',
            dataType: ['text'],
            tokenization: 'word',
            textAnalyzer: { asciiFold: true, stopwordPreset: 'en' },
          }],
        }],
      }} />
    )
    await waitForRender(container)

    const nested = readJson(container).properties[0].nestedProperties[0]
    expect(nested.textAnalyzer).toEqual({ asciiFold: true, stopwordPreset: 'en' })
  })

  it('is omitted entirely when everything is at its default', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })

  it('does not emit asciiFold: false', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'], textAnalyzer: { asciiFold: false } }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })

  it('drops asciiFoldIgnore when asciiFold is off — the server would ignore it', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{
          name: 'title',
          dataType: ['text'],
          textAnalyzer: { asciiFold: false, asciiFoldIgnore: ['é'] },
        }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })

  it('drops stopwordPreset for non-word tokenization — the server only honours it for word', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{
          name: 'sku',
          dataType: ['text'],
          tokenization: 'field',
          textAnalyzer: { stopwordPreset: 'en' },
        }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })

  it('drops a whitespace-only stopwordPreset rather than emitting it', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{
          name: 'title',
          dataType: ['text'],
          tokenization: 'word',
          textAnalyzer: { stopwordPreset: '   ' },
        }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })

  it('is not emitted for non-text properties', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'count', dataType: ['int'], textAnalyzer: { asciiFold: true } }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
  })
})

describe('Collection — property textAnalyzer UI', () => {
  it('emits asciiFold once ticked, and removes it once unticked', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    await user.click(asciiFoldCheckbox())
    await waitFor(() => {
      expect(readJson(container).properties[0].textAnalyzer).toEqual({ asciiFold: true })
    })

    await user.click(asciiFoldCheckbox())
    await waitFor(() => {
      expect(readJson(container).properties[0]).not.toHaveProperty('textAnalyzer')
    })
  })

  it('only offers the ignore list once ASCII folding is on', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(screen.queryByText('ASCII Fold Ignore')).toBeNull()

    await user.click(asciiFoldCheckbox())
    expect(screen.getByText('ASCII Fold Ignore')).toBeTruthy()
  })

  it('hides the stopword preset picker for non-word tokenization', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(screen.getByText('Stopword Preset')).toBeTruthy()

    await user.selectOptions(tokenizationSelect(), 'field')
    await waitFor(() => {
      expect(screen.queryByText('Stopword Preset')).toBeNull()
    })
  })
})

describe('Collection — textAnalyzer version gating', () => {
  // VersionGated greys the block out behind a click-capture overlay rather than
  // removing it, so gating is asserted via the data-version-tooltip wrapper.
  function tooltipWrapperFor(container, text) {
    const node = screen.getByText(text)
    return node.closest('[data-version-tooltip]')
  }

  it('is greyed out with the minimum version one patch below 1.37.2', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.37.1" />)
    await waitForRender(container)

    const wrapper = tooltipWrapperFor(container, 'ASCII Fold')
    expect(wrapper).toBeTruthy()
    expect(wrapper.getAttribute('data-version-tooltip')).toContain('1.37.2')
  })

  it('is active at exactly 1.37.2', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.37.2" />)
    await waitForRender(container)

    expect(tooltipWrapperFor(container, 'ASCII Fold')).toBeNull()
  })

  it('is active above 1.37.2', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} weaviateVersion="1.38.0" />)
    await waitForRender(container)

    expect(tooltipWrapperFor(container, 'ASCII Fold')).toBeNull()
  })

  it('is active when no version is set', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(tooltipWrapperFor(container, 'ASCII Fold')).toBeNull()
  })
})

// ─── Collection-level stopwordPresets (Weaviate >= 1.37.2) ────────────────────

async function openInvertedIndex(user) {
  await user.click(screen.getByRole('button', { name: /inverted index configuration/i }))
}

describe('Collection — invertedIndexConfig.stopwordPresets', () => {
  it('survives an import unchanged', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        invertedIndexConfig: {
          stopwordPresets: { fr: ['le', 'la', 'les'], de: ['der', 'die', 'das'] },
        },
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig.stopwordPresets).toEqual({
      fr: ['le', 'la', 'les'],
      de: ['der', 'die', 'das'],
    })
  })

  it('is omitted when there are no presets', async () => {
    const { container } = render(<Collection />)
    await waitForRender(container)

    expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
  })

  it('drops a preset with a whitespace-only name rather than emitting it', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        invertedIndexConfig: { stopwordPresets: { '   ': ['le'], fr: ['la'] } },
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig.stopwordPresets).toEqual({ fr: ['la'] })
  })

  it('drops a preset with an empty word list', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        invertedIndexConfig: { stopwordPresets: { empty: [], fr: ['la'] } },
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).invertedIndexConfig.stopwordPresets).toEqual({ fr: ['la'] })
  })

  it('drops the whole invertedIndexConfig when the only preset is invalid', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        invertedIndexConfig: { stopwordPresets: { empty: [] } },
      }} />
    )
    await waitForRender(container)

    expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
  })

  it('can be built and removed through the UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openInvertedIndex(user)

    await user.click(screen.getByRole('button', { name: /add preset/i }))
    await user.type(screen.getByPlaceholderText('e.g. fr'), 'fr')
    // Enter commits the tag; the "Add" button is ambiguous here because every
    // TagInput on the section renders one.
    await user.type(screen.getByPlaceholderText('Add stopword'), 'le{Enter}')

    await waitFor(() => {
      expect(readJson(container).invertedIndexConfig.stopwordPresets).toEqual({ fr: ['le'] })
    })

    await user.click(screen.getByRole('button', { name: /delete preset/i }))
    await waitFor(() => {
      expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
    })
  })

  it('emits nothing while a preset row is still half-typed', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection />)
    await waitForRender(container)
    await openInvertedIndex(user)

    // A named preset with no words yet is not valid schema.
    await user.click(screen.getByRole('button', { name: /add preset/i }))
    await user.type(screen.getByPlaceholderText('e.g. fr'), 'fr')

    await waitFor(() => {
      expect(readJson(container)).not.toHaveProperty('invertedIndexConfig')
    })
  })
})

// ─── Presets feeding the per-property picker ──────────────────────────────────

describe('Collection — stopword presets offered to properties', () => {
  function stopwordPresetSelect() {
    return screen.getByText('Stopword Preset').parentElement.querySelector('select')
  }

  it('offers only the built-ins when no presets are defined', async () => {
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    const values = Array.from(stopwordPresetSelect().options).map(o => o.value)
    expect(values).toEqual(['', 'en', 'none'])
  })

  it('offers imported user-defined presets alongside the built-ins', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'] }],
        invertedIndexConfig: { stopwordPresets: { fr: ['le'], de: ['der'] } },
      }} />
    )
    await waitForRender(container)

    const values = Array.from(stopwordPresetSelect().options).map(o => o.value)
    expect(values).toEqual(['', 'en', 'none', 'fr', 'de'])
  })

  it('picks up a preset added through the UI once it has a word', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    expect(Array.from(stopwordPresetSelect().options).map(o => o.value)).not.toContain('fr')

    await openInvertedIndex(user)
    await user.click(screen.getByRole('button', { name: /add preset/i }))
    await user.type(screen.getByPlaceholderText('e.g. fr'), 'fr')

    // A named but wordless preset is not serialized, so offering it here would
    // let the user point a property at a preset absent from the schema.
    expect(Array.from(stopwordPresetSelect().options).map(o => o.value)).not.toContain('fr')

    await user.type(screen.getByPlaceholderText('Add stopword'), 'le{Enter}')

    await waitFor(() => {
      expect(Array.from(stopwordPresetSelect().options).map(o => o.value)).toContain('fr')
    })
  })

  it('offers a duplicate-named preset only once', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'] }],
        invertedIndexConfig: { stopwordPresets: { fr: ['le'] } },
      }} />
    )
    await waitForRender(container)

    // Import collapses duplicates, so drive the duplicate in through the UI.
    const user = userEvent.setup()
    await openInvertedIndex(user)
    await user.click(screen.getByRole('button', { name: /add preset/i }))
    const nameInputs = screen.getAllByPlaceholderText('e.g. fr')
    await user.type(nameInputs[nameInputs.length - 1], 'fr')
    const wordInputs = screen.getAllByPlaceholderText('Add stopword')
    await user.type(wordInputs[wordInputs.length - 1], 'la{Enter}')

    // Both rows serialize, and the later one wins -- but the picker must list
    // the name once, not once per row.
    await waitFor(() => {
      expect(readJson(container).invertedIndexConfig.stopwordPresets).toEqual({ fr: ['la'] })
    })
    const values = Array.from(stopwordPresetSelect().options).map(o => o.value)
    expect(values.filter(v => v === 'fr')).toHaveLength(1)
  })

  it('does not offer a preset whose name is still blank', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    await openInvertedIndex(user)
    await user.click(screen.getByRole('button', { name: /add preset/i }))

    const values = Array.from(stopwordPresetSelect().options).map(o => o.value)
    expect(values).toEqual(['', 'en', 'none'])
  })

  it('does not duplicate a user preset that shadows a built-in', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'] }],
        invertedIndexConfig: { stopwordPresets: { en: ['custom'] } },
      }} />
    )
    await waitForRender(container)

    const values = Array.from(stopwordPresetSelect().options).map(o => o.value)
    expect(values).toEqual(['', 'en', 'none'])
  })

  it('selecting a user preset emits it on the property', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'] }],
        invertedIndexConfig: { stopwordPresets: { fr: ['le'] } },
      }} />
    )
    await waitForRender(container)

    await user.selectOptions(stopwordPresetSelect(), 'fr')

    await waitFor(() => {
      expect(readJson(container).properties[0].textAnalyzer).toEqual({ stopwordPreset: 'fr' })
    })
  })
})

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe('Collection — gse_ch round-trip', () => {
  it('survives an import unchanged', async () => {
    const { container } = render(
      <Collection initialJson={{
        class: 'Article',
        properties: [{ name: 'title', dataType: ['text'], tokenization: 'gse_ch' }],
      }} />
    )
    await waitForRender(container)

    expect(readJson(container).properties[0].tokenization).toBe('gse_ch')
  })

  it('is emitted when picked in the UI', async () => {
    const user = userEvent.setup()
    const { container } = render(<Collection initialJson={withTextProperty} />)
    await waitForRender(container)

    await user.selectOptions(tokenizationSelect(), 'gse_ch')

    await waitFor(() => {
      expect(readJson(container).properties[0].tokenization).toBe('gse_ch')
    })
  })
})
