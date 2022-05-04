import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ContractSendMethod } from "web3-eth-contract";
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
  theme,
  Tooltip,
} from "@cabindao/topo";
import Image from "next/image";
import { getAbiFromJson, networkNameById } from "../components/constants";
import ClipSVG from "../components/icons/Clip.svg";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Link1Icon,
  PauseIcon,
  PlayIcon,
  Pencil1Icon,
  Pencil2Icon,
  Share1Icon,
  TrashIcon,
  OpacityIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useAddress, useChainId, useWeb3 } from "../components/Web3Context";
import axios from "axios";
import {
  bytes32ToIpfsHash,
  getAllManagedStamps,
  getStampContract,
  ipfsAdd,
  ipfsHashToBytes32,
  resolveAddress,
} from "../components/utils";
import IpfsAsset from "../components/IpfsAsset";
import Papa from "papaparse";
import Layout from "../components/Layout";
import Loading from "../components/Loading";
import { useRouter } from "next/router";

const ViewStampContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

const ViewStampFooter = styled("div", {
  width: "100%",
  textAlign: "right",
});

const StampCardContainer = styled("div", {
  background: "$forest",
  color: "$sand",
  width: 300,
  padding: "18px 24px 24px",
  display: "inline-block",
  marginRight: "8px",
  marginBottom: "8px",
  verticalAlign: "top",
  border: "1px solid $sprout",
  borderRadius: "20px",
});

const StampContainer = styled("div", {
  padding: "16px 0",
  flexGrow: 1,
});

const StampHeader = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
});

const StampName = styled("h1", {
  fontWeight: 600,
  fontFamily: "$mono",
  textTransform: "uppercase",
  lineHeight: "23px",
  fontSize: "18px",
  margin: 0,
});

const StampCardDivider = styled("hr", {
  background: "$sprout",
  margin: "16px 0",
  height: "1px",
  border: 0,
});

const StampCardRow = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
  fontSize: "14px",
  fontFamily: "$mono",
  alignItems: "center",
});

const StampCardKey = styled("span", {
  textTransform: "uppercase",
});

const StampCardValue = styled("span", {
  color: "#ffffff",
  fontWeight: 500,
  fontFamily: "$sans",
  "& > button": {
    height: "16px",
  },
});

const ModalInput = styled(Input, {
  paddingLeft: 8,
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

interface IStampProps {
  address: string;
  name: string;
  symbol: string;
  mintIndex: number;
  supply: number;
  price: string;
  metadataHash: string;
  royalty: number;
  isPrivate: boolean;
  version: string;
  paused: boolean;
}

interface IStampCardProps extends IStampProps {
  customization: Record<string, string>;
}

const EditableStampCardRow = ({
  field,
  stamp,
  setStamp,
  decorator = "",
}: {
  field: keyof IStampProps;
  stamp: IStampProps;
  setStamp: (s: IStampProps) => void;
  decorator?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const web3 = useWeb3();
  const address = useAddress();
  const [value, setValue] = useState(stamp[field] || 0);
  return (
    <StampCardRow>
      <StampCardKey>{field}</StampCardKey>
      <StampCardValue>
        {stamp[field]}
        {decorator}
        <Tooltip content={"Edit"}>
          <Button onClick={() => setIsOpen(true)} type={"icon"}>
            <Pencil1Icon color={theme.colors.wheat} width={12} height={12} />
          </Button>
        </Tooltip>
        <Modal
          hideCloseIcon
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title={`Change ${field}`}
          onConfirm={() => {
            getStampContract({
              web3,
              address: stamp.address,
              version: stamp.version,
            }).then(
              (contract) =>
                new Promise<void>((resolve, reject) =>
                  contract.methods[
                    `set${field.slice(0, 1).toUpperCase()}${field.slice(1)}`
                  ](value)
                    .send({ from: address })
                    .on("receipt", () => {
                      setStamp({
                        ...stamp,
                        [field]: value,
                      });
                      resolve();
                    })
                    .on("error", reject)
                )
            );
          }}
        >
          <ModalInput
            label={`New ${field}`}
            value={value.toString()}
            onChange={(e) => setValue(Number(e.target.value))}
            type={"number"}
          />
        </Modal>
      </StampCardValue>
    </StampCardRow>
  );
};

const StampCard = ({ customization, ...props }: IStampCardProps) => {
  const [stamp, setStamp] = useState(props);
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [pauseIsOpen, setPauseIsOpen] = useState(false);
  const [airdropAddrList, setAirdropAddrList] = useState<string[]>([]);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [url, setUrl] = useState(customization.redirect_url);
  const [brandColor, setBrandColor] = useState(customization.brand_color);
  const [accColor, setAccColor] = useState(customization.accent_color);
  const [textColor, setTextColor] = useState(customization.text_color);
  const [buttonTxt, setButtonTxt] = useState(customization.button_txt);
  const [logoCid, setLogoCid] = useState(customization.logo_cid);
  const [fileLoading, setFileLoading] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState("0");
  const chainId = useChainId();
  useEffect(() => {
    if (!stamp.name) {
      getStampContract({
        web3,
        address: stamp.address,
        version: stamp.version,
      })
        .then((contract) =>
          (contract.methods.get() as ContractSendMethod).call()
        )
        .then((p) => {
          setStamp({
            address: stamp.address,
            name: p[0],
            symbol: p[1],
            supply: Number(p[2]),
            mintIndex: Number(p[3]),
            price: web3.utils.fromWei(p[4], "ether"),
            metadataHash: bytes32ToIpfsHash(p[5]),
            royalty: p[6] / 100,
            version: stamp.version,
            isPrivate: p[7],
            paused: p[9] || false,
          });
        });
    }
  }, [setStamp, stamp, web3]);
  useEffect(() => {
    setUrl(customization.redirect_url);
    setBrandColor(customization.brand_color);
    setAccColor(customization.accent_color);
    setButtonTxt(customization.button_txt);
    setLogoCid(customization.logo_cid);
  }, [customization]);
  useEffect(() => {
    if (!Object.keys(metadata).length && stamp.metadataHash) {
      axios.get(`https://ipfs.io/ipfs/${stamp.metadataHash}`).then((r) => {
        if (Object.keys(r.data).length) {
          setMetadata(r.data);
        }
      });
    }
    web3.eth
      .getBalance(stamp.address)
      .then((v) => setBalance(web3.utils.fromWei(v, "ether")));
  }, [metadata, stamp.metadataHash, web3, stamp.address, setBalance]);
  const { thumbnail, ...fields } = metadata;
  const [toastMessage, setToastMessage] = useState("");
  return (
    <StampCardContainer>
      <StampHeader>
        <CardImageContainer>
          {thumbnail ? (
            <IpfsAsset cid={thumbnail} height={"100%"} width={"100%"} />
          ) : (
            <Image
              src={"/vercel.svg"}
              alt={"stock photo"}
              height={"100%"}
              width={"100&"}
            />
          )}
        </CardImageContainer>
        <div>
          <Tooltip content={"Share Stamp Ownership"}>
            <Button onClick={() => setShareIsOpen(true)} type="icon">
              <Share1Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Customize checkout"}>
            <Button onClick={open} type="icon">
              <Pencil2Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Airdrop stamps"}>
            <Button onClick={() => setAirDropIsOpen(true)} type="icon">
              <OpacityIcon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={stamp.paused ? "Unpause" : "Pause"}>
            <Button
              onClick={() => {
                setPauseIsOpen(true);
              }}
              type={"icon"}
            >
              {stamp.paused ? (
                <PlayIcon width={20} height={20} color={theme.colors.wheat} />
              ) : (
                <PauseIcon width={20} height={20} color={theme.colors.wheat} />
              )}
            </Button>
          </Tooltip>
          <Modal
            hideCloseIcon
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Customize Checkout"
            onConfirm={() => {
              let upsertData: Record<string, string> = {
                redirect_url: url,
                contractAddr: stamp.address,
                brand_color: brandColor,
                accent_color: accColor,
                text_color: textColor,
                button_txt: buttonTxt,
                logo_cid: logoCid,
              };
              return axios
                .post("/api/updateCustomization", {
                  data: upsertData,
                })
                .then(() =>
                  setToastMessage(
                    "Successfully updated stamp's customized checkout experience!"
                  )
                )
                .catch((e) =>
                  setToastMessage(`ERROR: ${e.response?.data || e.message}`)
                );
            }}
          >
            <ModalContent>
              <ModalLabel>{`${stamp.name} (${stamp.symbol})`}</ModalLabel>
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
              <ModalInputBox>
                <ModalInputLabel htmlFor="acolor">Text color:</ModalInputLabel>
                <input
                  type="color"
                  id="textColor"
                  name="textColor"
                  value={textColor || "#ffffff"}
                  onChange={(e) => setTextColor(e.target.value)}
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
                    accept="video/*,image/*"
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
            hideCloseIcon
            isOpen={shareIsOpen}
            setIsOpen={setShareIsOpen}
            title="Grant Access to Stamp"
            onConfirm={async () => {
              return Promise.all([
                getStampContract({
                  web3,
                  address: stamp.address,
                  version: stamp.version,
                }),
                resolveAddress(userAddress, web3),
              ])
                .then(([contract, ethAddress]) =>
                  ethAddress
                    ? new Promise<void>((resolve, reject) =>
                        contract.methods
                          .grantAdmin(ethAddress)
                          .send({ from: address })
                          .on("receipt", () => {
                            axios
                              .put("/api/admin/stamp", {
                                address: ethAddress,
                                contract: stamp.address,
                                chain: chainId,
                              })
                              .then(() => {
                                setUserAddress("");
                                resolve();
                              });
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
            hideCloseIcon
            isOpen={airDropIsOpen}
            setIsOpen={setAirDropIsOpen}
            title="Airdrop Passports"
            onConfirm={() => {
              return getStampContract({
                web3,
                address: stamp.address,
                version: stamp.version,
              })
                .then((contract) =>
                  Promise.all(
                    airdropAddrList.map((addr) => resolveAddress(addr, web3))
                  ).then(
                    (addrList) =>
                      new Promise<void>((resolve, reject) =>
                        contract.methods
                          .airdrop(addrList)
                          .send({
                            from: address,
                          })
                          .on("receipt", (receipt: TransactionReceipt) => {
                            const transferEvents = receipt.events?.["Transfer"];
                            const transfers = Array.isArray(transferEvents)
                              ? transferEvents
                              : [transferEvents];
                            const tokens = transfers.map((t) => ({
                              tokenId: t?.returnValues?.tokenId as string,
                              address: t?.returnValues?.to as string,
                            }));
                            const mintIndex =
                              (receipt.events?.["Airdrop"]
                                ?.returnValues?.[1] as number) || 0;
                            axios
                              .post("/api/stamps", {
                                chain: chainId,
                                tokens,
                                contract: stamp.address,
                              })
                              .then((r) => {
                                setToastMessage("Airdrop Successful!");
                                setStamp({
                                  ...stamp,
                                  mintIndex,
                                });
                                setAirDropIsOpen(false);
                                resolve();
                              });
                          })
                          .on("error", (e: Error) => {
                            setToastMessage(`ERROR: ${e.message}`);
                            reject(e);
                          })
                      )
                  )
                )
                .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
            }}
          >
            <div>
              {" "}
              {`All the addresses should be under column named "address". An optional "quantity" column could be added for airdropping multiple stamps per address."`}{" "}
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
                          const addrsInCsv = results.data.map((result) => ({
                            address: result["address"],
                            quantity: result["quantity"],
                          }));
                          const relevantAddr = addrsInCsv.flatMap((a) =>
                            !a.address
                              ? ([] as string[])
                              : Array(Number(a.quantity) || 1)
                                  .fill(null)
                                  .map(() => a.address)
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
          <Modal
            hideCloseIcon
            isOpen={pauseIsOpen}
            setIsOpen={setPauseIsOpen}
            title={stamp.paused ? "Unpause Stamp" : "Pause Stamp"}
            onConfirm={async () => {
              return getStampContract({
                web3,
                address: stamp.address,
                version: stamp.version,
              })
                .then(
                  (contract) =>
                    new Promise<void>((resolve, reject) => {
                      const sendMethod = stamp.paused
                        ? contract.methods.unpause?.()
                        : contract.methods.pause?.();
                      if (!sendMethod) {
                        throw new Error(
                          "This stamp is on an older version that does not support pausing/unpausing"
                        );
                      } else {
                        return sendMethod
                          .send({ from: address })
                          .on("receipt", () => {
                            const newPauseValue = !stamp.paused;
                            setToastMessage(
                              `Successfully ${
                                newPauseValue ? "paused" : "unpaused"
                              } the stamp.`
                            );
                            setStamp({
                              ...stamp,
                              paused: newPauseValue,
                            });
                            resolve();
                          })
                          .on("error", reject);
                      }
                    })
                )
                .catch((e) => setToastMessage(`ERROR: ${e.message}`));
            }}
          >
            <p>
              {stamp.paused
                ? "Are you sure you want to unpause the Stamp? Doing so would allow anyone to buy one"
                : "Are you sure you want to pause the Stamp? Doing so would prevent anyone from buying one."}
            </p>
          </Modal>
        </div>
      </StampHeader>
      <StampName>
        {stamp.name}
        <br />({stamp.symbol})
      </StampName>
      <StampCardDivider />
      <StampCardRow>
        <span>BALANCE</span>
        <StampCardValue>
          {((Number(balance) * 39) / 40).toFixed(2)} ETH
          <Tooltip content={"Withdraw"}>
            <Button
              type={"icon"}
              disabled={balance === "0"}
              onClick={(e) => {
                getStampContract({
                  web3,
                  address: stamp.address,
                  version: stamp.version,
                }).then((contract) =>
                  (contract.methods.claimEth() as ContractSendMethod)
                    .send({ from: address })
                    .on("receipt", () => {
                      setToastMessage(`Successfully Claimed ${balance} ETH!`);
                      setBalance("0");
                    })
                );
                e.stopPropagation();
              }}
            >
              <ExitIcon color={theme.colors.wheat} width={12} height={12} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>
      <StampCardRow>
        <span>MINTED</span>
        <StampCardValue>
          {stamp.mintIndex}
          <Tooltip content={"Copy checkout link"}>
            <Button
              onClick={(e) => {
                window.navigator.clipboard.writeText(
                  `${window.location.origin}/checkout/${
                    networkNameById[Number(networkId)]
                  }/${stamp.address}`
                );
                setToastMessage("Copied checkout link!");
                e.stopPropagation();
              }}
              type="icon"
            >
              <Link1Icon width={12} height={12} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>
      <EditableStampCardRow
        field={"supply"}
        stamp={stamp}
        setStamp={setStamp}
      />
      <EditableStampCardRow
        field={"price"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={" ETH"}
      />
      <EditableStampCardRow
        field={"royalty"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={"%"}
      />
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </StampCardContainer>
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

const CreateStampContainer = styled("div", {
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

const CreateStampHeader = styled("h1", {
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

const StampImageLabel = styled("label", {
  textTransform: "uppercase",
  fontSize: "14px",
  lineHeight: "18px",
  fontWeight: 600,
  fontFamily: "$mono",
  marginBottom: "24px",
});

const FileInput = styled("div", {
  color: "#8B9389",
  cursor: "pointer",
  textOverflow: "ellipsis",
  overflow: "hidden",
  "> span": {
    marginRight: "10px !important",
    display: "inline",
  },
});

const CardImageContainer = styled("div", {
  width: "80px",
  height: "56px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  "> span": {
    border: "1px solid $forest !important",
    borderRadius: "20px",
  },
});

const StampImageContainer = styled("div", {
  height: "176px",
  width: "100%",
  border: "1px solid $forest !important",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "32px",
});

const LoadingContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  margin: "64px 0",
  justifyContent: "center",
});

const EtherscanContainer = styled("a", {
  display: "flex",
  alignItems: "center",
  fontFamily: "$mono",
  fontSize: "16px",
  margin: "16px 0",
  textTransform: "uppercase",
  color: "$forest",
  gap: "16px",
  cursor: "pointer",
  textDecoration: "none",
  justifyContent: "center",
  span: {
    textDecoration: "underline",
  },
});

const InitialStampScreen = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: "24px",
})

const CreateStampModal = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [royaltyPcnt, setRoyaltyPcnt] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [stage, setStage] = useState(0);
  const [fileName, setFileName] = useState("");
  const [cid, setCid] = useState("");
  const [additionalFields, setAdditionalFields] = useState<
    { key: string; value: string }[]
  >([]);
  const [txHash, setTxHash] = useState("");
  const onClose = useCallback(() => {
    setName("");
    setSymbol("");
    setQuantity("0");
    setPrice("0");
    setIsPrivate(false);
    setStage(0);
    setCid("");
    setAdditionalFields([]);
    setFileName("");
    setRoyaltyPcnt("");
  }, [
    setName,
    setCid,
    setIsPrivate,
    setSymbol,
    setStage,
    setQuantity,
    setPrice,
    setAdditionalFields,
    setFileName,
    setRoyaltyPcnt,
  ]);
  const onFinalConfirm = useCallback(() => {
    return ipfsAdd(
      JSON.stringify({
        ...Object.fromEntries(
          additionalFields.map(({ key, value }) => [key, value])
        ),
        ...(cid ? { thumbnail: cid } : {}),
      })
    ).then((metadataHash) => {
      const weiPrice = web3.utils.toWei(price || "0", "ether");
      const royalty = Number(royaltyPcnt || "0") * 100;
      return axios.get(`/api/abi?contract=stamp`).then((r) => {
        const passportJson = r.data;
        const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
        return contract
          .deploy({
            data: passportJson.bytecode,
            arguments: [
              name,
              symbol,
              quantity || "0",
              weiPrice,
              ipfsHashToBytes32(metadataHash),
              royalty,
              isPrivate,
              1,
            ],
          })
          .send({ from: address })
          .on("transactionHash", (transactionHash) => {
            setTxHash(transactionHash);
            setStage(2);
          })
          .then((c) => {
            const contractAddress = c.options.address;
            return axios
              .post(`/api/admin/stamp`, {
                address,
                contract: contractAddress,
                chain: chainId,
                version: passportJson.version,
                files: [cid, metadataHash],
              })
              .then(() => {
                router.push(`/stamps/${contractAddress}`);
                onClose();
              });
          });
      });
    });
  }, [
    symbol,
    name,
    quantity,
    price,
    royaltyPcnt,
    web3,
    address,
    additionalFields,
    cid,
    isPrivate,
    chainId,
    onClose,
    router,
  ]);
  const stageConfirms = [
    () => {
      setStage(1);
      return true;
    },
    onFinalConfirm,
  ];
  const stageTitles = [
    "Enter Stamp Details",
    <>
      <Button
        onClick={() => {
          setStage(0);
        }}
        type={"icon"}
      >
        <ArrowLeftIcon width={20} height={20} color={theme.colors.wheat} />
      </Button>
      <span style={{ marginRight: 16, display: "inline-block" }} />
      Review Stamp Details
    </>,
    "Deploying Stamp Contract",
  ];
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={open} type="primary" disabled={!address} tone={"wheat"}>
        Create new stamp
      </Button>
      <Modal
        hideCloseIcon
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={stageTitles[stage]}
        onConfirm={stageConfirms[stage]}
        confirmText={stage === 1 ? "Create" : "Next"}
        onCancel={onClose}
        disabled={!isReady && stage === 1}
        hideFooter={stage === 2}
      >
        <ModalContent>
          {stage === 0 && (
            <InitialStampScreen>
              <ModalInput
                label={"Name"}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSymbol(e.target.value.slice(0, 3).toUpperCase());
                }}
                placeholder="Enter stamp name"
                helpText="This is a unique human-readable name to identify the Stamp."
              />
              <ModalInput
                label={"Symbol"}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter stamp symbol"
                helpText="This is a unique capitalized abbreviation to represent the Stamp."
              />
              {/*<ShortInputContainer>
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
              </ShortInputContainer>}
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
                      )
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
              </div>*/}
              <div>
                <StampImageLabel>Stamp Image</StampImageLabel>
                <FileInput onClick={() => fileRef.current?.click()}>
                  <input
                    ref={fileRef}
                    type={"file"}
                    accept="video/*,image/*"
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
              </div>
            </InitialStampScreen>
          )}
          {stage === 1 && (
            <>
              <SummaryRow>
                <SummaryCell field="Name" value={name} grow={2} />
                <SummaryCell field="Symbol" value={symbol} />
              </SummaryRow>
              {/* <SummaryRow>
                <SummaryCell field="Quantity" value={quantity} />
                <SummaryCell field="Price" value={`${price} ETH`} />
                <SummaryCell field="Royalty" value={`${royaltyPcnt}%`} />
              </SummaryRow> */}
              {cid && (
                <>
                  <Label label={"Stamp Image"} />
                  <StampImageContainer>
                    <IpfsAsset
                      cid={cid}
                      height={"100%"}
                      width={"100%"}
                      id={"new-stamp-image"}
                    />
                  </StampImageContainer>
                </>
              )}
              {/* <Label
                label="Private Stamp"
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
              </Label> */}
              <Label
                label="Confirmation"
                description="After this contract is deployed some inputs are unable to be changed. Are you sure you want to continue?"
              >
                <Checkbox
                  checked={isReady}
                  onCheckedChange={(b) =>
                    b === "indeterminate" ? setIsReady(false) : setIsReady(b)
                  }
                />
              </Label>
            </>
          )}
          {stage === 2 && (
            <>
              <Label label={`${name} (${symbol})`} />
              <StampImageContainer>
                <IpfsAsset
                  cid={cid}
                  height={"100%"}
                  width={"100%"}
                  id={"new-stamp-image"}
                />
              </StampImageContainer>
              <LoadingContainer>
                <Loading />
              </LoadingContainer>
              <EtherscanContainer
                href={`https://${
                  networkNameById[chainId] === "ethereum"
                    ? ""
                    : `${networkNameById[chainId]}.`
                }etherscan.io/tx/${txHash}`}
                target={"_blank"}
                rel={"noreferrer"}
              >
                <span>View on etherscan</span>
                <ArrowRightIcon />
              </EtherscanContainer>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

const StampTabContent = () => {
  const [stamps, setStamps] = useState<IStampProps[]>([]);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [customizations, setCustomizations] = useState<
    Record<string, Record<string, string>>
  >({});
  useEffect(() => {
    // Fetch the relevant redirection URLs on page load.
    const stampAddrs = stamps.map((m) => m.address);
    if (stamps.length > 0) {
      axios
        .post("/api/customizations", {
          addresses: stampAddrs,
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
  }, [stamps, setCustomizations]);
  useEffect(() => {
    if (address && chainId) {
      getAllManagedStamps({ web3, chainId, from: address })
        .then((r) => {
          setStamps(
            r.map(({ address, version }) => ({
              address,
              name: "",
              symbol: "",
              supply: 0,
              mintIndex: 0,
              price: "0",
              metadataHash: "",
              royalty: 0,
              isPrivate: false,
              version,
              paused: false,
            }))
          );
        })
        .catch(console.error);
    }
  }, [web3, chainId, address]);
  return (
    <>
      {stamps.length ? (
        <ViewStampContainer>
          <StampContainer>
            {stamps.map((m) => (
              <StampCard
                key={`${chainId}-${m.address}`}
                {...m}
                customization={customizations[m.address] || {}}
              />
            ))}
          </StampContainer>
          <ViewStampFooter>
            <CreateStampModal />
          </ViewStampFooter>
        </ViewStampContainer>
      ) : (
        <CreateStampContainer>
          <CreateStampHeader>Get started using stamps</CreateStampHeader>
          <CreateStampModal />
        </CreateStampContainer>
      )}
    </>
  );
};

const StampsPage = () => {
  return (
    <Layout>
      <StampTabContent />
    </Layout>
  );
};

export default StampsPage;
