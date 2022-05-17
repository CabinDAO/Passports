import { useClerk, useUser } from "@clerk/nextjs";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Web3 from "web3";
import { lookupAddress } from "./utils";

declare global {
  interface Window {
    ethereum: {
      chainId: string;
      selectedAddress: string;
      on: (e: string, c: (s: [string] | number) => void) => void;
    };
  }
}

const Web3Context = React.createContext({
  address: "",
  displayAddress: "",
  web3: { current: undefined } as { current?: Web3 },
  chainId: -1,
});
export const useAddress = () => useContext(Web3Context).address;
export const useDisplayAddress = () => useContext(Web3Context).displayAddress;
export const useWeb3 = () => useContext(Web3Context).web3.current!;
export const useChainId = () => useContext(Web3Context).chainId;
export const useDisconnect = () => {
  const clerk = useClerk();
  return useCallback(() => clerk.signOut(), [clerk]);
};

// const providerOptions = {
//   walletconnect: {
//     package: WalletConnect,
//     options: {
//       infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
//     },
//   },
// };
//
// We're going to need this when Clerk supports Wallet Connect

export const Web3Provider: React.FC = ({ children }) => {
  const [address, setAddress] = useState("");
  const [displayAddress, setDisplayAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const switchAddress = useCallback(
    (accounts: string[]) => {
      const [addr] = accounts;
      setAddress(addr);
      if (!addr) return Promise.resolve();
      return lookupAddress(addr, web3.current).then((d) =>
        setDisplayAddress(d)
      );
    },
    [setAddress, setDisplayAddress]
  );
  const loaded = useRef(false);
  const clerk = useClerk();
  const user = useUser();
  const setup = useCallback(() => {
    if (!loaded.current && web3.current) {
      web3.current.givenProvider.on("close", async () => {
        clerk.signOut();
      });
      web3.current.givenProvider.on("accountsChanged", (s: string[]) => {
        if (user.isSignedIn) {
          clerk
            .signOut()
            .then(() => switchAddress(s))
            .then(() => clerk.authenticateWithMetamask());
        }
      });
      web3.current.givenProvider.on("chainChanged", async (chainId: number) => {
        setChainId(Number(chainId));
      });

      return Promise.all([
        web3.current.eth.getAccounts(),
        web3.current.eth.getChainId(),
      ]).then(([addresses, chain]) => {
        setChainId(chain);
        switchAddress(addresses);
        loaded.current = true;
      });
    }
  }, [loaded, setChainId, switchAddress, clerk, web3, user.isSignedIn]);

  useEffect(() => {
    clerk.addListener(({ session, user }) => {
      if (session && user && session.user === user) {
        setup();
      }
    });
  }, [setup, clerk]);
  useEffect(() => {
    if (user.isSignedIn)
      switchAddress(user.user.web3Wallets.map((a) => a.web3Wallet));
  }, [user, switchAddress]);
  return (
    <Web3Context.Provider
      value={{
        address,
        web3,
        chainId,
        displayAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
