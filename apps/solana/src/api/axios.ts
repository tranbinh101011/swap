import { parseUserAgent } from 'react-device-detect'
import { updateReqHistory } from '@pancakeswap/solana-core-sdk'
import axios from 'axios'
import { toastSubject } from '@/hooks/toast/useGlobalToast'
import { isLocal } from '@/utils/common'
import { useAppStore } from '@/store'

const axiosInstance = axios.create({ timeout: 60 * 1000 })
export const retryCount = 5
export const skipRetryStatus = new Set([400, 403, 404, 500])
const logCount = 800

const isSkipLogs = (url?: string) => url?.includes('birdeye')

interface EventTypeNetworkError {
  url: string
  errorMsg: string
}

export const sendNetworkEvent = async (props: EventTypeNetworkError) => {
  if (isLocal()) return
  try {
    const deviceInfo = parseUserAgent(window.navigator.userAgent)
    const deviceType = deviceInfo.device.type || 'pc'
    axios.post(
      `${useAppStore.getState().urlConfigs.MONITOR_BASE_HOST}/event`,
      {
        type: 'networkError',
        deviceType,
        ...props
      },
      { skipError: true }
    )
  } catch {
    console.log('send network event error')
  }
}

axiosInstance.interceptors.response.use(
  (response) => {
    // 2xx
    const { config, data, status } = response
    const { url } = config

    if (!isSkipLogs(url)) {
      try {
        updateReqHistory({
          status,
          url: url || '',
          params: config.params,
          data: {
            id: data.id,
            success: data.success
          },
          logCount
        })
      } catch {
        // empty
      }
    }

    return data
  },
  (error) => {
    // https://axios-http.com/docs/handling_errors
    // not 2xx
    const { config, response = {} } = error
    const { status } = response
    const { url } = config

    console.error(`axios request error: ${url}, status:${status || error.code}, msg:${response.message || error.message}`)
    if (!url.includes('monitor'))
      sendNetworkEvent({
        url,
        errorMsg: response.message || error.message
      })
    if (!isSkipLogs(url)) {
      try {
        updateReqHistory({
          status,
          url,
          params: config.params,
          data: {
            id: response.data?.id,
            success: error.message
          },
          logCount
        })
      } catch {
        // empty
      }
    }

    if (!config.skipError)
      toastSubject.next({
        title: 'API request error',
        description: `axios request error: ${url}, status:${status || error.code}, msg:${response.message || error.message}`,
        status: 'error'
      })

    return Promise.reject(error)
  }
)

export default axiosInstance
