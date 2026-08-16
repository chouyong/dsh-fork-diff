import type { ComponentPropsWithoutRef } from 'react'

type SvgProps = ComponentPropsWithoutRef<'svg'> & { readonly size?: number }

export function IconBranchOutline16({ size = 16, ...props }: SvgProps) {
  return <svg data-icon="branch" width={size} height={size} {...props} />
}

export function IconCloseOutline16({ size = 16, ...props }: SvgProps) {
  return <svg data-icon="close" width={size} height={size} {...props} />
}
