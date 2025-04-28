import { usePreviousValue } from "@pancakeswap/hooks";
import { useTranslation } from "@pancakeswap/localization";
import { Box, Button, FlexGap, FlexGapProps, Message, Text } from "@pancakeswap/uikit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ZoomLevels } from "./constants";
import { getQuickActionConfigs, getZoomLevelConfigs } from "./utils";

interface PriceRangePickerProps extends Omit<FlexGapProps, "onChange"> {
  onChange: (value: number | null, zoomLevel: ZoomLevels) => void;
  value?: number | null;
  tickSpacing: number | undefined;
}

const CapitalEfficiencyWarning = ({
  setShowCapitalEfficiencyWarning,
  setFullRange,
}: {
  setShowCapitalEfficiencyWarning: (value: boolean) => void;
  setFullRange: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Message variant="warning">
      <Box>
        <Text fontSize="16px">{t("Efficiency Comparison")}</Text>
        <Text color="textSubtle">{t("Full range positions may earn less fees than concentrated positions.")}</Text>
        <Button
          mt="16px"
          onClick={() => {
            setShowCapitalEfficiencyWarning(false);
            setFullRange();
          }}
          scale="md"
          variant="danger"
        >
          {t("I understand")}
        </Button>
      </Box>
    </Message>
  );
};

export const PriceRangePicker = ({ onChange, value, tickSpacing, ...props }: PriceRangePickerProps) => {
  const { t } = useTranslation();
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState<boolean>(false);
  const prevTickSpacing = usePreviousValue(tickSpacing);

  const handleClick = useCallback(
    (action: number, zoomLevel: ZoomLevels) => {
      if (value === action) {
        onChange?.(null, getZoomLevelConfigs(tickSpacing));
      } else {
        onChange?.(action, zoomLevel);
      }
    },
    [onChange, value, tickSpacing]
  );

  const config = useMemo(() => getQuickActionConfigs(tickSpacing), [tickSpacing]);
  const setFullRange = useCallback(() => {
    onChange?.(100, getZoomLevelConfigs(tickSpacing));
  }, [onChange, tickSpacing]);
  const resetRange = useCallback(() => {
    onChange?.(null, getZoomLevelConfigs(tickSpacing));
  }, [onChange, tickSpacing]);

  useEffect(() => {
    if (prevTickSpacing !== tickSpacing && value) {
      resetRange();
    }
  }, [tickSpacing, value, onChange, resetRange, prevTickSpacing]);

  if (!tickSpacing) return null;

  return showCapitalEfficiencyWarning ? (
    <CapitalEfficiencyWarning
      setShowCapitalEfficiencyWarning={setShowCapitalEfficiencyWarning}
      setFullRange={setFullRange}
    />
  ) : (
    <FlexGap gap="5px" {...props}>
      {Object.entries(config)
        ?.sort(([a], [b]) => +a - +b)
        .map(([quickAction, zoomLevel]) => (
          <Button
            key={quickAction}
            onClick={() => handleClick(+quickAction, zoomLevel)}
            variant={+quickAction === value ? "primary" : "tertiary"}
            width="100%"
            scale="xs"
            py="14px"
          >
            {quickAction}%
          </Button>
        ))}
      <Button
        width="200%"
        onClick={() => {
          if (value === 100) {
            handleClick(100, getZoomLevelConfigs(tickSpacing));
            return;
          }
          setShowCapitalEfficiencyWarning(true);
        }}
        variant={value === 100 ? "primary" : "tertiary"}
        scale="xs"
        py="14px"
      >
        {t("Full Range")}
      </Button>
    </FlexGap>
  );
};
