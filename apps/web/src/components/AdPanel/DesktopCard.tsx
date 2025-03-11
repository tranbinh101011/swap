import { Box, getPortalRoot, useMatchBreakpoints } from '@pancakeswap/uikit'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { AdPlayer } from './AdPlayer'
import { AdPlayerProps } from './types'
import { useShowAdPanel } from './useShowAdPanel'

interface DesktopCardProps extends AdPlayerProps {
  shouldRender?: boolean
}
/**
 * Renders floating Ad banners on desktop
 */
export const DesktopCard = ({
  shouldRender = true,
  isDismissible = true,
  forceMobile = false,
  ...props
}: DesktopCardProps) => {
  const portalRoot = getPortalRoot()
  const { isDesktop } = useMatchBreakpoints()
  const [show] = useShowAdPanel()

  return portalRoot && shouldRender && isDesktop && show
    ? createPortal(
        <FloatingContainer>
          <AdPlayer isDismissible={isDismissible} forceMobile={forceMobile} {...props} />
        </FloatingContainer>,
        portalRoot,
      )
    : null
}

const FloatingContainer = styled(Box)`
  position: fixed;
  right: 30px;
  bottom: 30px;
`
