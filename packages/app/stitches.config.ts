import { createStitches, globalCss, keyframes } from "@stitches/react";
import { theme, media, utils } from "@cabindao/topo-theme";

export const { styled, css, getCssText } = createStitches({
  theme,
  media,
  utils,
});

export { globalCss, keyframes };
