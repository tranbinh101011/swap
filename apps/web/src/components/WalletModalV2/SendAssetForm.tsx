import { ChainId, getChainName } from '@pancakeswap/chains'
import { useDebounce } from '@pancakeswap/hooks'
import { useTranslation } from '@pancakeswap/localization'
import { Percent, Token } from '@pancakeswap/sdk'
import {
  AutoRenewIcon,
  BalanceInput,
  Box,
  Button,
  CloseIcon,
  FlexGap,
  IconButton,
  Input,
  LazyAnimatePresence,
  Text,
  domAnimation,
  useToast,
} from '@pancakeswap/uikit'
import tryParseAmount from '@pancakeswap/utils/tryParseAmount'
import { SwapUIV2 } from '@pancakeswap/widgets-internal'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { ToastDescriptionWithTx } from 'components/Toast'
import { ASSET_CDN } from 'config/constants/endpoints'
import { BalanceData } from 'hooks/useAddressBalance'
import useCatchTxError from 'hooks/useCatchTxError'
import { useERC20 } from 'hooks/useContract'
import { useCurrencyUsdPrice } from 'hooks/useCurrencyUsdPrice'
import useNativeCurrency from 'hooks/useNativeCurrency'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { formatUnits, isAddress, zeroAddress } from 'viem'
import { useUserInsufficientBalanceLight } from 'views/SwapSimplify/hooks/useUserInsufficientBalance'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { ActionButton } from './ActionButton'
import SendTransactionFlow from './SendTransactionFlow'
import { ViewState } from './type'

const FormContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const AssetContainer = styled(Box)`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
`

const ChainIconWrapper = styled(Box)`
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`

// No longer need these styled components since we're using CurrencyInputPanelSimplify

const AddressInputWrapper = styled(Box)`
  margin-bottom: 4px;
`

const ClearButton = styled(IconButton)`
  width: 20px;
  height: 20px;
`

const ErrorMessage = styled(Text)`
  color: ${({ theme }) => theme.colors.failure};
  font-size: 14px;
`

export interface SendAssetFormProps {
  asset: BalanceData
  onViewStateChange: (viewState: ViewState) => void
  viewState: ViewState
}

export const SendAssetForm: React.FC<SendAssetFormProps> = ({ asset, onViewStateChange, viewState }) => {
  const { t } = useTranslation()
  const [address, setAddress] = useState<string | null>(null)
  const debouncedAddress = useDebounce(address, 500)
  const [amount, setAmount] = useState('')
  const [addressError, setAddressError] = useState('')
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null)
  const [estimatedFeeUsd, setEstimatedFeeUsd] = useState<string | null>(null)
  const [isInputFocus, setIsInputFocus] = useState(false)

  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const { address: accountAddress } = useAccount()
  const publicClient = usePublicClient({ chainId: asset.chainId })
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: attemptingTxn } = useCatchTxError()

  // Get native currency for fee calculation
  const nativeCurrency = useNativeCurrency(asset.chainId)
  const { data: nativeCurrencyPrice } = useCurrencyUsdPrice(nativeCurrency)
  const currency = useMemo(
    () =>
      asset.token.address === zeroAddress
        ? nativeCurrency
        : new Token(
            asset.chainId,
            asset.token.address as `0x${string}`,
            asset.token.decimals,
            asset.token.symbol,
            asset.token.name,
          ),
    [asset, nativeCurrency],
  )

  const tokenBalance = tryParseAmount(asset.quantity, currency)

  const maxAmountInput = useMemo(() => maxAmountSpend(tokenBalance), [tokenBalance])
  const isNativeToken = asset.token.address === zeroAddress
  const erc20Contract = useERC20(asset.token.address as `0x${string}`, { chainId: asset.chainId })
  const { sendTransactionAsync } = useSendTransaction()

  const estimateTransactionFee = useCallback(async () => {
    if (!address || !amount || !publicClient || !accountAddress) return

    try {
      let gasEstimate: bigint = 0n

      if (isNativeToken) {
        // For native token, estimate gas for a simple transfer
        gasEstimate =
          (await publicClient.estimateGas({
            account: accountAddress,
            to: address as `0x${string}`,
            value: tryParseAmount(amount, currency)?.quotient ?? 0n,
          })) ?? 0n
      } else {
        // For ERC20 tokens, estimate gas for a transfer call
        const transferData = {
          to: address as `0x${string}`,
          amount: tryParseAmount(amount, currency)?.quotient ?? 0n,
        }
        gasEstimate =
          (await erc20Contract?.estimateGas?.transfer([transferData.to, transferData.amount], {
            account: erc20Contract.account!,
          })) ?? 0n
      }

      // Get gas price
      const gasPrice = await publicClient.getGasPrice()

      // Calculate fee
      const fee = gasEstimate * gasPrice

      // Convert to readable format (in native token units)
      const formattedFee = formatUnits(fee, 18)

      setEstimatedFee(formattedFee)

      // Calculate USD value if price is available
      if (nativeCurrencyPrice) {
        const feeUsd = parseFloat(formattedFee) * nativeCurrencyPrice
        setEstimatedFeeUsd(feeUsd.toFixed(2))
      } else {
        setEstimatedFeeUsd(null)
      }
    } catch (error) {
      console.error('Error estimating fee:', error)
      setEstimatedFee(null)
      setEstimatedFeeUsd(null)
    }
  }, [
    address,
    amount,
    publicClient,
    accountAddress,
    isNativeToken,
    currency,
    asset.token.address,
    nativeCurrencyPrice,
    erc20Contract,
  ])

  const sendAsset = useCallback(async () => {
    const amounts = tryParseAmount(amount, currency)

    const receipt = await fetchWithCatchTxError(async () => {
      if (isNativeToken) {
        // Handle native token transfer
        return sendTransactionAsync({
          to: address as `0x${string}`,
          value: amounts?.quotient ?? 0n,
          chainId: asset.chainId,
        })
      }
      // Handle ERC20 token transfer
      return erc20Contract?.write?.transfer([address as `0x${string}`, amounts?.quotient ?? 0n], {
        account: erc20Contract.account!,
        chain: erc20Contract.chain!,
      })
    })

    if (receipt?.status) {
      setTxHash(receipt.transactionHash)
      toastSuccess(
        `${t('Transaction Submitted')}!`,
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your %symbol% has been sent to %address%', {
            symbol: currency?.symbol,
            address: `${address?.slice(0, 8)}...${address?.slice(-8)}`,
          })}
        </ToastDescriptionWithTx>,
      )
      // Reset form after successful transaction
      setAmount('')
      setAddress('')
    }

    return receipt
  }, [
    address,
    amount,
    erc20Contract,
    isNativeToken,
    sendTransactionAsync,
    asset.chainId,
    asset.token.symbol,
    fetchWithCatchTxError,
    t,
    toastSuccess,
    currency,
  ])

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
  }

  // Use debounced address for validation to avoid checking on every keystroke
  useEffect(() => {
    if (debouncedAddress && !isAddress(debouncedAddress)) {
      setAddressError(t('Invalid wallet address'))
    } else {
      setAddressError('')
    }
  }, [debouncedAddress, t])

  const handleClearAddress = () => {
    setAddress('')
    setAddressError('')
  }

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value)
    },
    [currency],
  )

  const handleUserInputBlur = useCallback(() => {
    setTimeout(() => setIsInputFocus(false), 300)
  }, [])

  const handlePercentInput = useCallback(
    (percent: number) => {
      if (maxAmountInput) {
        handleAmountChange(maxAmountInput.multiply(new Percent(percent, 100)).toExact())
      }
    },
    [maxAmountInput, handleAmountChange],
  )

  const handleMaxInput = useCallback(() => {
    handlePercentInput(100)
  }, [handlePercentInput])

  const isInsufficientBalance = useUserInsufficientBalanceLight(currency, tokenBalance, amount)

  const chainName = asset.chainId === ChainId.BSC ? 'BNB' : getChainName(asset.chainId)
  const price = asset.price?.usd ?? 0

  // Effect to estimate fee when address and amount are valid
  useEffect(() => {
    if (address && amount && !addressError) {
      estimateTransactionFee()
    } else {
      setEstimatedFee(null)
    }
  }, [address, amount, addressError, estimateTransactionFee])

  const renderConfirmationModal = () => {
    return (
      <SendTransactionFlow
        asset={asset}
        amount={amount}
        recipient={address as string}
        onDismiss={() => {
          onViewStateChange(ViewState.SEND_ASSETS)
          setTxHash(undefined)
        }}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        chainId={asset.chainId}
        estimatedFee={estimatedFee}
        estimatedFeeUsd={estimatedFeeUsd}
        onConfirm={async () => {
          // Submit the transaction using the improved error handling
          const receipt = await sendAsset()
          if (receipt?.status) {
            onViewStateChange(ViewState.SEND_ASSETS)
          }
        }}
      />
    )
  }

  if (viewState >= ViewState.CONFIRM_TRANSACTION) {
    return renderConfirmationModal()
  }
  return (
    <FormContainer>
      <FlexGap alignItems="center" justifyContent="space-between">
        <FlexGap alignItems="center" gap="8px" flexDirection="column">
          <Text fontSize="20px" fontWeight="bold">
            {t('Send')}
          </Text>
        </FlexGap>
      </FlexGap>

      <Box>
        <AddressInputWrapper>
          <Box position="relative">
            <Input
              value={address ?? ''}
              onChange={handleAddressChange}
              placeholder="Recipient address"
              style={{ height: '64px' }}
              isError={Boolean(addressError)}
            />
            {address && (
              <ClearButton
                scale="sm"
                onClick={handleClearAddress}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                variant="tertiary"
              >
                <CloseIcon color="textSubtle" />
              </ClearButton>
            )}
          </Box>
        </AddressInputWrapper>
        {addressError && <ErrorMessage>{addressError}</ErrorMessage>}
      </Box>

      <Box mb="16px">
        <FlexGap alignItems="center" gap="8px" justifyContent="space-between" position="relative">
          <FlexGap alignItems="center" gap="8px" mb="8px">
            <AssetContainer>
              <CurrencyLogo currency={currency} size="40px" src={asset.token.logoURI} />
              <ChainIconWrapper>
                <img
                  src={`${ASSET_CDN}/web/chains/${asset.chainId}.png`}
                  alt={`${chainName}-logo`}
                  width="12px"
                  height="12px"
                />
              </ChainIconWrapper>
            </AssetContainer>
            <FlexGap flexDirection="column">
              <Text fontWeight="bold" fontSize="20px">
                {asset.token.symbol}
              </Text>
              <Text color="textSubtle" fontSize="12px" mt="-4px">{`${chainName.toUpperCase()} ${t('Chain')}`}</Text>
            </FlexGap>
          </FlexGap>
          <Box position="relative">
            <LazyAnimatePresence mode="wait" features={domAnimation}>
              {tokenBalance ? (
                !isInputFocus ? (
                  <SwapUIV2.WalletAssetDisplay
                    isUserInsufficientBalance={isInsufficientBalance}
                    balance={tokenBalance.toSignificant(6)}
                    onMax={handleMaxInput}
                  />
                ) : (
                  <SwapUIV2.AssetSettingButtonList onPercentInput={handlePercentInput} />
                )
              ) : null}
            </LazyAnimatePresence>
          </Box>
        </FlexGap>

        <BalanceInput
          value={amount}
          onUserInput={handleAmountChange}
          onFocus={() => setIsInputFocus(true)}
          onBlur={handleUserInputBlur}
          currencyValue={amount ? `~${(parseFloat(amount) * price).toFixed(2)} USD` : ''}
          placeholder="0.0"
          unit={asset.token.symbol}
        />
        {isInsufficientBalance && amount && (
          <Text color="failure" fontSize="14px" mt="8px">
            {t('Insufficient balance')}
          </Text>
        )}
      </Box>

      <FlexGap gap="16px" mt="16px">
        <ActionButton onClick={() => onViewStateChange(ViewState.SEND_ASSETS)} variant="tertiary">
          {t('Close')}
        </ActionButton>
        <Button
          width="100%"
          onClick={() => {
            onViewStateChange(ViewState.CONFIRM_TRANSACTION)
          }}
          disabled={!address || !amount || !!addressError || isInsufficientBalance || attemptingTxn}
          isLoading={attemptingTxn}
          endIcon={attemptingTxn ? <AutoRenewIcon spin color="currentColor" /> : undefined}
        >
          {attemptingTxn ? t('Confirming') : t('Next')}
        </Button>
      </FlexGap>
    </FormContainer>
  )
}
