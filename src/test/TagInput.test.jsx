/**
 * Tests for TagInput's accessible naming.
 *
 * Several of these render side by side on the Inverted Index section (stopword
 * additions, removals, and one word list per user-defined preset), so a name
 * that is unique per instance is what makes them distinguishable to assistive
 * tech -- and what lets these tests target one list without index juggling.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagInput from '../components/TagInput'

describe('TagInput — accessible names', () => {
  it('names the text field after its visible label', () => {
    render(<TagInput tags={[]} setTags={() => {}} label="Stopwords Additions" />)

    // getByLabelText resolves through htmlFor/id, so this also asserts the
    // <label> is actually associated rather than merely adjacent.
    expect(screen.getByLabelText('Stopwords Additions')).toBeTruthy()
  })

  it('gives each field a distinct id when two render together', () => {
    render(
      <>
        <TagInput tags={[]} setTags={() => {}} label="Stopwords Additions" />
        <TagInput tags={[]} setTags={() => {}} label="Stopwords Removals" />
      </>
    )

    const additions = screen.getByLabelText('Stopwords Additions')
    const removals = screen.getByLabelText('Stopwords Removals')
    expect(additions.id).toBeTruthy()
    expect(additions.id).not.toBe(removals.id)
  })

  it('names each remove button after its tag and list', async () => {
    const user = userEvent.setup()
    const setTags = vi.fn()
    render(<TagInput tags={['le', 'la']} setTags={setTags} label="Stopwords" />)

    await user.click(screen.getByRole('button', { name: 'Remove le from Stopwords' }))
    expect(setTags).toHaveBeenCalledWith(['la'])
  })

  it('names the add button after its list', () => {
    render(
      <>
        <TagInput tags={[]} setTags={() => {}} label="Stopwords Additions" />
        <TagInput tags={[]} setTags={() => {}} label="Stopwords Removals" />
      </>
    )

    expect(screen.getByRole('button', { name: 'Add to Stopwords Additions' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add to Stopwords Removals' })).toBeTruthy()
  })
})
