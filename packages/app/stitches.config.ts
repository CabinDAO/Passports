import { createStitches } from "@stitches/react";
import { theme, media, utils } from "@cabindao/topo-theme";

export const { styled, css, getCssText, globalCss, keyframes } = createStitches(
  {
    theme,
    media,
    utils,
  }
);
