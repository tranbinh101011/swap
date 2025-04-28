import { useTranslation } from '@pancakeswap/localization'
import { Button, FlexGap } from '@pancakeswap/uikit'
import { useCallback, useState } from 'react'

import styled from 'styled-components'

const TabsContainer = styled(FlexGap).attrs({ flexWrap: 'wrap', gap: '4px' })`
  background-color: ${({ theme }) => theme.colors.input};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 1px;

  width: fit-content;

  box-shadow: ${({ theme }) => theme.shadows.inset};
`

const Tab = styled(Button).attrs(({ $isActive }) => ({ scale: 'sm', variant: $isActive ? 'subtle' : 'light' }))<{
  $isActive?: boolean
}>`
  height: 32px;
  font-size: 14px;
  padding: 0 12px;
`

interface TabMenuProps {
  tabs?: string[]
  defaultTab?: string
  onTabChange?: (tab: string) => void
}

export const TabMenu = ({ tabs = ['3m', '6m', '1Y', 'All'], defaultTab = '3m', onTabChange }: TabMenuProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      onTabChange?.(tab)
    },
    [onTabChange],
  )

  return (
    <TabsContainer role="tablist" aria-label={t('Select a tab')}>
      {tabs.map((tab) => (
        <Tab
          role="tab"
          id={`tab-${tab}`}
          key={tab}
          $isActive={tab === activeTab}
          aria-selected={tab === activeTab}
          aria-controls={`tabpanel-${tab}`}
          onClick={() => handleTabChange(tab)}
        >
          {tab}
        </Tab>
      ))}
    </TabsContainer>
  )
}
