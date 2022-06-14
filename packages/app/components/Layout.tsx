import { Button, styled } from "@cabindao/topo";
import Head from "next/head";
import { NextPage } from "next/types";
import {
  useAddress,
  useChainId,
  useDisconnect,
  useDisplayAddress,
  Web3Provider,
} from "./Web3Context";
import {
  SignedIn,
  SignedOut,
  SignInWithMetamaskButton,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import NetworkIndicator from "./NetworkIndicator";
import { PlusIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

const Page = styled("div", {
  background: "$sand",
  display: "flex",
  height: "100vh",
});

const PageContent = styled("div", {
  display: "flex",
  flexDirection: "column",
  padding: "48px",
  position: "relative",
  flexGrow: 1,
});

const OuterNav = styled("nav", {
  width: "80px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  padding: "15px 5px",
  background: "$forest",
  borderRight: "2px solid $green900",
});

const OrganizationNav = styled("nav", {
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
});

const NavButton = styled("div", {
  padding: "5px",
});

const NavImage = styled(Image, {
  borderRadius: "15px",
});

const PageHeader = styled("header", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const AddressLabel = styled("span", {
  fontFamily: "$sans",
  color: "$forest",
  marginRight: "16px",
  fontWeight: 600,
  minWidth: "96px",
});

const NavIndicator = ({ src, path }: { src: string; path: string }) => {
  return (
    <NavButton>
      <Link href={path}>
        <a>
          <NavImage width={60} height={60} src={src} />
        </a>
      </Link>
    </NavButton>
  );
};

const SignedInIndicator = () => {
  const displayAddress = useDisplayAddress();
  const chainId = useChainId();
  const disconnectWallet = useDisconnect();
  return (
    <span>
      <NetworkIndicator chainId={chainId} />
      <AddressLabel>
        {displayAddress.endsWith(".eth") || displayAddress.length <= 12
          ? displayAddress
          : `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`}
      </AddressLabel>
      <Button onClick={disconnectWallet} tone="forest">
        Disconnect wallet
      </Button>
    </span>
  );
};

const PageMain = styled("main", {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: `40px 0`,
  overflow: "auto",
});

const LayoutContent: React.FC<{ title?: React.ReactNode }> = ({
  children,
  title = "Passports",
}) => {
  const user = useUser();
  return (
    <Page>
      <Head>
        <title>Passports</title>
        <meta name="description" content="App | Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <OuterNav>
        <OrganizationNav>
          <NavIndicator
            src={user.user?.profileImageUrl || "/logo.png"}
            path={"/passport"}
          />
          <NavIndicator src={"/logo.png"} path={"/"} />
        </OrganizationNav>
        <Button tone="wheat" type="primary">
          <PlusIcon height={"16px"} width={"16px"} />
        </Button>
      </OuterNav>
      <PageContent>
        <PageHeader>
          {title}
          <SignedIn>
            <SignedInIndicator />
          </SignedIn>
          <SignedOut>
            <SignInWithMetamaskButton>
              <Button tone={"wheat"}>Connect wallet</Button>
            </SignInWithMetamaskButton>
          </SignedOut>
        </PageHeader>
        <PageMain>{children}</PageMain>
      </PageContent>
    </Page>
  );
};

const Layout: NextPage<{ title?: React.ReactNode }> = ({ children, title }) => {
  return (
    <Web3Provider>
      <LayoutContent title={title}>{children}</LayoutContent>
    </Web3Provider>
  );
};

export default Layout;
