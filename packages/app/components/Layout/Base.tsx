import { styled, Box } from "@cabindao/topo";
import Head from "next/head";
import { Web3Provider } from "../Web3Context";
import PageHeader from "../PageHeader";

const Page = styled("div", {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  background: "$sand",
  height: "100vh",
  variants: {
    loading: {
      true: {
        cursor: "progress",
      },
    },
  },
});

type LayoutProps = { title?: React.ReactNode; loading?: boolean };

const BaseLayout = ({ children, title = "Passports", loading }) => (
  <Web3Provider>
    <Page loading={loading}>
      <Head>
        <title>{title}</title>
        <meta name="description" content="App | Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageHeader title={title} />
      <Box css={{ flex: 1, display: "flex" }}>{children}</Box>
    </Page>
  </Web3Provider>
);

export default BaseLayout;
