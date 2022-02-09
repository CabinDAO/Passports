import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, ContractSendMethod } from "web3-eth-contract";
import { TransactionReceipt } from "web3-core";
import {
  Modal,
  Input,
  Button,
  Label,
  Box,
  Toast,
  Checkbox,
} from "@cabindao/topo";
import { styled } from "../stitches.config";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import {
  contractAddressesByNetworkId,
  getAbiFromJson,
  networkNameById,
  shimmer,
  toBase64,
} from "../components/constants";
import {
  Link1Icon,
  Pencil2Icon,
  Share1Icon,
  TrashIcon,
  ArrowUpIcon,
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
import SettingsTabContent from "../components/SettingsTabContent";
import IpfsImage from "../components/IpfsImage";
import ManageTabContent from "../components/ManageTabContent";

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
  minHeight: 512,
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

const ModalInputBox = styled(Box, { marginBottom: 25 });

const ModalInputLabel = styled(`label`, {
  fontFamily: `var(--fonts-mono)`,
  fontWeight: 600,
  fontSize: `var(--fontSizes-sm)`,
  textTransform: "uppercase",
  marginRight: 10,
});

interface IMembershipProps {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  price: string;
  metadataHash: string;
  claimable: boolean;
  royaltyPcnt: number;
  isPrivate: boolean;
}

interface IMembershipCardProps extends IMembershipProps {
  customization: Record<string, string>;
}

const BalanceLine = styled("p", {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const MembershipCard = (props: IMembershipCardProps) => {
  const [passport, setPassport] = useState({
    address: props.address,
    name: props.name,
    symbol: props.symbol,
    supply: props.supply,
    price: props.price,
    metadataHash: props.metadataHash,
    claimable: props.claimable,
    royaltyPcnt: props.royaltyPcnt,
  });
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [newSupply, setNewSupply] = useState(passport.supply);
  const [isOpen, setIsOpen] = useState(false);
  const [supplyIsOpen, setSupplyIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [url, setUrl] = useState(props.customization.redirect_url);
  const [brandColor, setBrandColor] = useState(props.customization.brand_color);
  const [accColor, setAccColor] = useState(props.customization.accent_color);
  const [buttonTxt, setButtonTxt] = useState(props.customization.button_txt);
  const [logoCid, setLogoCid] = useState(props.customization.logo_cid);
  const [fileLoading, setFileLoading] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState("0");
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
          claimable: p[6],
          royaltyPcnt: p[5] / 100,
        });
        setNewSupply(Number(p[2]));
      });
    }
  }, [setPassport, passport, web3, setNewSupply]);
  useEffect(() => {
    setUrl(props.customization.redirect_url);
    setBrandColor(props.customization.brand_color);
    setAccColor(props.customization.accent_color);
    setButtonTxt(props.customization.button_txt);
    setLogoCid(props.customization.logo_cid);
  }, [props.customization]);
  useEffect(() => {
    if (!Object.entries(metadata).length && passport.metadataHash) {
      axios.get(`https://ipfs.io/ipfs/${passport.metadataHash}`).then((r) => {
        setMetadata(r.data);
      });
    }
    if (passport.claimable) {
      web3.eth
        .getBalance(passport.address)
        .then((v) => setBalance(web3.utils.fromWei(v, "ether")));
    }
  }, [
    metadata,
    passport.metadataHash,
    passport.claimable,
    web3,
    passport.address,
    setBalance,
  ]);
  const { thumbnail, ...fields } = metadata;
  const [toastMessage, setToastMessage] = useState("");
  return (
    <MembershipCardContainer>
      <MembershipHeader>
        <span>{passport.name}</span>
        <div>
          <Button
            leftIcon={<Link1Icon />}
            onClick={() => {
              window.navigator.clipboard.writeText(
                `${window.location.origin}/checkout/${
                  networkNameById[Number(networkId)]
                }/${passport.address}`
              );
              setToastMessage("Copied checkout link!");
            }}
          />
          <Button
            leftIcon={<Share1Icon />}
            onClick={() => setShareIsOpen(true)}
          />
          <Button leftIcon={<Pencil2Icon />} onClick={open} />
          <Button
            leftIcon={<ArrowUpIcon />}
            onClick={() => setSupplyIsOpen(true)}
          />
          <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Customize Checkout"
            onConfirm={() => {
              let upsertData: Record<string, string> = {
                redirect_url: url,
                contractAddr: passport.address,
                brand_color: brandColor,
                accent_color: accColor,
                button_txt: buttonTxt,
                logo_cid: logoCid,
              };
              return axios
                .post("/api/updateCustomization", {
                  data: upsertData,
                })
                .then(() =>
                  setToastMessage("Successfully updated membership data!")
                )
                .catch((e) =>
                  setToastMessage(`ERROR: ${e.response?.data || e.message}`)
                );
            }}
          >
            <ModalLabel>{`${passport.name} (${passport.symbol})`}</ModalLabel>
            <ModalInput
              label={"Redirect URL"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <ModalInputBox>
              <ModalInputLabel htmlFor="bcolor">Brand color:</ModalInputLabel>
              <input
                type="color"
                id="bcolor"
                name="bcolor"
                value={brandColor || "#fdf3e7"}
                onChange={(e) => setBrandColor(e.target.value)}
              ></input>
            </ModalInputBox>
            <ModalInputBox>
              <ModalInputLabel htmlFor="acolor">Accent color:</ModalInputLabel>
              <input
                type="color"
                id="acolor"
                name="acolor"
                value={accColor || "#324841"}
                onChange={(e) => setAccColor(e.target.value)}
              ></input>
            </ModalInputBox>
            <ModalInput
              label={"Button Text"}
              value={buttonTxt}
              onChange={(e) => setButtonTxt(e.target.value)}
            />
            <ModalInputBox>
              <Label label={logoCid ? "Change Logo" : "Upload Logo"}>
                <input
                  type={"file"}
                  onChange={async (e) => {
                    if (e.target.files) {
                      setFileLoading(true);
                      const file = e.target.files[0];
                      if (file) {
                        return ipfsAdd(file)
                          .then(setLogoCid)
                          .finally(() => setFileLoading(false));
                      }
                    }
                  }}
                />
              </Label>
              {fileLoading && "Loading..."}
            </ModalInputBox>
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
          <Modal
            isOpen={supplyIsOpen}
            setIsOpen={setSupplyIsOpen}
            title="Change Supply"
            onConfirm={() => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportJson)
              );
              contract.options.address = passport.address;
              return new Promise<void>((resolve, reject) =>
                contract.methods
                  .setSupply(newSupply)
                  .send({ from: address })
                  .on("receipt", () => {
                    setPassport({
                      ...passport,
                      supply: newSupply,
                    });
                    resolve();
                  })
                  .on("error", reject)
              );
            }}
          >
            <ModalInput
              label={"New Supply"}
              value={newSupply}
              onChange={(e) => setNewSupply(Number(e.target.value))}
              type={"number"}
            />
          </Modal>
        </div>
      </MembershipHeader>
      <h6>{passport.symbol}</h6>
      {passport.claimable && (
        <BalanceLine>
          <span>
            <b>Balance:</b> {balance} ETH
          </span>
          <Button
            disabled={balance === "0"}
            onClick={() => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportJson)
              );
              contract.options.address = passport.address;
              (contract.methods.claimEth() as ContractSendMethod)
                .send({ from: address })
                .on("receipt", () => {
                  setToastMessage(`Successfully Claimed ${balance} ETH!`);
                  setBalance("0");
                });
            }}
          >
            Claim
          </Button>
        </BalanceLine>
      )}
      <p>
        <b>Supply:</b> {passport.supply}
      </p>
      <p>
        <b>Price:</b> {passport.price} ETH
      </p>
      <p>
        <b>Royalty:</b> {passport.royaltyPcnt}%
      </p>
      {Object.entries(fields).map((f) => (
        <p key={f[0]}>
          <b>{f[0]}:</b> {f[1]}
        </p>
      ))}
      {thumbnail && <IpfsImage cid={thumbnail} />}
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </MembershipCardContainer>
  );
};

const Tab: React.FC<{ to: string }> = ({ children, to }) => {
  const router = useRouter();
  const onClick = useCallback(() => router.push(`#${to}`), [router, to]);
  return <TabContainer onClick={onClick}>{children}</TabContainer>;
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
  const [claimable, setClaimable] = useState(false);
  const [royaltyPcnt, setRoyaltyPcnt] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
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
      const royalty = (Number(royaltyPcnt) * 100) | 0;
      return new Promise<void>((resolve, reject) =>
        contractInstance.methods
          .create(
            name,
            symbol,
            quantity,
            weiPrice,
            metadataHash,
            royalty,
            claimable,
            isPrivate
          )
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
              claimable,
              royaltyPcnt: royalty / 100,
              isPrivate
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
    royaltyPcnt,
    contractInstance,
    web3,
    address,
    onSuccess,
    additionalFields,
    cid,
    claimable,
    isPrivate
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
            <ModalInput
              label={"Royalty %"}
              value={royaltyPcnt}
              onChange={(e) => setRoyaltyPcnt(e.target.value)}
              type={"number"}
            />
            <Label
              label="Funds Claimable"
              description="If checked, your users pay less gas and you could claim your funds whenever you want as they are stored in the contract. If unchecked, you are paid immediately when users buy a passport."
            >
              <Checkbox
                checked={claimable}
                onCheckedChange={(b) =>
                  b === "indeterminate"
                    ? setClaimable(false)
                    : setClaimable(true)
                }
              />
            </Label>
            <Label
              label="Private Passport"
              description="If checked, only an authorized lst of addresses can mint the passort. This list can be managed from the Manage Tab"
            >
              <Checkbox
                checked={isPrivate}
                onCheckedChange={(b) =>
                  b === "indeterminate"
                    ? setIsPrivate(false)
                    : setIsPrivate(true)
                }
              />
            </Label>
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
              <b>Royalty:</b> {royaltyPcnt}%
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
  const [customizations, setCustomizations] = useState<
    Record<string, Record<string, string>>
  >({});
  useEffect(() => {
    // Fetch the relevant redirection URLs on page load.
    const membershipAddrs = memberships.map((m) => m.address);
    if (memberships.length > 0) {
      axios
        .post("/api/customizations", {
          addresses: membershipAddrs,
        })
        .then(
          (result: {
            data: { customizations: Record<string, Record<string, string>> };
          }) => {
            setCustomizations(result.data["customizations"]);
          }
        )
        .catch(console.error);
    }
  }, [memberships, setCustomizations]);
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
              claimable: false,
              royaltyPcnt: 0,
              isPrivate: false
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
            customization={customizations[m.address] || {}}
          />
        ))}
      </MembershipContainer>
    </>
  );
};

const HomeContent = () => {
  const router = useRouter();
  const tab = useMemo(() => router.asPath.replace(/^\/#?/, ""), [router]);
  const address = useAddress();
  const chainId = useChainId();
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
              <span style={{ marginRight: 16 }}>ChainId: {chainId}</span>
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
          <Tab to={"manage"}>Manage</Tab>
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
        {tab === "manage" && <ManageTabContent />}
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
