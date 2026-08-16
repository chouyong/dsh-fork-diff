declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ComponentType } from 'react'

  interface IconProps {
    readonly size?: number
    readonly className?: string
  }

  export const IconBranchOutline16: ComponentType<IconProps>
  export const IconCloseOutline16: ComponentType<IconProps>
}
