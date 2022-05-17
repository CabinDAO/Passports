import {
  Box,
  Button,
  Input,
  Label,
  Modal,
  styled,
  theme,
  Toast,
  Tooltip,
} from "@cabindao/topo";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import {
  bytes32ToIpfsHash,
  getStampContract,
  ipfsAdd,
  resolveAddress,
} from "../../components/utils";
import { useAddress, useChainId, useWeb3 } from "../../components/Web3Context";
import Layout from "../../components/Layout";
import StampHeader from "../../components/StampHeader";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "../../components/tabs";
import { GetServerSideProps } from "next";
import Papa from "papaparse";
import { networkNameById } from "../../components/constants";
import IpfsAsset from "../../components/IpfsAsset";
import Loading from "../../components/Loading";
import PageTitle from "../../components/PageTitle";
import {
  Pencil1Icon,
  Share1Icon,
  Pencil2Icon,
  PlayIcon,
  PauseIcon,
  OpacityIcon,
  ExitIcon,
  Link1Icon,
} from "@radix-ui/react-icons";
import type { ContractSendMethod } from "web3-eth-contract";
import type { TransactionReceipt } from "web3-core";
import { lookupAddress } from "../../components/utils";

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
  minHeight: "440px",
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
  customization: Record<string, string>;
  balance: string;
  thumbnail: string;
  metadata: Record<string, string>;
}

const StampCard = (props: IStampProps) => {
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
  const [fileLoading, setFileLoading] = useState(false);
  const chainId = useChainId();
  useEffect(() => {
    if (!stamp.name) {
      Promise.all([
        getStampContract({
          web3,
          address: stamp.address,
          version: stamp.version,
        }).then((contract) =>
          (contract.methods.get() as ContractSendMethod).call()
        ),
        axios
          .post("/api/customizations", {
            addresses: [stamp.address],
          })
          .then(
            (result: {
              data: { customizations: Record<string, Record<string, string>> };
            }) => {
              return result.data["customizations"][stamp.address] || {};
            }
          ),
        web3.eth.getBalance(stamp.address),
      ]).then(([p, customization, balance]) => {
        const metadataHash = bytes32ToIpfsHash(p[5]);
        axios
          .get(`https://ipfs.io/ipfs/${metadataHash}`)
          .then((r) => {
            return r.data;
          })
          .then(({ thumbnail, ...metadata }) =>
            setStamp({
              address: stamp.address,
              name: p[0],
              symbol: p[1],
              supply: Number(p[2]),
              mintIndex: Number(p[3]),
              price: web3.utils.fromWei(p[4], "ether"),
              metadataHash,
              royalty: p[6] / 100,
              version: stamp.version,
              isPrivate: p[7],
              paused: p[9] || false,
              customization,
              thumbnail,
              metadata,
              balance: web3.utils.fromWei(balance, "ether"),
            })
          );
      });
    }
  }, [setStamp, stamp, web3]);
  const [toastMessage, setToastMessage] = useState("");
  return (
    <StampCardContainer>
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
              redirect_url: stamp.customization.url,
              contractAddr: stamp.address,
              brand_color: stamp.customization.brandColor,
              accent_color: stamp.customization.accColor,
              text_color: stamp.customization.textColor,
              button_txt: stamp.customization.buttonTxt,
              logo_cid: stamp.customization.logoCid,
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
              value={stamp.customization.url}
              onChange={(e) =>
                setStamp({
                  ...stamp,
                  customization: {
                    ...stamp.customization,
                    url: e.target.value,
                  },
                })
              }
            />
            <ModalInputBox>
              <ModalInputLabel htmlFor="bcolor">Brand color:</ModalInputLabel>
              <input
                type="color"
                id="bcolor"
                name="bcolor"
                value={stamp.customization.brandColor || "#fdf3e7"}
                onChange={(e) =>
                  setStamp({
                    ...stamp,
                    customization: {
                      ...stamp.customization,
                      brandColor: e.target.value,
                    },
                  })
                }
              ></input>
            </ModalInputBox>
            <ModalInputBox>
              <ModalInputLabel htmlFor="acolor">Accent color:</ModalInputLabel>
              <input
                type="color"
                id="acolor"
                name="acolor"
                value={stamp.customization.accColor || "#324841"}
                onChange={(e) =>
                  setStamp({
                    ...stamp,
                    customization: {
                      ...stamp.customization,
                      accColor: e.target.value,
                    },
                  })
                }
              ></input>
            </ModalInputBox>
            <ModalInputBox>
              <ModalInputLabel htmlFor="acolor">Text color:</ModalInputLabel>
              <input
                type="color"
                id="textColor"
                name="textColor"
                value={stamp.customization.textColor || "#ffffff"}
                onChange={(e) =>
                  setStamp({
                    ...stamp,
                    customization: {
                      ...stamp.customization,
                      textColor: e.target.value,
                    },
                  })
                }
              ></input>
            </ModalInputBox>
            <ModalInput
              label={"Button Text"}
              value={stamp.customization.buttonTxt}
              onChange={(e) =>
                setStamp({
                  ...stamp,
                  customization: {
                    ...stamp.customization,
                    buttonTxt: e.target.value,
                  },
                })
              }
            />
            <ModalInputBox>
              <Label
                label={
                  stamp.customization.logoCid ? "Change Logo" : "Upload Logo"
                }
              >
                <input
                  type={"file"}
                  accept="video/*,image/*"
                  onChange={async (e) => {
                    if (e.target.files) {
                      setFileLoading(true);
                      const file = e.target.files[0];
                      if (file) {
                        return ipfsAdd(file)
                          .then((logoCid) =>
                            setStamp({
                              ...stamp,
                              customization: {
                                ...stamp.customization,
                                logoCid,
                              },
                            })
                          )
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
      {stamp.name ? (
        <>
          <StampName>
            {stamp.name}
            <br />({stamp.symbol})
          </StampName>
          <StampCardDivider />
          <StampCardRow>
            <span>BALANCE</span>
            <StampCardValue>
              {((Number(stamp.balance) * 39) / 40).toFixed(2)} ETH
              <Tooltip content={"Withdraw"}>
                <Button
                  type={"icon"}
                  disabled={stamp.balance === "0"}
                  onClick={(e) => {
                    getStampContract({
                      web3,
                      address: stamp.address,
                      version: stamp.version,
                    }).then((contract) =>
                      (contract.methods.claimEth() as ContractSendMethod)
                        .send({ from: address })
                        .on("receipt", () => {
                          setToastMessage(
                            `Successfully Claimed ${stamp.balance} ETH!`
                          );
                          setStamp({
                            ...stamp,
                            balance: "0",
                          });
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
                  <Link1Icon
                    width={12}
                    height={12}
                    color={theme.colors.wheat}
                  />
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
        </>
      ) : (
        <Loading />
      )}
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </StampCardContainer>
  );
};

type PageProps = {
  address: string;
};

const Container = styled("div");

const StampDetailPage = () => {
  const router = useRouter();
  const { address } = router.query;
  const [stamp, setStamp] = useState({});
  const chainId = useChainId();
  const web3 = useWeb3();

  console.log(address, chainId);

  useEffect(() => {
    //setShowLoading(true)
    axios
      .get(`/api/stamps?contract=${address}&chain=${chainId}`)
      .then((r) =>
        Promise.all(
          Object.entries(r.data.users).map(([addr, ids]) =>
            lookupAddress(addr, web3).then((addr) => [addr, ids]),
          ),
        ),
      )
      .then(console.log);
    //.then((entries) => setUsers(Object.fromEntries(entries)));
    //.finally(() => setShowLoading(false));
  });

  return (
    <Layout title={<PageTitle>Stamps / Stamp Name</PageTitle>}>
      <StampHeader />
      <Container css={{ pt: "2rem" }}>
        <Tabs>
          <TabList>
            <Tab active>Holders</Tab>
            <Tab disabled>Transactions</Tab>
            <Tab disabled>Settings</Tab>
          </TabList>
          <TabPanels>
            <TabPanel active>
              <h2>Panel 1</h2>
            </TabPanel>
            <TabPanel>
              <h2>Panel 2</h2>
            </TabPanel>
            <TabPanel>
              <h2>Panel 3</h2>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<
  PageProps,
  { address: string }
> = (context) => {
  // TODO: server side render a bunch of stamp data just like in the checkout page
  return Promise.resolve({
    props: context.params || { address: "" },
  });
};

export default StampDetailPage;
