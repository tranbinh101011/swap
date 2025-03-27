/* eslint-disable react/no-unescaped-entities */
import { ChainId } from '@pancakeswap/chains'
import { Trans } from '@pancakeswap/localization'
import { ASSET_CDN } from 'config/constants/endpoints'
import { ReactNode } from 'react'
import type { Address } from 'viem'

export type IDOFAQs = Array<{ title: ReactNode; description: ReactNode }>

export type IDOConfig = {
  id: string
  icon: string
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
    icon: '/images/ido/myshell.png',
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
    icon: '/images/ido/bubblemaps.png',
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
        <a href="https://bubblemaps.io/" target="_blank" rel="noreferrer noopener">
          https://bubblemaps.io/
        </a>
        <br />
        <br />
        X:{' '}
        <a href="https://x.com/bubblemaps" target="_blank" rel="noreferrer noopener">
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
        <a href="https://bubblemaps.io/case-studies" target="_blank" rel="noreferrer noopener">
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
  bedrock: {
    id: 'bedrock',
    projectUrl: 'https://www.bedrock.technology/',
    icon: '/images/ido/bedrock.png',
    chainId: ChainId.BSC,
    bannerUrl: `${ASSET_CDN}/web/ido/bedrock-banner.png`,
    contractAddress: '0xA7082d7935830e476932196D241D5Db60529B4Af',
    tgeTitle: <Trans>Bedrock's Token Generation Event</Trans>,
    tgeSubtitle: <Trans>Exclusively via Binance Keyless Wallet</Trans>,
    description: (
      <>
        <Trans>
          Bedrock is a multi-asset liquid restaking protocol that enables Bitcoin staking through uniBTC. uniBTC allows
          holders to earn rewards while maintaining liquidity, unlocking new yield opportunities in Bitcoin’s 1 trillion
          market cap. With a cutting-edge approach to BTCFi 2.0, Bedrock is redefining Bitcoin’s role in DeFi — and
          extending liquid restaking across 12+ blockchains for BTC, ETH, and DePIN assets.
        </Trans>
        <br />
        <br />
        Website:{' '}
        <a href="https://www.bedrock.technology" target="_blank" rel="noreferrer noopener">
          https://www.bedrock.technology
        </a>
        <br />
        <br />
        X:{' '}
        <a href="https://x.com/Bedrock_DeFi" target="_blank" rel="noreferrer noopener">
          https://x.com/Bedrock_DeFi
        </a>
        <br />
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
    ],
  },
  particle: {
    id: 'particle',
    projectUrl: 'https://particle.network/',
    icon: '/images/ido/particle.png',
    chainId: ChainId.BSC,
    bannerUrl: `${ASSET_CDN}/web/ido/particle-banner.png`,
    contractAddress: '0x935de2dBc611F4b01b2D8b14AE5c58d940d2f719',
    tgeTitle: <Trans>Particle Network's Token Generation Event</Trans>,
    tgeSubtitle: <Trans>Exclusively via Binance Keyless Wallet</Trans>,
    description: (
      <>
        <Trans>
          Particle Network is the largest chain abstraction infrastructure for Web3. Its core technology, Universal
          Accounts, represents the solution to Web3's user, data, and liquidity fragmentation, giving users a single
          account and balance across all chains.
        </Trans>
        <Trans>
          The Particle Chain, Particle Network’s L1 blockchain, acts as the engine powering Universal Accounts. To
          showcase this innovation, Particle has already released the chain-agnostic Mainnet dApp — UniversalX. With it,
          users can trade using tokens from any chain, combining their assets across all ecosystems and paying gas with
          any token.
        </Trans>
        <br />
        <br />
        Website:{' '}
        <a href="https://particle.network/" target="_blank" rel="noreferrer noopener">
          https://particle.network/
        </a>
        <br />
        <br />
        X:{' '}
        <a href="https://x.com/ParticleNtwrk" target="_blank" rel="noreferrer noopener">
          https://x.com/ParticleNtwrk
        </a>
        <br />
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
    ],
  },
  kiloex: {
    id: 'kiloex',
    projectUrl: 'https://www.kiloex.io/',
    icon: '/images/ido/kiloex.png',
    chainId: ChainId.BSC,
    bannerUrl: `${ASSET_CDN}/web/ido/kiloex-banner.png`,
    contractAddress: '0x61222059aAC449252949B3911AC1e325966F31eC',
    tgeTitle: <Trans>KiloEx's Token Generation Event</Trans>,
    tgeSubtitle: <Trans>Exclusively via Binance Keyless Wallet</Trans>,
    description: (
      <>
        <Trans>
          KiloEx is building the next generation of user-friendly perpetual DEX fully integrated with LSTfi.
        </Trans>
        <br />
        <Trans>
          KiloEx platform provides traders with lightning-fast trades, real-time tracking of market activity, and an
          intuitive trading experience, while offering liquidity providers risk-neutral positions and LP-friendly
          solutions.
        </Trans>
        <br />
        <br />
        Website:{' '}
        <a href="https://www.kiloex.io/" target="_blank" rel="noreferrer noopener">
          https://www.kiloex.io/
        </a>
        <br />
        <br />
        X:{' '}
        <a href="https://x.com/KiloEx_perp" target="_blank" rel="noreferrer noopener">
          https://x.com/KiloEx_perp
        </a>
        <br />
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
    ],
  },
}
