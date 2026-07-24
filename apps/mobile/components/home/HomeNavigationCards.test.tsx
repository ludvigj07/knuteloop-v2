import { fireEvent, render, screen } from '@testing-library/react-native'
import { HomeCatalogCard, HomeKnutesjefCard } from './HomeNavigationCards'

describe('HomeNavigationCards', () => {
  it('opens the separate catalog and announces the real available count', () => {
    const onOpen = jest.fn()
    render(
      <HomeCatalogCard
        total={24}
        available={17}
        isLoading={false}
        hasError={false}
        onOpen={onOpen}
      />,
    )

    expect(screen.getByText('17 knuter er klare for deg.')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Åpne knutekatalogen. 17 knuter er klare for deg.'))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('uses correct bokmål when exactly one knute is available', () => {
    render(
      <HomeCatalogCard
        total={4}
        available={1}
        isLoading={false}
        hasError={false}
        onOpen={jest.fn()}
      />,
    )

    expect(screen.getByText('Én knute er klar for deg.')).toBeTruthy()
  })

  it('gives knutesjefen a calm route to the review queue', () => {
    const onOpen = jest.fn()
    render(<HomeKnutesjefCard pendingCount={2} isLoading={false} onOpen={onOpen} />)

    expect(screen.getByText('2 innsendinger venter.')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('For knutesjef. 2 innsendinger venter.'))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
