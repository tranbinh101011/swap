import { Box, Button, Flex, Text } from '@pancakeswap/uikit'
import { useAccount } from 'wagmi'
import styled from 'styled-components'
import { ArrowBackIcon } from '@pancakeswap/uikit'

const StyledCowHeader = styled(Box)`
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.1) 0%, 
    rgba(139, 92, 246, 0.08) 50%, 
    rgba(168, 85, 247, 0.1) 100%
  );
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }
`

const BackButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${({ theme }) => theme.colors.text};
  padding: 10px 16px;
  height: auto;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled):not(.pancake-button--disabled):not(.pancake-button--disabled):not(:active) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const WalletAddressText = styled(Text)`
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: ${({ theme }) => theme.colors.textSubtle};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
  }
`

const CowBrandText = styled(Text)`
  font-weight: 800;
  font-size: 18px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    border-radius: 1px;
    opacity: 0.6;
  }
`

const StatusIndicator = styled(Flex)`
  align-items: center;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  padding: 6px 12px;
  gap: 8px;
`

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }
`

const StatusText = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

interface CowWalletHeaderProps {
  onBackClick?: () => void
}

export const CowWalletHeader: React.FC<CowWalletHeaderProps> = ({ onBackClick }) => {
  const { address, isConnected } = useAccount()

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      // Default behavior: redirect to COW_N assets
      window.location.href = 'http://localhost:3001/assets'
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return 'Not Connected'
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  return (
    <StyledCowHeader>
      <Flex justifyContent="space-between" alignItems="center">
        <BackButton
          variant="text"
          startIcon={<ArrowBackIcon width="18px" />}
          onClick={handleBackClick}
          scale="sm"
        >
          Back to Assets
        </BackButton>
        
        <Flex alignItems="center" flexDirection="column" gap="8px">
          <CowBrandText>COW WALLET</CowBrandText>
          
          {isConnected && address && (
            <Flex alignItems="center" gap="12px">
              <StatusIndicator>
                <StatusDot />
                <StatusText>Connected</StatusText>
              </StatusIndicator>
              
              <WalletAddressText>
                {formatAddress(address)}
              </WalletAddressText>
            </Flex>
          )}
        </Flex>
        
        {/* Placeholder for symmetry */}
        <Box width="140px" />
      </Flex>
    </StyledCowHeader>
  )
}
