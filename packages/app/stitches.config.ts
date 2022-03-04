import { createStitches } from "@stitches/react";
import { getCssText as topoGetCssText } from "@cabindao/topo/lib/stitches.config";
import { theme, media, utils } from "@cabindao/topo-theme";

export const {
  styled,
  css,
  getCssText: appGetCssText,
  globalCss,
  keyframes,
} = createStitches({
  theme,
  media,
  utils,
});

export const getCssText = () => appGetCssText().concat(topoGetCssText());
