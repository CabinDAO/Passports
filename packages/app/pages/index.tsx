import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Web3 from "web3";
import { Contract, ContractSendMethod } from "web3-eth-contract";
import { TransactionReceipt } from "web3-core";
import { Modal, Input, Button } from "@cabindao/topo";
import { styled } from "../stitches.config";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import {
  contractAddressesByNetworkId,
  getAbiFromJson,
  networkNameById,
} from "../components/constants";
import { Link1Icon } from "@radix-ui/react-icons";
import { Share1Icon } from "@radix-ui/react-icons";

const DRAWER_WIDTH = 255;
const HEADER_HEIGHT = 64;

const TabContainer = styled("div", {
  minHeight: 64,
  padding: 20,
  cursor: "pointer",
});

const MembershipCardContainer = styled("div", {
  background: "$sand",
  width: 300,
  height: 256,
  padding: 16,
  display: "inline-block",
  marginRight: "8px",
  marginBottom: "8px",
});

const MembershipContainer = styled("div", {
  padding: "16px 0",
});

const MembershipHeader = styled("h2", {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  "& button": {
    marginLeft: "4px",
  },
});

const MembershipCard = (props: {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  price: string;
}) => {
  const [passport, setPassport] = useState(props);
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  useEffect(() => {
    if (!passport.name) {
      const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
      contract.options.address = passport.address;
      (contract.methods.get() as ContractSendMethod).call().then((p) => {
        setPassport({
          address: passport.address,
          name: p[0],
          symbol: p[1],
          supply: p[2],
          price: web3.utils.fromWei(p[3], "ether"),
        });
      });
    }
  }, [setPassport, passport, web3]);
  return (
    <MembershipCardContainer>
      <MembershipHeader>
        <span>{passport.name}</span>
        <div>
          <Button
            leftIcon={<Link1Icon />}
            onClick={() =>
              window.navigator.clipboard.writeText(
                `${window.location.origin}/checkout/${
                  networkNameById[Number(networkId)]
                }/${passport.address}`
              )
            }
          />
          <Button
            leftIcon={<Share1Icon />}
            onClick={() => setShareIsOpen(true)}
          />
          <Modal
            isOpen={shareIsOpen}
            setIsOpen={setShareIsOpen}
            title="Grant Access to Membership"
            onConfirm={() => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportFactoryJson)
              );
              contract.options.address =
                contractAddressesByNetworkId[networkId]?.passportFactory || "";
              return new Promise((resolve, reject) =>
                contract.methods
                  .grantPassport(passport.address, userAddress)
                  .send({ from: address })
                  .on("receipt", () => {
                    setUserAddress("");
                    resolve();
                  })
                  .on("error", reject)
              );
            }}
          >
            <ModalInput
              label={"Address"}
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
            />
          </Modal>
        </div>
      </MembershipHeader>
      <h6>{passport.symbol}</h6>
      <p>
        <b>Supply:</b> {passport.supply}
      </p>
      <p>
        <b>Price:</b> {passport.price} ETH
      </p>
    </MembershipCardContainer>
  );
};

const Tab: React.FC<{ to: string }> = ({ children, to }) => {
  const router = useRouter();
  const onClick = useCallback(() => router.push(`#${to}`), [router, to]);
  return <TabContainer onClick={onClick}>{children}</TabContainer>;
};

const ModalInput = styled(Input, { paddingLeft: 8, marginBottom: 32 });

const MembershipTabContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [memberships, setMemberships] = useState<
    Parameters<typeof MembershipCard>[0][]
  >([]);
  const address = useAddress();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const web3 = useWeb3();
  const chainId = useChainId();
  const contractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(passportFactoryJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.passportFactory || "";
    return contract;
  }, [web3, chainId]);
  useEffect(() => {
    if (contractInstance.options.address) {
      (contractInstance.methods.getMemberships() as ContractSendMethod)
        .call({
          from: address,
        })
        .then((r: string[]) => {
          setMemberships(
            r.map((address) => ({
              address,
              name: "",
              symbol: "",
              supply: 0,
              price: "0",
            }))
          );
        })
        .catch(console.error);
    }
  }, [contractInstance, address]);
  return (
    <>
      <h1>Memberships</h1>
      <div>
        <Button onClick={open} type="primary" disabled={!address}>
          Create New Membership Type
        </Button>
        <Modal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title="New Membership Type"
          onConfirm={() => {
            const weiPrice = web3.utils.toWei(price, "ether");
            return new Promise((resolve, reject) =>
              contractInstance.methods
                .create(name, symbol, quantity, weiPrice)
                .send({ from: address })
                .on("receipt", (receipt: TransactionReceipt) => {
                  const address =
                    (receipt.events?.["PassportDeployed"]?.returnValues
                      ?.passport as string) || "";
                  setMemberships([
                    ...memberships,
                    {
                      address,
                      symbol,
                      name,
                      supply: Number(quantity),
                      price,
                    },
                  ]);
                  resolve();
                })
                .on("error", reject)
            );
          }}
        >
          <ModalInput
            label={"Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ModalInput
            label={"Symbol"}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <ModalInput
            label={"Quantity"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type={"number"}
          />
          <ModalInput
            label={"Price"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type={"number"}
          />
        </Modal>
      </div>
      <MembershipContainer>
        {memberships.map((m) => (
          <MembershipCard key={`${chainId}-${m.address}`} {...m} />
        ))}
      </MembershipContainer>
    </>
  );
};

const UsersTabContent = () => {
  return (
    <>
      <h1>Users</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const SettingsTabContent = () => {
  return (
    <>
      <h1>Settings</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const Web3Context = React.createContext({
  address: "",
  web3: { current: undefined } as { current?: Web3 },
  chainId: -1,
});
const useAddress = () => useContext(Web3Context).address;
const useWeb3 = () => useContext(Web3Context).web3.current!;
const useChainId = () => useContext(Web3Context).chainId;

const Home: NextPage = () => {
  const router = useRouter();
  const tab = useMemo(() => router.asPath.replace(/^\/#?/, ""), [router]);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const getWeb3Info = useCallback(
    () =>
      Promise.all([
        web3.current.eth.getAccounts(),
        web3.current.eth.getChainId(),
      ]).then(([addresses, chain]) => {
        setAddress(addresses[0]);
        setChainId(chain);
      }),
    [setAddress, setChainId]
  );
  const connectWallet = useCallback(() => {
    (web3.current.givenProvider.enable() as Promise<void>).then(getWeb3Info);
  }, [getWeb3Info, web3]);
  useEffect(() => {
    if (web3.current.givenProvider?.isConnected?.()) {
      getWeb3Info();
    }

    if (web3.current?.eth?.givenProvider) {
      web3.current.eth.givenProvider.on(
        "accountsChanged",
        (accounts: string[]) => {
          setAddress(accounts[0]);
        }
      );

      // Subscribe to chainId change
      web3.current.eth.givenProvider.on("chainChanged", (chainId: number) => {
        setChainId(Number(chainId));
      });
    }
  }, [getWeb3Info, web3, setChainId, setAddress]);
  return (
    <div
      style={{
        padding: "0 2rem",
      }}
    >
      <Head>
        <title>NFT Passports</title>
        <meta name="description" content="App | NFT Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header // TODO replace with Topo header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "right",
          padding: 16,
          marginLeft: DRAWER_WIDTH,
          height: HEADER_HEIGHT,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        {address ? (
          <>
            {chainId && (
              <span style={{ marginRight: 16 }}>ChainId: {chainId}</span>
            )}
            <Button>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          </>
        ) : (
          <Button
            onClick={connectWallet}
          >
            Connect Wallet
          </Button>
        )}
      </header>
      <div
        style={{
          width: DRAWER_WIDTH,
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            background: "#fdf3e7",
            height: "100%",
            color: "#324841",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            flex: "1 0 auto",
            zIndex: 1200,
            position: "fixed",
            top: 0,
            outline: 0,
            left: 0,
            borderRight: "#fdf3e7",
          }}
        >
          <div style={{ minHeight: 64, padding: 20 }}>
            <Link href="/">
              <a>NFT Passports Dashboard</a>
            </Link>
          </div>
          <Tab to={"memberships"}>Memberships</Tab>
          <Tab to={"users"}>Users</Tab>
          <Tab to={"settings"}>Settings</Tab>
        </div>
      </div>
      <Web3Context.Provider value={{ address, web3, chainId }}>
        <main
          style={{
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            marginLeft: DRAWER_WIDTH,
            width: `calc(100% - 255px)`,
          }}
        >
          {tab === "memberships" && <MembershipTabContent />}
          {tab === "users" && <UsersTabContent />}
          {tab === "settings" && <SettingsTabContent />}
        </main>
      </Web3Context.Provider>
    </div>
  );
};

export default Home;
