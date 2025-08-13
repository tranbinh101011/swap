import { Box } from '@pancakeswap/uikit'
import { ReactNode } from 'react'

interface NoMenuLayoutProps {
  children: ReactNode
}

const NoMenuLayout: React.FC<NoMenuLayoutProps> = ({ children }) => {
  return (
    <Box width="100%" minHeight="100vh">
      {children}
    </Box>
  )
}

export default NoMenuLayout
