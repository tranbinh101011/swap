import dynamic from 'next/dynamic'
import UniversalFarmsPage from './pools'

export default dynamic(() => Promise.resolve(UniversalFarmsPage), {
  ssr: false,
})
