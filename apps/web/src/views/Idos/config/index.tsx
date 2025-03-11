/* eslint-disable react/no-unescaped-entities */
import { ChainId } from '@pancakeswap/chains'
import { Trans } from '@pancakeswap/localization'
import { ASSET_CDN } from 'config/constants/endpoints'
import { ReactNode } from 'react'
import type { Address } from 'viem'

export type IDOFAQs = Array<{ title: ReactNode; description: ReactNode }>

export type IDOConfig = {
  id: string
  projectUrl: string
  chainId: ChainId
  bannerUrl: string
  tgeTitle: ReactNode
  tgeSubtitle: ReactNode
  description: ReactNode
  contractAddress: Address
  faqs?: IDOFAQs
}

export const idoConfigDict: Record<string, IDOConfig> = {
  myshell: {
    id: 'myshell',
    projectUrl: 'https://myshell.ai/',
    chainId: ChainId.BSC,
    bannerUrl: `${ASSET_CDN}/web/ido/myshell-banner.png`,
    contractAddress: '0x0D54115eF8474C48103A1e3b41464BF3dB00E4B2',
    tgeTitle: <Trans>MyShell's Token Generation Event</Trans>,
    tgeSubtitle: <Trans>Exclusively via Binance Keyless Wallet</Trans>,
    description: (
      <Trans>
        MyShell is an AI creator platform for everyone to build, share, and own AI agents. Our vision is to create a
        unified platform that provides product-driven value for web2 users and offers the crypto community participating
        ownership in practical AI applications, bridging the gap between frontier AI applications and blockchain
        technology.
      </Trans>
    ),
  },
  bubblemaps: {
    id: 'bubblemaps',
    projectUrl: 'https://bubblemaps.io/',
    chainId: ChainId.BSC,
    bannerUrl: `${ASSET_CDN}/web/ido/bubblemaps-banner.png`,
    contractAddress: '0xb330A50d27341730b7B3fD285B150e5742C3b090',
    tgeTitle: <Trans>Bubblemaps's Token Generation Event</Trans>,
    tgeSubtitle: <Trans>Exclusively via Binance Keyless Wallet</Trans>,
    description: (
      <>
        <Trans>
          Bubblemaps is a crypto analytical tool turning blockchain data into a powerful visual experience. It shows
          connections between a token’s holders and helps identify team wallets, VCs, and insiders—making it easier to
          understand the tokenomics and spot potential risks.
        </Trans>
        <br />
        <br />
        Website:{' '}
        <a href="https://bubblemaps.io/" target="_blank" rel="noreferrer">
          https://bubblemaps.io/
        </a>
        <br />
        <br />
        X:{' '}
        <a href="https://x.com/bubblemaps" target="_blank" rel="noreferrer">
          https://x.com/bubblemaps
        </a>
        <br />
        <br />
        <Trans> What can Bubblemaps do? </Trans>
        <br />
        <Trans>
          Investigate wallets, reveal connections, and see through the noise of blockchain data. For more detailed case
          studies of Bubblemaps capabilities, please refer to the following link:
        </Trans>{' '}
        <a href="https://bubblemaps.io/case-studies" target="_blank" rel="noreferrer">
          https://bubblemaps.io/case-studies
        </a>
      </>
    ),
    faqs: [
      {
        title: <Trans>1. When can I claim my tokens?</Trans>,
        description: (
          <>
            <Trans>
              You can claim your tokens immediately once the TGE ends by clicking the Claim button. Alternatively, you
              can return to the TGE page at any time afterward to claim your tokens—there is no fixed claim period.
            </Trans>
            <Trans>On the TGE page, you will also find key details, including:</Trans>
            <ul>
              <li>
                <Trans>The number of tokens available for claiming</Trans>
              </li>
              <li>
                <Trans>The TGE duration</Trans>
              </li>
              <li>
                <Trans>The total amount of BNB subscribed</Trans>
              </li>
              <li>
                <Trans>The total amount of refunded BNB (if applicable)</Trans>
              </li>
              <li>
                <Trans>The TGE status (e.g., oversubscribed or not)</Trans>
              </li>
            </ul>
          </>
        ),
      },
      {
        title: <Trans>2. How many tokens will I receive?</Trans>,
        description: (
          <Trans>
            During the TGE, users can subscribe up to a maximum of 3 BNB. The final token allocation is determined based
            on the proportion of BNB a user contributed relative to the total BNB subscribed by all participants at the
            time the sale ends.
          </Trans>
        ),
      },
      {
        title: <Trans>3. Will I receive a refund if the pool is oversubscribed?</Trans>,
        description: (
          <Trans>
            Yes. If the TGE is oversubscribed, any excess BNB that was not used to purchase tokens will be automatically
            refunded to your wallet when you claim your tokens.
          </Trans>
        ),
      },
      {
        title: <Trans>4. Which regions or countries are restricted from participating in this event?</Trans>,
        description: (
          <>
            <Trans>
              The following nationalities are currently not eligible to participate in Binance-exclusive TGEs:
            </Trans>
            <ul>
              <li>
                <b>
                  <Trans>Binance Wallet users</Trans>
                </b>{' '}
                <Trans>
                  from the following nationalities are currently not eligible to participate in this event: United
                  States, Poland, Belgium, Kazakhstan, Bahrain, UAE, Australia, Japan, New Zealand, Argentina, Brazil,
                  Colombia, Sweden, Indonesia, Thailand, Canada, Iran, Cuba, North Korea, Syria, Russia, Ukraine,
                  Belarus.
                </Trans>
              </li>
              <li>
                <b>
                  <Trans>PancakeSwap users</Trans>
                </b>{' '}
                <Trans>
                  from the following nationalities are currently not eligible to participate in this event: Belarus,
                  Myanmar, Côte d'Ivoire, Cuba, Iran, Iraq, Liberia, Sudan, Syria, Zimbabwe, Congo (Kinshasa), North
                  Korea.
                </Trans>
              </li>
            </ul>
            <br />
            <Trans>Please ensure you comply with the eligibility requirements before participating.</Trans>
          </>
        ),
      },
    ],
  },
}
