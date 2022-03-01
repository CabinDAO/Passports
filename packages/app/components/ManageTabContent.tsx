import {
  Box,
  Button,
  Input,
  Label,
  Modal,
  Select,
  Toast,
} from "@cabindao/topo";
import { useEffect, useMemo, useState } from "react";
import type { Contract, ContractSendMethod } from "web3-eth-contract";
import { contractAddressesByNetworkId, getAbiFromJson } from "./constants";
import { useAddress, useChainId, useWeb3 } from "./Web3Context";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import { styled } from "../stitches.config";
import { PlusIcon, MinusIcon } from "@radix-ui/react-icons";
import { TransactionReceipt } from "web3-core";
import Papa from "papaparse";
import { resolveAddress } from "./utils";

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

interface MembershipDetail {
  name: string;
  symbol: string;
  supply: number;
  price: string;
}

interface MembershipDetailMap {
  [key: string]: MembershipDetail;
}

const ManageTabContent = () => {
  const [mAddresses, setMAddresses] = useState<string[]>([]);
  const [membershipDetails, setMembershipDetails] =
    useState<MembershipDetailMap>({});
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
  const contractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(passportFactoryJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.passportFactory || "";
    return contract;
  }, [web3, chainId]);

  useEffect(() => {
    // Get all memberships assosciated with wallet
    if (contractInstance.options.address) {
      setShowLoading(true);
      (contractInstance.methods.getMemberships() as ContractSendMethod)
        .call({
          from: address,
        })
        .then((r: string[]) => {
          setMAddresses(r);
        })
        .then(() => {
          // Get details of all private memberships to populate dropdown
          if (mAddresses.length > 0) {
            setShowLoading(true);
            const promises = mAddresses.map((mAddr) => {
              const contract = new web3.eth.Contract(
                getAbiFromJson(passportJson)
              );
              contract.options.address = mAddr;
              return (contract.methods.get() as ContractSendMethod)
                .call()
                .then((p) => {
                  if (p[7]) {
                    const data: MembershipDetailMap = {};
                    data[mAddr] = {
                      name: p[0],
                      symbol: p[1],
                      supply: p[2],
                      price: web3.utils.fromWei(p[3], "ether"),
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
                setMembershipDetails(data);
              })
              .catch((e) => {
                setToastMessage(`ERROR: ${e.response?.data || e.message}`);
                setMembershipDetails({});
              })
              .finally(() => setShowLoading(false));
          } else {
            setMembershipDetails({});
          }
        })
        .catch((e) =>
          setToastMessage(`ERROR: ${e.response?.data || e.message}`)
        )
        .finally(() => setShowLoading(false));
    }
  }, [contractInstance, address, setMAddresses, mAddresses, web3]);

  useEffect(() => {
    // Get list of allowed minters for selected private passports
    if (selectedOption) {
      setShowLoading(true);
      const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
      contract.options.address = selectedOption;
      (contract.methods.getAllowedMinters() as ContractSendMethod)
        .call({
          from: address,
        })
        .then((addrs) => setAllowedUsers(addrs))
        .catch((e) =>
          setToastMessage(`ERROR: ${e.response?.data || e.message}`)
        )
        .finally(() => setShowLoading(false));
    }
  }, [selectedOption, setAllowedUsers, web3, address]);

  return (
    <>
      <Modal
        isOpen={addOpen}
        setIsOpen={setAddOpen}
        title="Add address"
        onConfirm={() => {
          const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
          contract.options.address = selectedOption;
          return resolveAddress(sAddr, web3)
            .then(
              (addr) =>
                new Promise<void>((resolve, reject) =>
                  contract.methods
                    .addMinters([addr])
                    .send({
                      from: address,
                    })
                    .on("receipt", (receipt: TransactionReceipt) => {
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
          const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
          contract.options.address = selectedOption;
          return resolveAddress(sAddr, web3)
            .then(
              (addr) =>
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
          const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
          contract.options.address = selectedOption;
          return Promise.all(
            bulkAddrList.map((addr) => resolveAddress(addr, web3))
          )
            .then(
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
        {Object.keys(membershipDetails).length > 0 ? (
          <Select
            label="Choose Private Passport:"
            options={Object.keys(membershipDetails).map((addr) => {
              return {
                key: addr,
                label: `${membershipDetails[addr]["name"]} (${membershipDetails[addr]["symbol"]})`,
              };
            })}
            disabled={false}
            onChange={(val) => setSelectedOption(val)}
          />
        ) : (
          <div>Please create some Private Passports first!</div>
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

export default ManageTabContent;
