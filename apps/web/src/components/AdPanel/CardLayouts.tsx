import { Box, BoxProps, getPortalRoot, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useRouter } from 'next/router'
import { cloneElement, memo, RefObject, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { SwiperRef, SwiperSlide } from 'swiper/react'
import { StyledSwiper } from './CarrouselWithSlider'
import { commonLayoutWhitelistedPages, useAdConfig, usePicksConfig } from './config'
import { shouldRenderOnPages } from './renderConditions'
import { AdPlayerProps, AdSlide } from './types'
import { useIsSlideExpanded } from './useIsSlideExpanded'
import { useShowAdPanel } from './useShowAdPanel'

const FloatingContainer = styled(Box)`
  position: fixed;
  right: 30px;
  bottom: 30px;
`

const StaticContainer = styled(Box)`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

function getTargetAndToggleAnimation(swiperRef: RefObject<SwiperRef>, pause: boolean = true): void {
  const parent = swiperRef.current as HTMLDivElement | null
  if (!parent) {
    console.warn('swiperRef.current is null or undefined')
    return
  }
  const target = parent.querySelector('.swiper-pagination-bullet-active') as HTMLDivElement | null
  if (!target) {
    console.warn('No active pagination bullet found')
    return
  }
  target.classList.toggle('pause', pause)
}

export const PickAdSlides = memo(({ forceMobile, isDismissible = true }: AdPlayerProps) => {
  const adList = usePicksConfig()
  if (!adList || adList.length < 3) return null
  return (
    <StaticContainer>
      <AdSlidesRender adList={adList} forceMobile={forceMobile} isDismissible={isDismissible} />
    </StaticContainer>
  )
})

const AdSlidesRender = ({
  adList,
  forceMobile,
  isDismissible,
}: {
  adList: AdSlide[]
  forceMobile?: boolean
  isDismissible: boolean
}) => {
  const swiperRef = useRef<SwiperRef>(null)
  const pauseAni = useCallback(() => getTargetAndToggleAnimation(swiperRef), [swiperRef])
  const resumeAni = useCallback(() => getTargetAndToggleAnimation(swiperRef, false), [swiperRef])

  const { isAnySlideExpanded, resetAllExpanded } = useIsSlideExpanded()

  const { route } = useRouter()

  useEffect(() => {
    resetAllExpanded()
  }, [route, resetAllExpanded])

  const handleResume = useCallback(() => {
    if (!isAnySlideExpanded) resumeAni()
  }, [isAnySlideExpanded, resumeAni])

  useEffect(() => {
    if (swiperRef.current) {
      if (isAnySlideExpanded) {
        swiperRef.current.swiper.autoplay.stop()

        // Disable swiping between slides when expanded
        swiperRef.current.swiper.allowTouchMove = false

        pauseAni()
      } else {
        swiperRef.current.swiper.autoplay.start()

        // Enable swiping between slides if not expanded
        swiperRef.current.swiper.allowTouchMove = true

        resumeAni()
      }
    }
  }, [isAnySlideExpanded, pauseAni, resumeAni])

  const handleSlideChange = useCallback((event: any) => {
    if (swiperRef.current) {
      const activeIndex = swiperRef.current.swiper.realIndex
      const bullets = swiperRef.current.swiper.pagination.bullets

      bullets.forEach((bullet: HTMLElement) => {
        bullet.classList.remove('played')
      })

      bullets.slice(0, activeIndex).forEach((bullet) => {
        bullet.classList.add('played')
      })
    }
  }, [])

  return (
    <StyledSwiper
      ref={swiperRef}
      effect="fade"
      spaceBetween={50}
      slidesPerView={1}
      speed={500}
      fadeEffect={{ crossFade: true }}
      autoplay={{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }}
      pagination={{ clickable: true, enabled: !isAnySlideExpanded }}
      $showPagination={!isAnySlideExpanded}
      modules={[Autoplay, Pagination, EffectFade]}
      onAutoplayPause={pauseAni}
      onAutoplayResume={handleResume}
      onSlideChange={handleSlideChange}
      loop
      observer
      id="test-swiper"
    >
      {adList.map((ad) => (
        <SwiperSlide key={ad.id}>{cloneElement(ad.component, { isDismissible, forceMobile })}</SwiperSlide>
      ))}
    </StyledSwiper>
  )
}

export const AdSlides = memo(({ forceMobile, isDismissible = true }: AdPlayerProps) => {
  const adList = useAdConfig()
  return <AdSlidesRender adList={adList} forceMobile={forceMobile} isDismissible={isDismissible} />
})

/**
 * For abstraction and use in pages where we need to
 * directly render the Ads Card purely without any conditions.
 * > Note that dismissing Ads elsewhere in the application via useShowAdPanel
 * does not affect this component's visibility.
 */
export const AdPlayer = ({ forceMobile = true, isDismissible = false, ...props }: AdPlayerProps) => {
  if (!shouldRenderOnPages(commonLayoutWhitelistedPages)) return null // Remove in future releases when we're displaying on all pages
  return <AdSlides forceMobile={forceMobile} isDismissible={isDismissible} {...props} />
}

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

interface MobileCardProps extends BoxProps, AdPlayerProps {
  shouldRender?: boolean
}
/**
 * Renders Ad banners on mobile and tablet
 */
export const MobileCard = ({
  shouldRender = true,
  isDismissible = true,
  forceMobile = false,
  ...props
}: MobileCardProps) => {
  const { isDesktop } = useMatchBreakpoints()
  const [show] = useShowAdPanel()

  return shouldRender && !isDesktop && show ? (
    <StaticContainer {...props}>
      <AdPlayer isDismissible={isDismissible} forceMobile={forceMobile} />
    </StaticContainer>
  ) : null
}
