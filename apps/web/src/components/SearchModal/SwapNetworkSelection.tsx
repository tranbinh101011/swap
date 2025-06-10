import { ChainId } from '@pancakeswap/chains'
import { useTranslation } from '@pancakeswap/localization'
import {
  ArrowDropDownIcon,
  AutoColumn,
  AutoRow,
  Flex,
  InlineMenu,
  SkeletonText,
  Text,
  appearAnimation,
} from '@pancakeswap/uikit'
import { ChainLogo } from '@pancakeswap/widgets-internal'
import { useActiveChainId } from 'hooks/useActiveChainId'
import drop from 'lodash/drop'
import take from 'lodash/take'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { styled } from 'styled-components'
import { chainNameConverter } from 'utils/chainNameConverter'
import { chains as evmChains } from 'utils/wagmi'
import { useBridgeAvailableChains } from 'views/Swap/Bridge/hooks'
import { BaseWrapper, ButtonWrapper, RowWrapper } from './CommonBases'

const NetworkMenuColumn = styled(Flex)`
  flex-direction: column;
  overflow: hidden;

  background-color: ${({ theme }) => theme.colors.input};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.radii.card};

  animation: ${appearAnimation} 0.2s ease;
`

// Constants for width calculations
const CONTAINER_MAX_WIDTH = 370
const CHAIN_BUTTON_WIDTH = 42
const CHAIN_BUTTON_MARGIN = 4
const HIDDEN_CHAINS_BUTTON_WIDTH = CHAIN_BUTTON_WIDTH
const CHAIN_LOGO_WIDTH = 24
const CHAIN_BUTTON_HEIGHT = 40

const ChainOption = styled(Flex)`
  padding: 8px 16px;
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.background};
  }
  transition: background-color 0.15s;
`

// Wrap BaseWrapper with a div that can handle the transition
const AnimatedWrapperDiv = styled.div<{ $width?: number }>`
  transition: width 0.3s ease;
  width: ${({ $width }) => ($width ? `${$width}px` : 'auto')};
  overflow: hidden;
  display: flex;
  align-items: center;
`

export default function SwapNetworkSelection({
  chainId,
  onSelect,
  isDependent,
}: {
  isDependent?: boolean
  chainId?: ChainId
  onSelect: (chainId: ChainId) => void
}) {
  const { chainId: activeChainId } = useActiveChainId()

  const usedChainId = chainId ?? activeChainId

  const { chains: supportedBridgeChains, loading: supportedBridgeChainsLoading } = useBridgeAvailableChains({
    originChainId: isDependent ? activeChainId : usedChainId,
  })

  const { t } = useTranslation()

  const supportedChains = useMemo(() => {
    if (isDependent) {
      return evmChains.filter((chain) => chain.id === usedChainId || supportedBridgeChains.includes(chain.id))
    }

    return evmChains.filter((chain) => {
      if ('testnet' in chain && chain.testnet && chain.id !== ChainId.MONAD_TESTNET) {
        return false
      }

      return true
    })
  }, [supportedBridgeChains, usedChainId, isDependent])

  const selectedChain = useMemo(
    () => supportedChains.find((chain) => chain.id === usedChainId),
    [usedChainId, supportedChains],
  )

  const selectedChainRef = useRef<HTMLDivElement>(null)
  const selectedTextRef = useRef<HTMLDivElement>(null)
  const [selectedChainWidth, setSelectedChainWidth] = useState(0)
  const [wrapperWidth, setWrapperWidth] = useState(0)

  // Measure the width of the selected chain button dynamically based on text content
  useLayoutEffect(() => {
    if (selectedChainRef.current && selectedTextRef.current) {
      const textWidth = selectedTextRef.current.getBoundingClientRect().width
      // Add 4px to make logo size 24px consistent with other logos
      const totalWidth = CHAIN_LOGO_WIDTH + textWidth + 4
      setSelectedChainWidth(totalWidth + CHAIN_BUTTON_MARGIN)
      setWrapperWidth(totalWidth)
    }
  })

  const [_, shownChains, hiddenChains] = useMemo(() => {
    const filtered = supportedChains.filter((chain) => {
      if (chain.id === usedChainId) return false
      return true
    })

    // Calculate available width and how many chains can fit
    const availableWidth = CONTAINER_MAX_WIDTH - selectedChainWidth - HIDDEN_CHAINS_BUTTON_WIDTH - CHAIN_BUTTON_MARGIN
    const chainsToShow = Math.max(1, Math.floor(availableWidth / (CHAIN_BUTTON_WIDTH + CHAIN_BUTTON_MARGIN)))

    // Prioritize BSC, BASE, and ARB chains
    const prioritizedChains = [ChainId.BSC, ChainId.BASE, ChainId.ARBITRUM_ONE]

    // Sort the filtered chains to have priority chains first
    const sortedFiltered = [...filtered].sort((a, b) => {
      const aIsPriority = prioritizedChains.includes(a.id)
      const bIsPriority = prioritizedChains.includes(b.id)

      if (aIsPriority && !bIsPriority) return -1
      if (!aIsPriority && bIsPriority) return 1

      // If both are priority chains, sort by the order in prioritizedChains array
      if (aIsPriority && bIsPriority) {
        return prioritizedChains.indexOf(a.id) - prioritizedChains.indexOf(b.id)
      }

      return 0
    })

    return [filtered, take(sortedFiltered, chainsToShow), drop(sortedFiltered, chainsToShow)]
  }, [supportedChains, usedChainId, selectedChainWidth])

  return (
    <AutoColumn gap="sm" style={{ maxWidth: `${CONTAINER_MAX_WIDTH}px` }}>
      <AutoRow>
        <Text color="textSubtle" fontSize="14px">
          {t('Network')}
        </Text>
      </AutoRow>
      <RowWrapper>
        <SkeletonText
          loading={supportedBridgeChainsLoading}
          initialWidth={CONTAINER_MAX_WIDTH}
          initialHeight={CHAIN_BUTTON_HEIGHT}
        >
          {selectedChain ? (
            <ButtonWrapper style={{ marginRight: `${CHAIN_BUTTON_MARGIN}px` }} ref={selectedChainRef}>
              <BaseWrapper style={{ height: `${CHAIN_BUTTON_HEIGHT}px` }} id="selected-chain-wrapper" disable>
                <AnimatedWrapperDiv $width={wrapperWidth}>
                  <ChainLogo
                    chainId={selectedChain.id}
                    imageStyles={{
                      borderRadius: '35%',
                    }}
                    style={{
                      position: 'relative',
                      top: '4px',
                    }}
                    pl="4px"
                  />
                  <Text color="inherit" px="6px" ref={selectedTextRef} bold>
                    {chainNameConverter(selectedChain.name)}
                  </Text>
                </AnimatedWrapperDiv>
              </BaseWrapper>
            </ButtonWrapper>
          ) : null}

          {shownChains.map((chain) => {
            return (
              <ButtonWrapper
                key={`buttonNetworkSelect#${chain.id}`}
                style={{ marginRight: `${CHAIN_BUTTON_MARGIN}px`, height: `${CHAIN_BUTTON_HEIGHT}px` }}
              >
                <BaseWrapper onClick={() => onSelect(chain.id)} style={{ height: `${CHAIN_BUTTON_HEIGHT}px` }}>
                  <ChainLogo
                    imageStyles={{
                      borderRadius: '35%',
                    }}
                    chainId={chain.id}
                    px="4px"
                    pt="5px"
                  />
                </BaseWrapper>
              </ButtonWrapper>
            )
          })}

          {hiddenChains.length > 0 && (
            <InlineMenu
              component={
                <ButtonWrapper style={{ marginRight: 0, width: `${CHAIN_BUTTON_WIDTH + 8}px` }}>
                  <BaseWrapper style={{ height: `${CHAIN_BUTTON_HEIGHT}px` }}>
                    <Text color="textSubtle" bold pl="6px">
                      +{hiddenChains.length}
                    </Text>
                    <ArrowDropDownIcon color="textSubtle" width="22px" height="22px" ml="-1px" />
                  </BaseWrapper>
                </ButtonWrapper>
              }
            >
              <NetworkMenuColumn>
                {hiddenChains.map((chain) => {
                  return (
                    <ChainOption key={`buttonNetworkSelect#${chain.id}`} onClick={() => onSelect(chain.id)} pb="8px">
                      <ChainLogo
                        chainId={chain.id}
                        px="4px"
                        imageStyles={{
                          borderRadius: '35%',
                        }}
                        pt="2px"
                      />
                      <Text color="inherit" px="6px">
                        {chainNameConverter(chain.name)}
                      </Text>
                    </ChainOption>
                  )
                })}
              </NetworkMenuColumn>
            </InlineMenu>
          )}
        </SkeletonText>
      </RowWrapper>
    </AutoColumn>
  )
}
