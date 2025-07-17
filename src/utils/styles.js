import { css } from 'styled-components'
import { every } from 'lodash'

export const withModifiers = (...modifiers) => (...styles) => props => {
  const match = every(modifiers, modifier => props[modifier])
  if (!match) return null
  return css(...styles)
}
