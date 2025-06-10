import { Currency } from "@pancakeswap/sdk";
import { ArrowForwardIcon, AtomBoxProps, AutoColumn, Row, RowFixed, Text } from "@pancakeswap/uikit";
import { CurrencyLogo } from "./CurrencyLogo";

interface DualCurrencyDisplayProps extends AtomBoxProps {
  inputCurrency?: Currency;
  outputCurrency?: Currency;
  inputAmount?: string;
  outputAmount?: string;
  inputTextColor?: string;
  outputTextColor?: string;
  inputChainName?: string;
  outputChainName?: string;
  overrideIcon?: React.ReactNode;
  textRightOpacity?: number;
  textLeftOpacity?: number;
}
export const DualCurrencyDisplay = ({
  inputAmount,
  outputAmount,
  inputTextColor,
  outputTextColor,
  inputCurrency,
  outputCurrency,
  inputChainName,
  outputChainName,
  overrideIcon,
  textRightOpacity,
  textLeftOpacity,
  ...props
}: DualCurrencyDisplayProps) => {
  return (
    <Row justifyContent="space-around" {...props}>
      <AutoColumn justify="center" style={{ minWidth: "130px" }}>
        <CurrencyLogo currency={inputCurrency} size="40px" showChainLogo />

        <Text color={inputTextColor} bold ellipsis style={{ opacity: textLeftOpacity }}>
          {inputAmount}&nbsp;
          {inputCurrency?.symbol}
        </Text>

        <Text textTransform="uppercase" color="textSubtle" fontSize="12px" bold style={{ opacity: textLeftOpacity }}>
          {inputChainName}
        </Text>
      </AutoColumn>
      <RowFixed my="auto" paddingTop="4px">
        {overrideIcon || <ArrowForwardIcon width="36px" ml="4px" color="textSubtle" />}
      </RowFixed>
      <AutoColumn justify="center" style={{ width: "130px" }}>
        <CurrencyLogo currency={outputCurrency} size="40px" showChainLogo />

        <Text bold ellipsis color={outputTextColor} style={{ opacity: textRightOpacity }}>
          {outputAmount}&nbsp;{outputCurrency?.symbol}
        </Text>

        <Text color="textSubtle" textTransform="uppercase" fontSize="12px" style={{ opacity: textRightOpacity }} bold>
          {outputChainName}
        </Text>
      </AutoColumn>
    </Row>
  );
};
