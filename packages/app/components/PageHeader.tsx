import { Button, styled } from "@cabindao/topo";
import {
  SignedIn,
  SignedOut,
  SignInWithMetamaskButton,
  useClerk,
} from "@clerk/nextjs";
import { useDisplayAddress, useChainId, useDisconnect } from "./Web3Context";
import NetworkIndicator from "./NetworkIndicator";

const Header = styled("header", {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "$6 $10",
});

const AddressLabel = styled("span", {
  fontFamily: "$sans",
  color: "$forest",
  marginRight: "16px",
  fontWeight: 600,
  minWidth: "96px",
});

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

const PageHeader = ({ title }) => (
  <Header>
    <SignedIn>
      <SignedInIndicator />
    </SignedIn>
    <SignedOut>
      <SignInWithMetamaskButton>
        <Button tone={"wheat"}>Sign In</Button>
      </SignInWithMetamaskButton>
    </SignedOut>
  </Header>
);

export default PageHeader;
