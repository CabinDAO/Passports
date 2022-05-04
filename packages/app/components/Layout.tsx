import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useMemo } from "react";
import { Button, styled } from "@cabindao/topo";
import {
  useAddress,
  useChainId,
  useDisconnect,
  useDisplayAddress,
  Web3Provider,
} from "./Web3Context";
import NetworkIndicator from "./NetworkIndicator";
import {
  SignedIn,
  SignedOut,
  SignInWithMetamaskButton,
  useClerk,
} from "@clerk/nextjs";

const DRAWER_WIDTH = 200;
const HEADER_HEIGHT = 64;
const PAGE_MARGIN = 64;

const TabContainer = styled("div", {
  margin: "12px 0",
  cursor: "pointer",
  textTransform: "uppercase",
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: "20.8px",
  variants: {
    active: {
      true: {
        color: "$wheat",
      },
      false: {
        color: "$sand",
      },
    },
    disabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.5,

        a: {
          cursor: "not-allowed",
        },
      },
    },
  },
});

const useTab = () => {
  const router = useRouter();
  return useMemo(
    () => router.asPath.replace(/^\/#?/, "").replace(/(#.*)$/, ""),
    [router]
  );
};

const Tab: React.FC<{ to: string; disabled: boolean }> = ({ to, disabled }) => {
  const tab = useTab();
  return (
    <TabContainer active={tab === to} disabled={disabled}>
      <Link href={`/${to}`} passHref>
        <span onClick={(e) => disabled && e.preventDefault()}>{to}</span>
      </Link>
    </TabContainer>
  );
};

const DashboardSidebar = styled("div", {
  width: DRAWER_WIDTH,
  flex: "0 0 auto",
});

const LinkContainer = styled("div", {
  width: DRAWER_WIDTH,
  boxSizing: "border-box",
  background: "$forest",
  fontFamily: "$mono",
  height: "100%",
  color: "$sand",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
  zIndex: 2,
  position: "fixed",
  top: 0,
  outline: 0,
  left: 0,
  padding: "24px",
});

const CabinLink = styled("div", {
  fontFamily: "$sans",
  fontSize: "32px",
  lineHeight: "48px",
  marginBottom: "24px",
  fontWeight: 600,
  textTransform: "unset",
});

const PageContent = styled("div", {
  background: "$sand",
  padding: `${PAGE_MARGIN}px`,
});

const PageHeader = styled("header", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginLeft: DRAWER_WIDTH,
  height: HEADER_HEIGHT,
  width: `calc(100% - ${DRAWER_WIDTH}px)`,
});

const PageHeaderH1 = styled("h1", {
  fontWeight: 600,
  fontFamily: "$mono",
  fontSize: 32,
  lineHeight: "41.67px",
  textTransform: "uppercase",
});

const PageMain = styled("main", {
  height: `calc(100vh - ${HEADER_HEIGHT + 2 * PAGE_MARGIN}px)`,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  marginLeft: DRAWER_WIDTH,
  padding: `40px 0`,
  width: `calc(100% - 255px)`,
});

const AddressLabel = styled("span", {
  fontFamily: "$sans",
  color: "$forest",
  marginRight: "16px",
  fontWeight: 600,
});

const SignedInIndicator = () => {
  const displayAddress = useDisplayAddress();
  const chainId = useChainId();
  const disconnectWallet = useDisconnect();
  return (
    <span>
      <NetworkIndicator chainId={chainId} />
      <AddressLabel>
        {displayAddress.endsWith(".eth")
          ? displayAddress
          : `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`}
      </AddressLabel>
      <Button onClick={disconnectWallet} tone="forest">
        Disconnect wallet
      </Button>
    </span>
  );
};

const HomeContent: React.FC<{ title?: React.ReactNode }> = ({
  children,
  title,
}) => {
  const tab = useTab();
  const address = useAddress();
  return (
    <PageContent>
      <Head>
        <title>Passports</title>
        <meta name="description" content="App | Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageHeader>
        {title || <PageHeaderH1>{tab}</PageHeaderH1>}
        <SignedIn>
          <SignedInIndicator />
        </SignedIn>
        <SignedOut>
          <SignInWithMetamaskButton>
            <Button tone={"wheat"}>Connect wallet</Button>
          </SignInWithMetamaskButton>
        </SignedOut>
      </PageHeader>
      <DashboardSidebar>
        <LinkContainer>
          <CabinLink>
            <Link href="/">
              <a>Passports</a>
            </Link>
          </CabinLink>
          <Tab to={"stamps"} disabled={!address}>
            Stamps
          </Tab>
          <Tab to={"users"} disabled={!address}>
            Users
          </Tab>
          <Tab to={"manage"} disabled={!address}>
            Manage
          </Tab>
          <Tab to={"profile"} disabled={!address}>
            Profile
          </Tab>
          {/*<Tab to={"settings"}>Settings</Tab>*/}
        </LinkContainer>
      </DashboardSidebar>
      <PageMain>{children}</PageMain>
    </PageContent>
  );
};

const Layout: NextPage<{ title?: React.ReactNode }> = ({ children, title }) => {
  return (
    <Web3Provider>
      <HomeContent title={title}>{children}</HomeContent>
    </Web3Provider>
  );
};

export default Layout;
