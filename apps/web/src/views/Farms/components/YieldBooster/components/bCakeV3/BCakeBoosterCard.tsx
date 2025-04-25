import { useTranslation } from '@pancakeswap/localization'
import { Box, Link } from '@pancakeswap/uikit'

export const useBCakeTooltipContent = () => {
  const { t } = useTranslation()
  const tooltipContent = (
    <>
      <Box mb="20px">
        {t(
          'Yield Boosters allow you to boost your farming yields by locking CAKE in the veCAKE pool. The more CAKE you lock, and the longer you lock them, the higher the boost you will receive.',
        )}
      </Box>
      <Box>
        {t('To learn more, check out the')}
        <Link external href="https://medium.com/pancakeswap/introducing-bcake-farm-yield-boosters-b27b7a6f0f84">
          {t('Medium Article')}
        </Link>
      </Box>
    </>
  )
  return tooltipContent
}
