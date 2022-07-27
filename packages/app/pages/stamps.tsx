import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ContractSendMethod } from "web3-eth-contract";
import {
  Modal,
  Input,
  Button,
  Label,
  Checkbox,
  styled,
  theme,
} from "@cabindao/topo";
import Image from "next/image";
import { getAbiFromJson, networkNameById } from "../components/constants";
import ClipSVG from "../components/icons/Clip.svg";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { useAddress, useChainId, useWeb3 } from "../components/Web3Context";
import axios from "axios";
import {
  bytes32ToIpfsHash,
  getAllManagedStamps,
  ipfsAdd,
  ipfsHashToBytes32,
} from "../components/utils";
import IpfsAsset from "../components/IpfsAsset";
import Layout from "../components/CommunityLayout";
import Loading from "../components/Loading";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next/types";
import { withServerSideAuth } from "@clerk/nextjs/ssr";
import { users } from "@clerk/clerk-sdk-node";
import { getAdminStamps } from "../components/firebase";
import Link from "next/link";
import { getWeb3, getStampContract } from "../components/backend";

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
  minHeight: "440px",
});

interface IStampProps {
  address: string;
  name: string;
  symbol: string;
  thumbnail: string;
  version: string;
}

const StampCard = (stamp: IStampProps) => {
  const chainId = useChainId();
  return (
    <StampCardContainer>
      <CardImageContainer>
        {stamp.thumbnail ? (
          <IpfsAsset cid={stamp.thumbnail} height={"100%"} width={"100%"} />
        ) : (
          <Image
            src={"/vercel.svg"}
            alt={"stock photo"}
            height={"100%"}
            width={"100&"}
          />
        )}
      </CardImageContainer>
      <StampCardDivider />
      <StampName>
        <Link href={`/stamps/${networkNameById[chainId]}/${stamp.address}`}>
          {stamp.name}
        </Link>
        <br />({stamp.symbol})
      </StampName>
    </StampCardContainer>
  );
};

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
  width: "100%",
  height: "160px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "40px",
  "> span": {
    border: "1px solid $forest !important",
    borderRadius: "10px",
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

const StampScreen = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

const ScreenTitle = styled("h1", {
  fontSize: "18px",
  fontWeight: "600",
  fontFamily: "$mono",
  textTransform: "uppercase",
  color: "#000000",
  margin: 0,
});

const ScreenDescription = styled("p", {
  fontSize: "18px",
  fontWeight: "400",
  fontFamily: "$mono",
  margin: 0,
});

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
    setStage(4);
    return ipfsAdd(
      JSON.stringify({
        ...Object.fromEntries(
          additionalFields.map(({ key, value }) => [key, value]),
        ),
        ...(cid ? { thumbnail: cid } : {}),
      }),
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
                router.push(
                  `/stamps/${networkNameById[chainId]}/${contractAddress}`,
                );
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
    setStage,
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
  const BackButton = useCallback(
    ({ index, children }: { index: number; children: React.ReactNode }) => (
      <>
        <Button
          onClick={() => {
            setStage(index - 1);
          }}
          type={"icon"}
        >
          <ArrowLeftIcon width={20} height={20} color={theme.colors.wheat} />
        </Button>
        <span style={{ marginRight: 16, display: "inline-block" }} />
        {children}
      </>
    ),
    [setStage],
  );
  const stageTitles = [
    "Enter Stamp Details",
    <BackButton index={1} key={1}>
      Enter Stamp Details
    </BackButton>,
    <BackButton index={2} key={2}>
      Enter Stamp Details
    </BackButton>,
    <BackButton index={3} key={3}>
      Review Stamp Details
    </BackButton>,
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
        confirmText={stage === 3 ? "Create" : "Next"}
        onCancel={onClose}
        disabled={!isReady && stage === 3}
        hideFooter={stage === 4}
      >
        <ModalContent>
          {stage === 0 && (
            <StampScreen>
              <ScreenTitle>1. Stamp Metadata</ScreenTitle>
              <ScreenDescription>
                Stamps need a name and symbol, both of which should be unique.
              </ScreenDescription>
              <ModalInput
                label={"Name"}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSymbol(e.target.value.slice(0, 3).toUpperCase());
                }}
                placeholder="Enter stamp name"
                helpText="The title of your stamp contract. This is how others will identify this stamp."
              />
              <ModalInput
                label={"Symbol"}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter stamp symbol"
                helpText="A unique way of identifying your stamp. Accronyms work well here."
              />
            </StampScreen>
          )}
          {stage === 1 && (
            <StampScreen>
              <ScreenTitle>2. Supply</ScreenTitle>
              <ScreenDescription>
                How many of this stamp would you like to issue?
              </ScreenDescription>
              <ModalInput
                label={"Supply"}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                }}
                placeholder="10"
                helpText="This field is optional. If you’re not sure, you can increase the supply later."
              />
            </StampScreen>
          )}
          {stage === 2 && (
            <StampScreen>
              <ScreenTitle>3. Image</ScreenTitle>
              <ScreenDescription>
                The image is what people will associate with this stamp. It is
                also what will show up in people’s wallets.
              </ScreenDescription>
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
            </StampScreen>
          )}
          {stage === 3 && (
            <StampScreen>
              <SummaryRow>
                <SummaryCell field="Name" value={name} grow={2} />
                <SummaryCell field="Symbol" value={symbol} />
                <SummaryCell field="Supply" value={quantity} />
              </SummaryRow>
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
            </StampScreen>
          )}
          {stage === 4 && (
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
              {txHash && (
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
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

const StampTabContent = ({ stamps }: { stamps: IStampProps[] }) => {
  return (
    <>
      {stamps.length ? (
        <ViewStampContainer>
          <StampContainer>
            {stamps.map((m) => (
              <StampCard key={m.address} {...m} />
            ))}
          </StampContainer>
          <ViewStampFooter>
            <CreateStampModal />
          </ViewStampFooter>
        </ViewStampContainer>
      ) : (
        <CreateStampContainer>
          <CreateStampHeader>
            You are not the the admin of any stamps
          </CreateStampHeader>
          <CreateStampModal />
        </CreateStampContainer>
      )}
    </>
  );
};

const StampsPage = ({ stamps }: { stamps: IStampProps[] }) => {
  return (
    <Layout>
      <StampTabContent stamps={stamps} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<
  { stamps: IStampProps[] },
  {}
> = withServerSideAuth(
  (context) => {
    const { user } = context.req;
    const userId = user?.id;
    if (!userId || !user) {
      return {
        redirect: {
          statusCode: 302,
          destination: "/",
        },
      };
    }
    const chainId = user.unsafeMetadata.chainId as number;
    if (!chainId) {
      return {
        redirect: {
          statusCode: 302,
          destination: "/",
        },
      };
    }
    const network = networkNameById[chainId];
    const web3 = getWeb3(network);
    return users
      .getUser(userId)
      .then((user) =>
        Promise.all(
          user.web3Wallets
            .map((wal) => wal.web3Wallet as string)
            .filter((addr) => !!addr)
            .map((address) =>
              getAdminStamps({
                address,
                chainId: user.unsafeMetadata.chainId as number,
              })
                .then(({ contracts }) =>
                  Promise.all(
                    contracts.map((c) => {
                      const start = new Date();
                      return getStampContract({
                        web3,
                        network,
                        address: c.address,
                      })
                        .then(({ contract }) =>
                          Promise.all([
                            (contract.methods.name() as ContractSendMethod)
                              .call()
                              .then((r) => r as string),
                            (contract.methods.symbol() as ContractSendMethod)
                              .call()
                              .then((r) => r as string),
                            (
                              contract.methods.metadataHash() as ContractSendMethod
                            )
                              .call()
                              .then((hash) => bytes32ToIpfsHash(hash))
                              .then((hash) =>
                                axios.get<{ thumbnail: string }>(
                                  `https://ipfs.io/ipfs/${hash}`,
                                ),
                              )
                              .then((r) => r.data.thumbnail)
                              .catch((e) => {
                                console.log(
                                  "failed: getting contract data",
                                  chainId,
                                  network,
                                );
                                console.log("error: ", e);
                              }),
                          ]),
                        )
                        .then(([name, symbol, thumbnail]) => {
                          console.log(
                            "took",
                            new Date().valueOf() - start.valueOf(),
                            "to load",
                            name,
                          );
                          return {
                            name,
                            symbol,
                            thumbnail,
                            version: c.version,
                            address: c.address,
                          };
                        })
                        .catch((e) => {
                          console.log(
                            "failed: getStampContract",
                            chainId,
                            network,
                          );
                          console.log("error: ", e);
                        });
                    }),
                  ),
                )
                .catch((e) => {
                  console.log("failed: getAdminStamps", chainId, network);
                  console.log("error: ", e);
                }),
            ),
        ),
      )
      .then((data) => {
        return {
          props: {
            stamps: data.flat(),
          },
        };
      })
      .catch((e) => {
        console.log(`failed: getUser`, chainId, network);
        console.log("error: ", e);
      });
  },
  { loadUser: true },
);

export default StampsPage;
