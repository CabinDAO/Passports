import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Input,
  Label,
  Modal,
  Select,
  Toast,
  styled,
} from "@cabindao/topo";
import type { ContractSendMethod } from "web3-eth-contract";
import { useAddress, useChainId, useWeb3 } from "../components/Web3Context";
import { PlusIcon, MinusIcon } from "@radix-ui/react-icons";
import { TransactionReceipt } from "web3-core";
import Papa from "papaparse";
import {
  getAllManagedStamps,
  resolveAddress,
  getStampContract,
} from "../components/utils";
import Layout from "../components/CommunityLayout";

const SmallBox = styled(Box, {
  width: "25%",
  marginBottom: "15px",
});

const TableBox = styled(Box, {
  marginTop: "15px",
});

const ButtonBox = styled(Box, {
  marginBottom: "10px",
  marginTop: "10px",
});

const PlusButton = styled(Button, {
  marginRight: "10px",
});

const Table = styled("table", {
  border: "1px solid black",
  textAlign: "center",
});

const TableHeader = styled("th", {
  border: "1px solid black",
  padding: "10px",
});

const TableData = styled("td", {
  border: "1px solid black",
  padding: "10px",
});

const ModalInput = styled(Input, { paddingLeft: 8, marginBottom: 32 });

const ModalInputBox = styled(Box, { marginBottom: 25, marginTop: 20 });

interface StampDetail {
  name: string;
  symbol: string;
  supply: number;
  price: string;
}

interface StampDetailMap {
  [key: string]: StampDetail;
}

const ManageTabContent = () => {
  const [mAddresses, setMAddresses] = useState<
    Awaited<ReturnType<typeof getAllManagedStamps>>
  >([]);
  const versionByAddress = useMemo(
    () =>
      Object.fromEntries(
        mAddresses.map(({ address, version }) => [address, version])
      ),
    [mAddresses]
  );
  const [stampDetails, setStampDetails] =
    useState<StampDetailMap>({});
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [removeOpen, setRemoveOpen] = useState<boolean>(false);
  const [bulkAddOpen, setBulkAddOpen] = useState<boolean>(false);
  const [sAddr, setSAddr] = useState<string>("");
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [bulkAddrList, setBulkAddrList] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (address && chainId) {
      setShowLoading(true);
      getAllManagedStamps({ web3, from: address, chainId })
        .then((r) => {
          setMAddresses(r);
        })
        .then(() => {
          if (mAddresses.length > 0) {
            setShowLoading(true);
            const promises = mAddresses.map((mAddr) => {
              return getStampContract({
                web3,
                address: mAddr.address,
                version: mAddr.version,
              })
                .then((contract) =>
                  (contract.methods.get() as ContractSendMethod).call()
                )
                .then((p) => {
                  if (p[7]) {
                    const data: StampDetailMap = {};
                    data[mAddr.address] = {
                      name: p[0],
                      symbol: p[1],
                      supply: p[2] - p[3],
                      price: web3.utils.fromWei(p[4], "ether"),
                    };
                    return data;
                  } else {
                    return {};
                  }
                });
            });
            Promise.all(promises)
              .then((values) => {
                const data = Object.assign({}, ...values);
                setStampDetails(data);
              })
              .catch((e) => {
                setToastMessage(`ERROR: ${e.response?.data || e.message}`);
                setStampDetails({});
              })
              .finally(() => setShowLoading(false));
          } else {
            setStampDetails({});
          }
        })
        .catch((e) =>
          setToastMessage(`ERROR: ${e.response?.data || e.message}`)
        )
        .finally(() => setShowLoading(false));
    }
  }, [address, setMAddresses, mAddresses, web3, chainId]);

  useEffect(() => {
    // Get list of allowed minters for selected private passports
    if (selectedOption) {
      setShowLoading(true);
      getStampContract({
        web3,
        address: selectedOption,
        version: versionByAddress[selectedOption],
      })
        .then((contract) =>
          (contract.methods.getAllowedMinters() as ContractSendMethod)
            .call({
              from: address,
            })
            .then((addrs) => setAllowedUsers(addrs))
        )
        .catch((e) =>
          setToastMessage(`ERROR: ${e.response?.data || e.message}`)
        )
        .finally(() => setShowLoading(false));
    }
  }, [selectedOption, setAllowedUsers, web3, address, versionByAddress]);

  return (
    <>
      <Modal
        isOpen={addOpen}
        setIsOpen={setAddOpen}
        title="Add address"
        onConfirm={() => {
          return Promise.all([
            resolveAddress(sAddr, web3),
            getStampContract({
              web3,
              address: selectedOption,
              version: versionByAddress[selectedOption],
            }),
          ])
            .then(
              ([addr, contract]) =>
                new Promise<void>((resolve, reject) =>
                  contract.methods
                    .addMinters([addr])
                    .send({
                      from: address,
                    })
                    .on("receipt", () => {
                      setAllowedUsers([...allowedUsers, sAddr]);
                      setAddOpen(false);
                      setSAddr("");
                      resolve();
                    })
                    .on("error", reject)
                )
            )
            .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
        }}
      >
        <ModalInput
          label={"Address"}
          value={sAddr}
          onChange={(e) => setSAddr(e.target.value)}
        />
      </Modal>
      <Modal
        isOpen={removeOpen}
        setIsOpen={setRemoveOpen}
        title="Remove address"
        onConfirm={() => {
          return Promise.all([
            resolveAddress(sAddr, web3),
            getStampContract({
              web3,
              address: selectedOption,
              version: versionByAddress[selectedOption],
            }),
          ])
            .then(
              ([addr, contract]) =>
                new Promise<void>((resolve, reject) =>
                  contract.methods
                    .removeMinters([addr])
                    .send({
                      from: address,
                    })
                    .on("receipt", (receipt: TransactionReceipt) => {
                      const updatedUsers = allowedUsers.filter(
                        (user) => user !== sAddr
                      );
                      setAllowedUsers(updatedUsers);
                      setRemoveOpen(false);
                      setSAddr("");
                      resolve();
                    })
                    .on("error", reject)
                )
            )
            .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
        }}
      >
        <ModalInput
          label={"Address"}
          value={sAddr}
          onChange={(e) => setSAddr(e.target.value)}
        />
      </Modal>
      <Modal
        isOpen={bulkAddOpen}
        setIsOpen={setBulkAddOpen}
        title="Add addresses"
        onConfirm={() => {
          return getStampContract({
            web3,
            address: selectedOption,
            version: versionByAddress[selectedOption],
          })
            .then((contract) =>
              Promise.all(
                bulkAddrList.map((addr) => resolveAddress(addr, web3))
              ).then(
                (addrList) =>
                  new Promise<void>((resolve, reject) =>
                    contract.methods
                      .addMinters(addrList)
                      .send({
                        from: address,
                      })
                      .on("receipt", (receipt: TransactionReceipt) => {
                        setAllowedUsers([...bulkAddrList, ...allowedUsers]);
                        setBulkAddOpen(false);
                        setBulkAddrList([]);
                        resolve();
                      })
                      .on("error", reject)
                  )
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
                        (addr) => addr && !allowedUsers.includes(addr)
                      );
                      setBulkAddrList(relevantAddr);
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
      </Modal>
      <SmallBox>
        {Object.keys(stampDetails).length > 0 ? (
          <Select
            label="Choose Private Stamp:"
            options={Object.keys(stampDetails).map((addr) => {
              return {
                key: addr,
                label: `${stampDetails[addr]["name"]} (${stampDetails[addr]["symbol"]})`,
              };
            })}
            disabled={false}
            onChange={(val) => setSelectedOption(val)}
          />
        ) : (
          <div>Please create some Private Stamps first!</div>
        )}
      </SmallBox>
      {showLoading ? <Label label={`Loading...`} /> : null}

      <TableBox>
        {selectedOption ? (
          <>
            <ButtonBox>
              <PlusButton
                leftIcon={<PlusIcon />}
                onClick={() => setAddOpen(true)}
              />
              <Button
                leftIcon={<PlusIcon />}
                onClick={() => setBulkAddOpen(true)}
              >
                Upload CSV
              </Button>
            </ButtonBox>
            <ButtonBox>
              <PlusButton
                leftIcon={<MinusIcon />}
                onClick={() => setRemoveOpen(true)}
              />
            </ButtonBox>
            {allowedUsers.length > 0 ? (
              <Table>
                <tr>
                  <TableHeader>Allowed Addresses</TableHeader>
                </tr>
                {allowedUsers.map((user) => {
                  return (
                    <tr key={user}>
                      <TableData>{user}</TableData>
                    </tr>
                  );
                })}
              </Table>
            ) : (
              <div>No addresses allowed to mint yet!</div>
            )}
          </>
        ) : null}
      </TableBox>
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </>
  );
};

const ManagePage = () => {
  return (
    <Layout>
      <ManageTabContent />
    </Layout>
  );
};

export default ManagePage;
