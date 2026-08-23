import { fireEvent, render, screen } from '@testing-library/react-native'
import { Pressable } from './Pressable'
import { Text } from './Text'

describe('Pressable', () => {
  it('renders children and calls onPress', () => {
    const onPress = jest.fn()
    render(
      <Pressable onPress={onPress} accessibilityLabel="Lik">
        <Text>Lik</Text>
      </Pressable>,
    )

    fireEvent.press(screen.getByLabelText('Lik'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(
      <Pressable onPress={onPress} accessibilityLabel="Lik" disabled>
        <Text>Lik</Text>
      </Pressable>,
    )

    fireEvent.press(screen.getByLabelText('Lik'))
    expect(onPress).not.toHaveBeenCalled()
  })

  // A small icon button must stay visually small but still be tappable at the
  // 44px minimum. The shortfall is given back as hitSlop, never as layout.
  describe('minimum tap target', () => {
    const layout = (width: number, height: number) => ({
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    })

    it('expands the hit area of an element smaller than 44x44', () => {
      render(
        <Pressable onPress={jest.fn()} accessibilityLabel="Lukk">
          <Text>x</Text>
        </Pressable>,
      )

      const el = screen.getByLabelText('Lukk')
      fireEvent(el, 'layout', layout(24, 24))

      // (44 - 24) / 2 = 10 on every side.
      expect(el.props.hitSlop).toEqual({ top: 10, bottom: 10, left: 10, right: 10 })
    })

    it('expands only the axis that falls short', () => {
      render(
        <Pressable onPress={jest.fn()} accessibilityLabel="Filter">
          <Text>Alle</Text>
        </Pressable>,
      )

      const el = screen.getByLabelText('Filter')
      fireEvent(el, 'layout', layout(120, 32))

      expect(el.props.hitSlop).toEqual({ top: 6, bottom: 6, left: 0, right: 0 })
    })

    it('adds no hit area when the element already meets the minimum', () => {
      render(
        <Pressable onPress={jest.fn()} accessibilityLabel="Send inn">
          <Text>Send inn</Text>
        </Pressable>,
      )

      const el = screen.getByLabelText('Send inn')
      fireEvent(el, 'layout', layout(200, 48))

      expect(el.props.hitSlop).toBeUndefined()
    })

    it('lets an explicit hitSlop win over the automatic one', () => {
      render(
        <Pressable onPress={jest.fn()} accessibilityLabel="Tett" hitSlop={2}>
          <Text>x</Text>
        </Pressable>,
      )

      const el = screen.getByLabelText('Tett')
      fireEvent(el, 'layout', layout(20, 20))

      expect(el.props.hitSlop).toBe(2)
    })

    it('still forwards onLayout to the caller', () => {
      const onLayout = jest.fn()
      render(
        <Pressable onPress={jest.fn()} accessibilityLabel="Mål" onLayout={onLayout}>
          <Text>x</Text>
        </Pressable>,
      )

      fireEvent(screen.getByLabelText('Mål'), 'layout', layout(20, 20))
      expect(onLayout).toHaveBeenCalledTimes(1)
    })
  })
})
