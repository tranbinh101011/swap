import { getChainNameInKebabCase } from '@pancakeswap/chains'
import { Protocol } from '@pancakeswap/farms'
import { Flex } from '@pancakeswap/uikit'
import {
  INetworkProps,
  IPoolTypeFilterProps,
  IProtocolMenuProps,
  ITokenProps,
  NetworkFilter,
  PoolTypeFilter,
  ProtocolMenu,
  TokenFilter as TokenFilterWidget,
} from '@pancakeswap/widgets-internal'
import { useActiveChainId } from 'hooks/useActiveChainId'
import isEmpty from 'lodash/isEmpty'
import isUndefined from 'lodash/isUndefined'
import React, { useMemo } from 'react'
import { UpdaterByChainId } from 'state/lists/updater'
import styled from 'styled-components'
import { usePoolTypeQuery } from 'views/AddLiquiditySelector/hooks/usePoolTypeQuery'
import { usePoolProtocols, usePoolTypes } from '../constants'
import { MAINNET_CHAINS, useAllChainsOpts } from '../hooks/useMultiChains'
import { useMultiChainsTokens } from '../hooks/useMultiChainsTokens'
import { getChainFullName } from '../utils'

const PoolsFilterContainer = styled(Flex)<{ $childrenCount: number }>`
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  & > div {
    flex: 1;
  }

  & > div:nth-child(1),
  & > div:nth-child(2) {
    width: calc(${({ $childrenCount: $childCount }) => `${100 / $childCount}%`} - 16px);
  }

  @media (min-width: 1200px) {
    & {
      flex-wrap: nowrap;
    }
  }

  @media (max-width: 967px) {
    & > div:nth-child(3),
    & > div:nth-child(4) {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 575px) {
    gap: 8px;
    & > div {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
`

export const useSelectedChainsName = (chainIds: number[]) => {
  return useMemo(() => chainIds.map((id) => getChainNameInKebabCase(id)), [chainIds])
}

export const useSelectedProtocols = (selectedIndex: number): Protocol[] => {
  const allProtocols = usePoolProtocols()
  return useMemo(() => {
    const { value } = allProtocols[selectedIndex]
    if (value === null || selectedIndex === 0 || selectedIndex > allProtocols.length - 1) {
      return allProtocols.filter((t) => t.value !== null).flatMap((t) => t.value) as NonNullable<Protocol[]>
    }
    return Array.isArray(value) ? value : [value]
  }, [selectedIndex, allProtocols])
}

export const TokenFilter = ({
  selectedNetwork,
  selectedTokens,
  ...others
}: {
  selectedNetwork: INetworkProps['value']
  selectedTokens: ITokenProps['value']
} & Omit<ITokenProps, 'data' | 'value' | 'getChainName'>) => {
  const allTokens = useMultiChainsTokens()
  const filteredTokens = useMemo(
    () => allTokens.filter((token) => selectedNetwork.includes(token.chainId)),
    [selectedNetwork, allTokens],
  )

  return <TokenFilterWidget data={filteredTokens} value={selectedTokens} getChainName={getChainFullName} {...others} />
}

export interface IPoolsFilterPanelProps {
  value: {
    selectedProtocolIndex?: IProtocolMenuProps['activeIndex']
    selectedNetwork?: INetworkProps['value']
    selectedTokens?: ITokenProps['value']
  }
  onChange: (value: Partial<IPoolsFilterPanelProps['value']>) => void
  showTokenFilter?: boolean
  showNetworkFilter?: boolean
  showPoolFilter?: boolean
  showProtocolMenu?: boolean
}
export const PoolsFilterPanel: React.FC<React.PropsWithChildren<IPoolsFilterPanelProps>> = ({
  value,
  children,
  onChange,
  showTokenFilter = true,
  showNetworkFilter = true,
  showPoolFilter = true,
  showProtocolMenu = true,
}) => {
  const { chainId: activeChainId } = useActiveChainId()
  const { selectedTokens, selectedNetwork, selectedProtocolIndex: selectedType } = value
  const allChainsOpts = useAllChainsOpts()
  const { poolType, setPoolType } = usePoolTypeQuery()

  const handleProtocolIndexChange: IProtocolMenuProps['onChange'] = (index) => {
    onChange({ selectedProtocolIndex: index })
  }

  const handlePoolFeatureChange: IPoolTypeFilterProps['onChange'] = (e) => {
    setPoolType(e.value)
  }

  const handleNetworkChange: INetworkProps['onChange'] = (network, e) => {
    if (isEmpty(e.value)) {
      e.preventDefault()
      onChange({ selectedNetwork: [activeChainId] })
    } else {
      onChange({ selectedNetwork: network })
    }
  }

  const handleTokensChange: ITokenProps['onChange'] = (e) => {
    onChange({ selectedTokens: e.value })
  }

  const protocols = usePoolProtocols()
  const poolTypeData = usePoolTypes()

  const childrenCount = useMemo(() => 3 + React.Children.count(children), [children])

  return (
    <>
      {MAINNET_CHAINS.map((c) => (
        <UpdaterByChainId key={c.id} chainId={c.id} />
      ))}
      <PoolsFilterContainer $childrenCount={childrenCount}>
        {showNetworkFilter && !isUndefined(selectedNetwork) && (
          <NetworkFilter data={allChainsOpts} value={selectedNetwork} onChange={handleNetworkChange} />
        )}
        {showTokenFilter && !isUndefined(selectedNetwork) && (
          <TokenFilter
            selectedNetwork={selectedNetwork}
            selectedTokens={selectedTokens}
            onChange={handleTokensChange}
          />
        )}
        {showPoolFilter && <PoolTypeFilter data={poolTypeData} value={poolType} onChange={handlePoolFeatureChange} />}
        {showProtocolMenu && !isUndefined(selectedType) && (
          <Flex alignSelf="flex-start">
            <ProtocolMenu data={protocols} activeIndex={selectedType} onChange={handleProtocolIndexChange} />
          </Flex>
        )}
        {children}
      </PoolsFilterContainer>
    </>
  )
}
