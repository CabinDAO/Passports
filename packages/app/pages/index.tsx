import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, ContractSendMethod } from "web3-eth-contract";
import { TransactionReceipt } from "web3-core";
import { Modal, Input, Button, Label } from "@cabindao/topo";
import { styled } from "../stitches.config";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import {
  contractAddressesByNetworkId,
  getAbiFromJson,
  networkNameById,
} from "../components/constants";
import {
  Link1Icon,
  Pencil2Icon,
  Share1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  useAddress,
  useChainId,
  useConnect,
  useWeb3,
  Web3Provider,
} from "../components/Web3Context";
import axios from "axios";
import UsersTabContent from "../components/UsersTabContent";
import { ipfsAdd } from "../components/utils";

import { getChainName } from "../utils/getChainName";

const DRAWER_WIDTH = 255;
const HEADER_HEIGHT = 64;

const TabContainer = styled("div", {
  minHeight: 64,
  padding: 20,
  cursor: "pointer",
});

const MembershipCardContainer = styled("div", {
  background: "$sand",
  width: 350,
  height: 512,
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
    marginTop: "4px",
  },
});

const ModalInput = styled(Input, { paddingLeft: 8, marginBottom: 32 });

const ModalLabel = styled(`h2`, { marginBottom: 32 });

interface IMembershipProps {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  price: string;
  metadataHash: string;
}

interface IMembershipCardProps extends IMembershipProps {
  redirect_url: string | undefined;
}

const MembershipCard = (props: IMembershipCardProps) => {
  const [passport, setPassport] = useState({
    address: props.address,
    name: props.name,
    symbol: props.symbol,
    supply: props.supply,
    price: props.price,
    metadataHash: props.metadataHash,
  });
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [url, setUrl] = useState(props.redirect_url);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
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
          metadataHash: p[4],
        });
      });
    }
  }, [setPassport, passport, web3]);
  useEffect(() => {
    setUrl(props.redirect_url);
  }, [props.redirect_url]);
  useEffect(() => {
    if (!Object.entries(metadata).length && passport.metadataHash) {
      axios.get(`https://ipfs.io/ipfs/${passport.metadataHash}`).then((r) => {
        setMetadata(r.data);
      });
    }
  }, [metadata, passport.metadataHash]);
  const { thumbnail, ...fields } = metadata;
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
          <Button leftIcon={<Pencil2Icon />} onClick={open} />
          <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Edit Membership Type"
            onConfirm={() => {
              let upsertData: {
                [key: string]: string | undefined;
              } = {};
              upsertData["redirect_url"] = url;
              upsertData["contractAddr"] = passport.address
              return axios.post("/api/updateRedirectionUrl", {
                data: upsertData
              })
              .then(() => console.log("Insert success toast here"))
              .catch(() => console.log("Insert error toast here"));
            }}
          >
            <ModalLabel>{`${passport.name} (${passport.symbol})`}</ModalLabel>
            <ModalInput
              label={"Redirect URL"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Modal>
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
              return new Promise<void>((resolve, reject) =>
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
      {Object.entries(fields).map((f) => (
        <p key={f[0]}>
          <b>{f[0]}:</b> {f[1]}
        </p>
      ))}
      {thumbnail && <IpfsImage cid={thumbnail} />}
    </MembershipCardContainer>
  );
};

const Tab: React.FC<{ to: string }> = ({ children, to }) => {
  const router = useRouter();
  const onClick = useCallback(() => router.push(`#${to}`), [router, to]);
  return <TabContainer onClick={onClick}>{children}</TabContainer>;
};

const IpfsImage = ({ cid }: { cid: string }) => {
  return (
    <Image
      src={`https://ipfs.io/ipfs/${cid}`}
      alt={"thumbnail"}
      width={300}
      height={200}
    />
  );
};

const AdditionalFieldRow = styled("div", {
  display: "flex",
  alignItems: "center",
  "& input": {
    marginRight: "8px",
  },
});

const CreateMembershipModal = ({
  contractInstance,
  onSuccess,
}: {
  contractInstance: Contract;
  onSuccess: (m: IMembershipProps) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const address = useAddress();
  const web3 = useWeb3();
  const [stage, setStage] = useState(0);
  const [cid, setCid] = useState("");
  const [additionalFields, setAdditionalFields] = useState<
    { key: string; value: string }[]
  >([]);
  const onFinalConfirm = useCallback(() => {
    return ipfsAdd(
      JSON.stringify({
        ...Object.fromEntries(
          additionalFields.map(({ key, value }) => [key, value])
        ),
        ...(cid ? { thumbnail: cid } : {}),
      })
    ).then((metadataHash) => {
      const weiPrice = web3.utils.toWei(price, "ether");
      return new Promise<void>((resolve, reject) =>
        contractInstance.methods
          .create(name, symbol, quantity, weiPrice, metadataHash)
          .send({ from: address })
          .on("receipt", (receipt: TransactionReceipt) => {
            const address =
              (receipt.events?.["PassportDeployed"]?.returnValues
                ?.passport as string) || "";
            onSuccess({
              address,
              symbol,
              name,
              supply: Number(quantity),
              price,
              metadataHash,
            });
            resolve();
          })
          .on("error", reject)
      );
    });
  }, [
    symbol,
    name,
    quantity,
    price,
    contractInstance,
    web3,
    address,
    onSuccess,
    additionalFields,
    cid,
  ]);
  const stageConfirms = [
    () => {
      setStage(1);
      return true;
    },
    () => {
      setStage(2);
      return true;
    },
    () => {
      setStage(3);
      return true;
    },
    onFinalConfirm,
  ];
  const [fileLoading, setFileLoading] = useState(false);
  return (
    <>
      <Button onClick={open} type="primary" disabled={!address}>
        Create New Membership Type
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="New Membership Type"
        onConfirm={stageConfirms[stage]}
        confirmText={stage === stageConfirms.length - 1 ? "Create" : "Next"}
      >
        {stage === 0 && (
          <>
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
          </>
        )}
        {stage === 1 && (
          <>
            <Label label={"Upload Thumbnail"}>
              <input
                type={"file"}
                onChange={async (e) => {
                  if (e.target.files) {
                    setFileLoading(true);
                    const formData = new FormData();
                    const file = e.target.files[0];
                    if (file) {
                      return ipfsAdd(file)
                        .then(setCid)
                        .finally(() => setFileLoading(false));
                    }
                  }
                }}
              />
            </Label>
            {fileLoading && "Loading..."}
          </>
        )}
        {stage === 2 && (
          <>
            <h2>Additional Metadata</h2>
            {additionalFields.map((a, i) => (
              <AdditionalFieldRow key={i}>
                <ModalInput
                  label={"Key"}
                  value={a.key}
                  onChange={(e) =>
                    setAdditionalFields(
                      additionalFields.map((field, j) =>
                        j === i
                          ? { value: field.value, key: e.target.value }
                          : field
                      )
                    )
                  }
                />
                <ModalInput
                  label={"Value"}
                  value={a.value}
                  onChange={(e) =>
                    setAdditionalFields(
                      additionalFields.map((field, j) =>
                        j === i
                          ? { value: e.target.value, key: field.key }
                          : field
                      )
                    )
                  }
                />
                <Button
                  leftIcon={<TrashIcon />}
                  onClick={() =>
                    setAdditionalFields([
                      ...additionalFields,
                      { key: "", value: "" },
                    ])
                  }
                />
              </AdditionalFieldRow>
            ))}
            <Button
              onClick={() =>
                setAdditionalFields([
                  ...additionalFields,
                  { key: "", value: "" },
                ])
              }
            >
              Add Field
            </Button>
          </>
        )}
        {stage === 3 && (
          <>
            <h2>Details</h2>
            <p>
              <b>Name:</b> {name}
            </p>
            <p>
              <b>Symbol:</b> {symbol}
            </p>
            <p>
              <b>Quantity:</b> {quantity}
            </p>
            <p>
              <b>Price:</b> {price} ETH
            </p>
            <p>
              <b>Thumbnail:</b>
            </p>
            {additionalFields.map((a) => (
              <p key={a.key}>
                <b>{a.key}:</b> {a.value}
              </p>
            ))}
            {cid && <IpfsImage cid={cid} />}
          </>
        )}
      </Modal>
    </>
  );
};

const MembershipTabContent = () => {
  const [memberships, setMemberships] = useState<IMembershipProps[]>([]);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [redirectionUrls, setRedirectionUrls] = useState<{
    [key: string]: string | undefined;
  }>({});
  useEffect(() => {
    // Fetch the relevant redirection URLs on page load.
    const membershipAddrs = memberships.map((m) => m.address);
    if (memberships.length > 0) {
      axios.post("/api/redirectionUrls", {
        addresses: membershipAddrs
      })
      .then((result: { data: { redirect_urls: Record<string, string> } }) => {
        setRedirectionUrls(result.data["redirect_urls"]);
      })
      .catch(console.error);
    }
  }, [memberships, setRedirectionUrls]);
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
              metadataHash: "",
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
        <CreateMembershipModal
          contractInstance={contractInstance}
          onSuccess={(m) => setMemberships([...memberships, m])}
        />
      </div>
      <MembershipContainer>
        {memberships.map((m) => (
          <MembershipCard
            key={`${chainId}-${m.address}`}
            {...m}
            redirect_url={redirectionUrls[m.address]}
          />
        ))}
      </MembershipContainer>
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

const HomeContent = () => {
  const router = useRouter();
  const tab = useMemo(() => router.asPath.replace(/^\/#?/, ""), [router]);
  const address = useAddress();
  const chainId = useChainId();
  const chainName = getChainName(chainId);
  const connectWallet = useConnect();
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
              <span style={{ marginRight: 16 }}>Connected on {chainName}</span>
            )}
            <Button>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          </>
        ) : (
          <Button onClick={connectWallet}>Connect Wallet</Button>
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
            zIndex: 2,
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
    </div>
  );
};

const Home: NextPage = () => {
  return (
    <Web3Provider>
      <HomeContent />
    </Web3Provider>
  );
};

export default Home;
