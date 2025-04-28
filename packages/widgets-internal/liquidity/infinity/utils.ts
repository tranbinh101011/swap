import { QUICK_ACTION_CONFIGS, TICK_SPACING_LEVEL, TICK_SPACING_RANGE, TickSpacing, ZOOM_LEVELS } from "./constants";

export const getTickSpacingLevel = (tickSpacing?: TickSpacing): TICK_SPACING_LEVEL | undefined => {
  if (!tickSpacing) return undefined;
  return (Object.keys(TICK_SPACING_RANGE) as Array<TICK_SPACING_LEVEL>).find((level) => {
    const [min, max] = TICK_SPACING_RANGE[level];
    return tickSpacing >= min && tickSpacing <= max;
  });
};

export const getQuickActionConfigs = (tickSpacing?: TickSpacing) => {
  const tickSpacingLevel = getTickSpacingLevel(tickSpacing) ?? TICK_SPACING_LEVEL.MEDIUM;
  return QUICK_ACTION_CONFIGS[tickSpacingLevel];
};

export const getZoomLevelConfigs = (tickSpacing?: TickSpacing) => {
  const tickSpacingLevel = getTickSpacingLevel(tickSpacing) ?? TICK_SPACING_LEVEL.MEDIUM;
  return ZOOM_LEVELS[tickSpacingLevel];
};
