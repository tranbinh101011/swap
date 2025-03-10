import dynamic from 'next/dynamic'

// Dynamically import components
const BodyText = dynamic(() => import('./BodyText').then((mod) => mod.BodyText))
const Button = dynamic(() => import('./Button').then((mod) => mod.AdButton)) // Ensure to reference AdButton correctly
const Card = dynamic(() => import('./Card').then((mod) => mod.AdCard)) // Ensure to reference AdCard correctly
const AdPlayer = dynamic(() => import('./CardLayouts').then((mod) => mod.AdPlayer))
const DesktopCard = dynamic(() => import('./CardLayouts').then((mod) => mod.DesktopCard))
const MobileCard = dynamic(() => import('./CardLayouts').then((mod) => mod.MobileCard))
const AdsSlides = dynamic(() => import('./CardLayouts').then((mod) => mod.AdSlides))
const PicksAdsSlides = dynamic(() => import('./CardLayouts').then((mod) => mod.PickAdSlides))

export const AdPanel = {
  DesktopCard,
  MobileCard,
  AdPlayer,
  Card,
  BodyText,
  Button,
  AdsSlides,
  PicksAdsSlides,
}
