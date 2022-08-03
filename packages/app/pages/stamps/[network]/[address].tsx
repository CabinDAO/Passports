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
} from "../../../components/utils";
import {
  useAddress,
  useChainId,
  useWeb3,
} from "../../../components/Web3Context";
import Layout from "../../../components/Layout";
import StampHeader from "../../../components/StampHeader";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "../../../components/tabs";
import { GetServerSideProps } from "next";
import Papa from "papaparse";
import {
  networkIdByName,
  networkNameById,
} from "../../../components/constants";
import PageTitle from "../../../components/PageTitle";
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
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  getStampContract as backendGetStampContract,
  getWeb3,
} from "../../../components/backend";
import { getCustomization } from "../../api/customization";
import { getStampOwners } from "../../../components/firebase";
import Link from "next/link";
import StampAPassport from "../../../components/StampAPassport";
import StampSettings from "../../../components/screens/StampSettings/";

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
            }).then((contract) => {
              // This is to account for the price being denominated in Ether
              // in the UI, but needs to be sent in Wei.
              let valueToSend =
                field === "price"
                  ? web3.utils.toBN(web3.utils.toWei("0.5"))
                  : value;
              console.log("valueToSend: ", typeof valueToSend, valueToSend);

              return new Promise<void>((resolve, reject) =>
                contract.methods[
                  `set${field.slice(0, 1).toUpperCase()}${field.slice(1)}`
                ](valueToSend)
                  .send({ from: address })
                  .on("receipt", () => {
                    setStamp({
                      ...stamp,
                      [field]: value,
                    });
                    resolve();
                  })
                  .on("error", reject)
              );
            });
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
  thumbnail: string;
  metadata: Record<string, string>;
  // based on query params - should prob separate into individual routes based on path params
  users?: Record<string, { tokens: number[]; name: string }>;
  userTotal?: number;
  transactions?: unknown[];
  balance?: string;
  customization?: Record<string, string>;
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
  const [toastMessage, setToastMessage] = useState("");

  return (
    <StampCardContainer>
      <div style={{ marginBottom: 16 }}>
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

const Container = styled("div");

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

const OwnerTable = styled("table", {
  textAlign: "left",
  fontWeight: 600,
  color: "$forest",
  textTransform: "capitalize",
  fontSize: "14px",
  fontFamily: "$mono",
  borderCollapse: "separate",
});

const OwnerTableRow = styled("tr", {
  borderBottom: "1px solid $forest",
});

const OwnerTableCell = styled("td", {
  padding: "4px 12px",
});

const PaginatedContainer = styled("td", {
  display: "flex",
  gap: "16px",
});

const OwnerTableHeaderCell = styled("td", {
  padding: "4px 12px",
});

const StampDetailPage = (props: IStampProps) => {
  const router = useRouter();
  const {
    tab = "owners",
    address,
    network,
    offset = "0",
    size = "10",
  } = router.query;
  const base = router.pathname
    .replace("[address]", address as string)
    .replace("[network]", network as string);
  const loadOwners = useCallback(
    () => router.push(`${base}?tab=owners`),
    [router, base]
  );
  const [pageLoading, setPageLoading] = React.useState<boolean>(false);
  React.useEffect(() => {
    const handleStart = () => {
      setPageLoading(true);
    };
    const handleComplete = () => {
      setPageLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
  }, [router, setPageLoading]);

  return (
    <Layout
      title={
        <PageTitle>
          <Link href={"/stamps"}>Stamps</Link> / {props.name}
        </PageTitle>
      }
      loading={pageLoading}
    >
      <StampHeader
        {...props}
        // TODO replace with a callback that edits UI directly
        onStampSuccess={loadOwners}
      />
      <Container css={{ pt: "2rem" }}>
        <Tabs>
          <TabList>
            <Tab active={!tab || tab === "owners"} onClick={loadOwners}>
              Owners
            </Tab>
            <Tab
              active={tab === "transactions"}
              onClick={() => router.push(`${base}?tab=transactions`)}
              disabled
            >
              Transactions
            </Tab>
            <Tab
              active={tab === "settings"}
              onClick={() => router.push(`${base}?tab=settings`)}
            >
              Settings
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel active={!tab || tab === "owners"}>
              {Object.keys(props.users || {}).length ? (
                <OwnerTable>
                  <thead>
                    <OwnerTableRow>
                      <OwnerTableHeaderCell css={{ width: "64px" }}>
                        ID
                      </OwnerTableHeaderCell>
                      <OwnerTableHeaderCell>NAME</OwnerTableHeaderCell>
                      <OwnerTableHeaderCell>ADDRESS</OwnerTableHeaderCell>
                    </OwnerTableRow>
                  </thead>
                  <tbody>
                    {Object.entries(props.users || {})
                      .flatMap(([addr, { tokens, name }]) =>
                        tokens.map((id) => [id, name, addr] as const)
                      )
                      .sort((a, b) => a[0] - b[0])
                      .map((a) => (
                        <OwnerTableRow key={a[0]}>
                          <OwnerTableCell>{a[0]}</OwnerTableCell>
                          <OwnerTableCell>{a[1]}</OwnerTableCell>
                          <OwnerTableCell>{a[2]}</OwnerTableCell>
                        </OwnerTableRow>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <OwnerTableCell />
                      <OwnerTableCell>
                        Page {Number(offset) / Number(size) + 1} of{" "}
                        {Math.ceil((props.userTotal || 0) / Number(size))}
                      </OwnerTableCell>
                      <OwnerTableCell>
                        <PaginatedContainer>
                          <Button
                            disabled={pageLoading || offset === "0"}
                            onClick={() => {
                              const params = new URLSearchParams({
                                offset: (
                                  Number(offset) - Number(size)
                                ).toString(),
                                tab: tab as string,
                              });
                              router.push(`${base}?${params.toString()}`);
                            }}
                          >
                            Prev
                          </Button>
                          <Button
                            disabled={
                              pageLoading ||
                              Number(offset) + Number(size) >=
                                (props.userTotal || 0)
                            }
                            onClick={() => {
                              const params = new URLSearchParams({
                                offset: (
                                  Number(offset) + Number(size)
                                ).toString(),
                                tab: tab as string,
                              });
                              router.push(`${base}?${params.toString()}`);
                            }}
                          >
                            Next
                          </Button>
                        </PaginatedContainer>
                      </OwnerTableCell>
                    </tr>
                  </tfoot>
                </OwnerTable>
              ) : (
                <CreateStampContainer>
                  <CreateStampHeader>
                    Get started using stamps
                  </CreateStampHeader>
                  <StampAPassport
                    label={`${props.name} (${props.symbol})`}
                    version={props.version}
                    address={props.address}
                    // TODO replace with a callback that edits UI directly
                    onStampSuccess={loadOwners}
                  />
                </CreateStampContainer>
              )}
            </TabPanel>
            <TabPanel active={tab === "transactions"}>
              <h2>Panel 2</h2>
            </TabPanel>
            <TabPanel active={tab === "settings"}>
              <Box>
                <Button
                  type={"icon"}
                  onClick={() =>
                    axios.put(`/api/stamp/refresh`, {
                      paths: [props.metadataHash, props.thumbnail],
                    })
                  }
                >
                  <ReloadIcon />
                </Button>
              </Box>
              <Box>
                <StampCard {...props} />
              </Box>
              <Box>
                <StampSettings {...props} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

type QueryParams = {
  address: string;
  network: string;
};

export const getServerSideProps: GetServerSideProps<
  IStampProps,
  QueryParams
> = (context) => {
  const { network = "", address = "" } = context.params || {};
  const web3 = getWeb3(network);
  const { tab = "", offset } = context.query;
  return Promise.all([
    backendGetStampContract({ address, web3, network }).then(
      ({ contract, version }) =>
        (contract.methods.get() as ContractSendMethod)
          .call()
          .then((data) => ({ data, version }))
    ),
    tab === "settings"
      ? Promise.all([
          getCustomization(address).then(),
          web3.eth
            .getBalance(address)
            .then((b) => web3.utils.fromWei(b, "ether")),
        ]).then(([customization, balance]) => ({ customization, balance }))
      : tab === "transactions" // TODO - SSR transactions
      ? { transactions: [] }
      : getStampOwners({
          contract: address,
          chain: networkIdByName[network],
          offset: Number(offset) || 0,
        }),
  ])
    .then(([{ data, version }, rest]) => {
      const metadataHash = bytes32ToIpfsHash(data[5]);
      return axios
        .get<{ thumbnail: string } & Record<string, string>>(
          `https://ipfs.io/ipfs/${metadataHash}`
        )
        .then((r) => r.data)
        .catch(() => ({} as Record<string, string>))
        .then(({ thumbnail = "", ...metadata }) => ({
          props: {
            address,
            name: data[0],
            symbol: data[1],
            supply: data[2] - data[3],
            price: web3.utils.fromWei(data[4], "ether"),
            thumbnail,
            network,
            version,
            limit: Number(data[8]),
            metadataHash,
            metadata,
            mintIndex: Number(data[3]),
            royalty: data[6] / 100,
            isPrivate: data[7],
            paused: data[9] || false,
            ...rest,
          },
        }));
    })
    .catch((e) => {
      console.error(e);
      return {
        notFound: true,
      };
    });
};

export default StampDetailPage;
