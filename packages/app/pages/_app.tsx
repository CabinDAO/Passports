import { globalCss } from "@cabindao/topo";
import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";

// TODO: migreate global styles to Topo
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
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
