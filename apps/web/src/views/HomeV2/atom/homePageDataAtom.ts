import { atom } from 'jotai'
import { HomePageData } from 'pages/api/home/types'

export const homePageDataAtom = atom(async () => {
  const resp = await fetch('/api/home')
  const data = await resp.json()
  return data as HomePageData
})
