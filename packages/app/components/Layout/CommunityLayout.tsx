import type { NextPge } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { styled } from "@cabindao/topo";
import { useAddress } from "../Web3Context";
import Layout from "./PageLayout";
import Loading from "../Loading";

const DRAWER_WIDTH = 200;

const PageHeaderH1 = styled("h1", {
  fontWeight: 600,
  fontFamily: "$mono",
  fontSize: 32,
  lineHeight: "41.67px",
  textTransform: "uppercase",
});

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
    [router],
  );
};

const LinkContent = styled("span", {
  display: "inline-flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
});

const Tab: React.FC<{ to: string; disabled: boolean }> = ({ to, disabled }) => {
  const tab = useTab();
  const [loading, setLoading] = useState(false);
  return (
    <TabContainer
      active={tab === to}
      disabled={disabled}
      onClick={() => setLoading(true)}
    >
      <Link href={`/${to}`} passHref>
        <LinkContent onClick={(e) => disabled && e.preventDefault()}>
          {to}
          {loading && <Loading size={12} thickness={2} />}
        </LinkContent>
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
  position: "absolute",
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

const PageMain = styled("main", {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  marginLeft: DRAWER_WIDTH,
});

const CommunityLayoutContent: React.FC<{}> = ({ children }) => {
  const address = useAddress();
  return (
    <>
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
        </LinkContainer>
      </DashboardSidebar>
      <PageMain>{children}</PageMain>
    </>
  );
};

const CommunityLayout: NextPage<{ title?: React.ReactNode }> = ({
  children,
  title,
}) => {
  const tab = useTab();
  return (
    <Layout title={title || <PageHeaderH1>{tab}</PageHeaderH1>}>
      <CommunityLayoutContent>{children}</CommunityLayoutContent>
    </Layout>
  );
};

export default CommunityLayout;
