import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  styled,
} from "@cabindao/topo";
import Image from "next/image";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import {
  contractAddressesByNetworkId,
  getAbiFromJson,
  networkNameById,
} from "../components/constants";
import ClipSVG from "../components/icons/Clip.svg";
import {
  Link1Icon,
  Pencil2Icon,
  Share1Icon,
  TrashIcon,
  ArrowUpIcon,
  OpacityIcon,
} from "@radix-ui/react-icons";
import { useAddress, useChainId, useWeb3 } from "../components/Web3Context";
import axios from "axios";
import { ipfsAdd, resolveAddress } from "../components/utils";
import IpfsImage from "../components/IpfsImage";
import Papa from "papaparse";
import BN from "bn.js";

const MembershipCardContainer = styled("div", {
  background: "$sand",
  width: 350,
  minHeight: 512,
  padding: 16,
  display: "inline-block",
  marginRight: "8px",
  marginBottom: "8px",
  verticalAlign: "top",
  border: "1px solid $forest",
  borderRadius: "10px",
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

const ModalInput = styled(Input, {
  paddingLeft: 8,
  marginBottom: "24px",
  border: "1px solid $forest",
  borderRadius: 5,
  fontWeight: 600,
  width: "100%",
});

const ModalContent = styled("div", {
  color: "$forest",
  marginTop: "-8px",
  width: "400px",
});

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
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [airdropAddrList, setAirdropAddrList] = useState<string[]>([]);
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
    if (!Object.keys(metadata).length && passport.metadataHash) {
      axios.get(`https://ipfs.io/ipfs/${passport.metadataHash}`).then((r) => {
        if (Object.keys(r.data).length) {
          setMetadata(r.data);
        }
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
          <Button
            leftIcon={<OpacityIcon />}
            onClick={() => setAirDropIsOpen(true)}
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
            <ModalContent>
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
                <ModalInputLabel htmlFor="acolor">
                  Accent color:
                </ModalInputLabel>
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
            </ModalContent>
          </Modal>
          <Modal
            isOpen={shareIsOpen}
            setIsOpen={setShareIsOpen}
            title="Grant Access to Membership"
            onConfirm={async () => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportFactoryJson)
              );
              contract.options.address =
                contractAddressesByNetworkId[networkId]?.passportFactory || "";
              return resolveAddress(userAddress, web3)
                .then((ethAddress) =>
                  ethAddress
                    ? new Promise<void>((resolve, reject) =>
                        contract.methods
                          .grantPassport(passport.address, ethAddress)
                          .send({ from: address })
                          .on("receipt", () => {
                            setUserAddress("");
                            resolve();
                          })
                          .on("error", reject)
                      )
                    : Promise.reject(
                        new Error(`Invalid wallet address ${userAddress}`)
                      )
                )
                .catch((e) => setToastMessage(`ERROR: ${e.message}`));
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
          <Modal
            isOpen={airDropIsOpen}
            setIsOpen={setAirDropIsOpen}
            title="Airdrop Passports"
            onConfirm={() => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportJson)
              );
              contract.options.address = passport.address;
              return Promise.all(
                airdropAddrList.map((addr) => resolveAddress(addr, web3))
              )
                .then(
                  (addrList) =>
                    new Promise<void>((resolve, reject) =>
                      contract.methods
                        .airdrop(
                          addrList,
                          addrList.map((addr) => {
                            return new BN(
                              web3.utils.randomHex(32).replace(/^0x/, ""),
                              "hex"
                            );
                          })
                        )
                        .send({
                          from: address,
                        })
                        .on("receipt", (receipt: TransactionReceipt) => {
                          setToastMessage("Airdrop Successful!");
                          setPassport({
                            ...passport,
                            supply: passport.supply - addrList.length,
                          });
                          setAirDropIsOpen(false);
                          resolve();
                        })
                        .on("error", (e: Error) => {
                          setToastMessage(`ERROR: ${e.message}`);
                          reject(e);
                        })
                    )
                )
                .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
            }}
          >
            <div>
              {" "}
              {`All the addresses should be under column named "address". All other columns will be ignored.`}{" "}
            </div>
            <ModalInputBox>
              <Label label={"Upload CSV"}>
                <input
                  type={"file"}
                  accept={".csv"}
                  onChange={async (e) => {
                    if (e.target.files) {
                      const f: File = e.target.files[0];
                      Papa.parse<Record<string, string>, File>(f, {
                        header: true,
                        complete: function (results) {
                          const addrsInCsv = results.data.map(
                            (result) => result["address"]
                          );
                          const relevantAddr = addrsInCsv.filter(
                            (addr) => addr
                          );
                          setAirdropAddrList(relevantAddr);
                        },
                        error: function (e) {
                          setToastMessage(`ERROR: ${e.message}`);
                        },
                      });
                    }
                  }}
                />
              </Label>
            </ModalInputBox>
            {airdropAddrList.length > 0 ? (
              <div>{airdropAddrList.length} Addresses</div>
            ) : null}
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

const AdditionalFieldRow = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  "& input": {
    marginRight: "8px",
  },
});

const CreateMembershipContainer = styled("div", {
  borderRadius: "48px",
  border: "1px solid $forest",
  background: "rgba(29, 43, 42, 0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "72px",
  fontWeight: 600,
});

const CreateMembershipHeader = styled("h1", {
  fontSize: "24px",
  lineHeight: "31.2px",
  fontFamily: "$mono",
});

const ShortInputContainer = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  "> div": {
    marginRight: "16px",
    "&:last-child": {
      marginRight: 0,
    },
  },
});

const SummaryRow = styled("div", {
  display: "flex",
  justifyContent: "space-between",
});

const SummaryCellContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
});

const SummaryCellValue = styled("span", {
  color: "#8B9389",
  fontFamily: "$sans",
  fontSize: 16,
  lineHeight: "24px",
  fontWeight: 500,
  marginBottom: "24px",
  display: "inline-block",
  cursor: "inherit",
});

const SummaryCell = ({
  field,
  value,
  grow = 1,
}: {
  field: string;
  value: string;
  grow?: number;
}) => (
  <SummaryCellContainer style={{ width: `${grow * 100}%` }}>
    <Label label={field} />
    <SummaryCellValue>{value}</SummaryCellValue>
  </SummaryCellContainer>
);

const UnderlinedLabel = styled("label", {
  textDecoration: "underline",
  fontSize: "14px",
  lineHeight: "27px",
  fontWeight: 600,
  fontFamily: "$sans",
  marginBottom: "24px",
  display: "inline-block",
  cursor: "pointer",
});

const MembershipImageLabel = styled("label", {
  textTransform: "uppercase",
  fontSize: "14px",
  lineHeight: "18px",
  fontWeight: 600,
  fontFamily: "$mono",
  marginBottom: "24px",
});

const FileInput = styled("div", {
  cursor: "pointer",
  "> span": {
    marginRight: "10px",
  },
});

const MembershipImageContainer = styled("div", {
  "> span": {
    border: "1px solid $forest !important",
    width: "100% !important",
    height: "176px !important",
    borderRadius: "20px",
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
  const [fileName, setFileName] = useState("");
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
              isPrivate,
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
    isPrivate,
  ]);
  const stageConfirms = [
    () => {
      setStage(1);
      return true;
    },
    onFinalConfirm,
  ];
  const stageTitles = ["New Membership Type", "Review"];
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <CreateMembershipContainer>
      <CreateMembershipHeader>
        Get started using memberships
      </CreateMembershipHeader>
      <Button onClick={open} type="primary" disabled={!address} tone={"wheat"}>
        Create new membership
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={stageTitles[stage]}
        onConfirm={stageConfirms[stage]}
        confirmText={stage === stageConfirms.length - 1 ? "Create" : "Next"}
      >
        <ModalContent>
          {stage === 0 && (
            <>
              <ModalInput
                label={"Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter membership name"
              />
              <ModalInput
                label={"Symbol"}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter membership symbol"
              />
              <ShortInputContainer>
                <ModalInput
                  label={"Quantity"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type={"number"}
                  placeholder="Ex. 100"
                />
                <ModalInput
                  label={"Price"}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type={"number"}
                  placeholder="Ex. 2 ETH"
                />
                <ModalInput
                  label={"Royalty %"}
                  value={royaltyPcnt}
                  onChange={(e) => setRoyaltyPcnt(e.target.value)}
                  type={"number"}
                  placeholder={"Ex. 2%"}
                />
              </ShortInputContainer>
              {!!additionalFields.length && (
                <>
                  <hr style={{ marginBottom: 24 }} />
                  {additionalFields.map((a, i) => (
                    <AdditionalFieldRow key={i}>
                      <ModalInput
                        label={"New Field"}
                        placeholder={"Metadata"}
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
                        label={"Field Value"}
                        value={a.value}
                        placeholder={"Value"}
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
                        type={"link"}
                        tone={"wheat"}
                        onClick={() =>
                          setAdditionalFields(
                            additionalFields.filter((field, j) => j !== i)
                          )
                        }
                      >
                        <TrashIcon />
                      </Button>
                    </AdditionalFieldRow>
                  ))}
                </>
              )}
              <div>
                <UnderlinedLabel
                  onClick={() =>
                    setAdditionalFields([
                      ...additionalFields,
                      { key: "", value: "" },
                    ])
                  }
                >
                  Add extra fields
                </UnderlinedLabel>
              </div>
              <MembershipImageLabel>Membership Image</MembershipImageLabel>
              <FileInput onClick={() => fileRef.current?.click()}>
                <input
                  ref={fileRef}
                  type={"file"}
                  onChange={async (e) => {
                    if (e.target.files) {
                      setFileLoading(true);
                      const file = e.target.files[0];
                      if (file) {
                        return ipfsAdd(file)
                          .then(setCid)
                          .then(() => setFileName(file.name))
                          .finally(() => setFileLoading(false));
                      }
                    }
                  }}
                  style={{ display: "none" }}
                />
                <Image {...ClipSVG} alt={"file"} />
                {fileLoading ? (
                  <SummaryCellValue>Loading...</SummaryCellValue>
                ) : fileName ? (
                  <SummaryCellValue>{fileName}</SummaryCellValue>
                ) : (
                  <UnderlinedLabel>Upload an image</UnderlinedLabel>
                )}
              </FileInput>
            </>
          )}
          {stage === 1 && (
            <>
              <SummaryRow>
                <SummaryCell field="Name" value={name} grow={2} />
                <SummaryCell field="Symbol" value={symbol} />
              </SummaryRow>
              <SummaryRow>
                <SummaryCell field="Quantity" value={quantity} />
                <SummaryCell field="Price" value={`${price} ETH`} />
                <SummaryCell field="Royalty" value={`${royaltyPcnt}%`} />
              </SummaryRow>
              {cid && (
                <>
                  <Label>Membership Image</Label>
                  <MembershipImageContainer>
                    <IpfsImage cid={cid} height={"100%"} width={"100%"} />
                  </MembershipImageContainer>
                </>
              )}
              <Label
                label="Funds Claimable"
                description="If checked, your users pay less gas and you could claim your funds whenever you want as they are stored in the contract. If unchecked, you are paid immediately when users buy a passport."
              >
                <Checkbox
                  checked={claimable}
                  onCheckedChange={(b) =>
                    b === "indeterminate"
                      ? setClaimable(false)
                      : setClaimable(b)
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
                      : setIsPrivate(b)
                  }
                />
              </Label>
            </>
          )}
        </ModalContent>
      </Modal>
    </CreateMembershipContainer>
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
              isPrivate: false,
            }))
          );
        })
        .catch(console.error);
    }
  }, [contractInstance, address]);
  return (
    <>
      <CreateMembershipModal
        contractInstance={contractInstance}
        onSuccess={(m) => setMemberships([...memberships, m])}
      />
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

export default MembershipTabContent;
