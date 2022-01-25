import WalletConnect from "@walletconnect/web3-provider";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";

const Web3Context = React.createContext({
  address: "",
  web3: { current: undefined } as { current?: Web3 },
  chainId: -1,
  networkId: -1,
  connectWallet: () => Promise.resolve(),
});
export const useAddress = () => useContext(Web3Context).address;
export const useWeb3 = () => useContext(Web3Context).web3.current!;
export const useChainId = () => useContext(Web3Context).chainId;
export const useConnect = () => useContext(Web3Context).connectWallet;
export const useNetworkId = () => useContext(Web3Context).networkId;

const providerOptions = {
  walletconnect: {
    package: WalletConnect,
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    },
  },
};

export const Web3Provider: React.FC = ({ children }) => {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  const [networkId, setNetworkId] = useState(0);
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const web3Modal = useRef<Web3Modal>();

  const connectWallet = useCallback(() => {
    if (!web3Modal.current) return Promise.resolve();
    return web3Modal.current
      .connect()
      .then(async (provider) => {
        if (provider.on) {
          provider.on("close", async () => {
            await web3Modal.current.clearCachedProvider();
          });
          provider.on("accountsChanged", (accounts: string[]) => {
            setAddress(accounts[0]);
          });
          provider.on("chainChanged", async (chainId: number) => {
            const networkId = await web3.current.eth.net.getId();
            setNetworkId(networkId);
            setChainId(Number(chainId));
          });
          provider.on("networkChanged", async (networkId: number) => {
            const chainId = await web3.current.eth.getChainId();
            setChainId(chainId);
            setNetworkId(Number(networkId));
          });
        }
        await provider.enable();
        web3.current = new Web3(provider);

        return Promise.all([
          web3.current.eth.getAccounts(),
          web3.current.eth.getChainId(),
          web3.current.eth.net.getId(),
        ]);
      })
      .then(([addresses, chain, network]) => {
        setAddress(addresses[0]);
        setChainId(chain);
        setNetworkId(network);
      });
  }, [web3, setAddress, setChainId, setNetworkId]);
  useEffect(() => {
    web3Modal.current = new Web3Modal({
      cacheProvider: true,
      providerOptions,
    });
    if (web3Modal.current.cachedProvider) {
      connectWallet();
    }
  }, [connectWallet, web3Modal]);
  return (
    <Web3Context.Provider
      value={{ address, web3, chainId, connectWallet, networkId }}
    >
      {children}
    </Web3Context.Provider>
  );
};
