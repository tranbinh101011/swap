import { useTooltip } from '@pancakeswap/uikit'
import React from 'react'
import { stringify } from 'viem'

export const PositionDebugView: React.FC<React.PropsWithChildren<{ json: unknown }>> = ({ children, json }) => {
  const { targetRef, tooltipVisible, tooltip } = useTooltip(
    <pre>
      {stringify(
        json,
        (k, v) => {
          if (React.isValidElement(v)) return 'ReactElement'
          return v
        },
        2,
      )}
    </pre>,
    {},
  )

  if (!(window?.location?.hostname === 'localhost' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview')) return children

  return (
    <div ref={targetRef}>
      {children}
      {tooltipVisible && tooltip}
    </div>
  )
}
