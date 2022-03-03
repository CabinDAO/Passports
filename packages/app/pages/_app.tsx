import { globalCss } from "../stitches.config";
import type { AppProps } from "next/app";

const globalStyles = globalCss({
  body: {
    backgroundColor: "$sand",
  },
  "html, body": {
    padding: 0,
    margin: 0,
    fontFamily: "$sans",
  },
  a: {
    color: "inherit",
    textDecoration: "none",
  },
  "*": {
    boxSizing: "border-box",
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  globalStyles();
  return <Component {...pageProps} />;
}

export default MyApp;
