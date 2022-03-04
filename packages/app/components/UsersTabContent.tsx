import { Box, Label, Select } from "@cabindao/topo";
import { useEffect, useMemo, useState } from "react";
import type { Contract, ContractSendMethod } from "web3-eth-contract";
import { contractAddressesByNetworkId, getAbiFromJson } from "./constants";
import { useAddress, useChainId, useWeb3 } from "./Web3Context";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import { styled } from "@cabindao/topo";

interface MembershipDetail {
  name: string;
  symbol: string;
  supply: number;
  price: string;
}

interface MembershipDetailMap {
  [key: string]: MembershipDetail;
}

const SmallBox = styled(Box, {
  width: "25%",
  marginBottom: "15px",
});

const TableBox = styled(Box, {
  marginTop: "15px",
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

const UsersTabContent = () => {
  const [mAddresses, setMAddresses] = useState<string[]>([]);
  const [membershipDetails, setMembershipDetails] =
    useState<MembershipDetailMap>({});
  const [users, setUsers] = useState<{ [key: string]: number }>({});
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<string>("");
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
        .catch(console.error)
        .finally(() => setShowLoading(false));
    }
  }, [contractInstance, address, setMAddresses]);

  useEffect(() => {
    if (selectedOption) {
      setShowLoading(true);
      const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
      contract.options.address = selectedOption;
      // Get tokenIds which have been bought
      contract
        .getPastEvents("Transfer", {
          filter: {
            _from: "0x0000000000000000000000000000000000000000",
          },
          fromBlock: 0,
        })
        .then((events) => {
          const tokenIds = events.map((event) => event.returnValues.tokenId);
          return tokenIds;
        })
        .then((tokenIds) => {
          // Get the owner of each of these bought tokens
          const ownerPromises = tokenIds.map((tokenId) => {
            return contract.methods.ownerOf(tokenId).call();
          });
          Promise.all(ownerPromises)
            .then((ownerAddrs) => {
              const owners: { [key: string]: number } = {};
              ownerAddrs.forEach((ownerAddr) => {
                owners[ownerAddr] = owners[ownerAddr] + 1 || 1;
              });
              setUsers(owners);
            })
            .finally(() => setShowLoading(false));
        });
    }
  }, [selectedOption, setUsers, web3]);

  useEffect(() => {
    // Get details of all memberships to populate dropdown
    if (mAddresses.length > 0) {
      setShowLoading(true);
      const promises = mAddresses.map((mAddr) => {
        const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
        contract.options.address = mAddr;
        return (contract.methods.get() as ContractSendMethod)
          .call()
          .then((p) => {
            const data: MembershipDetailMap = {};
            data[mAddr] = {
              name: p[0],
              symbol: p[1],
              supply: p[2],
              price: web3.utils.fromWei(p[3], "ether"),
            };
            return data;
          });
      });
      Promise.all(promises)
        .then((values) => {
          const data = Object.assign({}, ...values);
          setMembershipDetails(data);
        })
        .finally(() => setShowLoading(false));
    } else {
      setMembershipDetails({});
    }
  }, [mAddresses, web3]);

  return (
    <>
      <SmallBox>
        {Object.keys(membershipDetails).length > 0 ? (
          <Select
            label="Choose Membership Type:"
            options={Object.keys(membershipDetails).map((addr) => {
              return {
                key: addr,
                label: `${membershipDetails[addr]["name"]} (${membershipDetails[addr]["symbol"]})`,
              };
            })}
            onChange={(val) => setSelectedOption(val)}
            disabled={false}
          />
        ) : (
          <div>Please create some Membership Types first!</div>
        )}
      </SmallBox>
      {showLoading ? <Label label={`Loading...`} /> : null}
      <TableBox>
        {selectedOption ? (
          <>
            <Label
              label={`Remaining supply: ${membershipDetails[selectedOption]["supply"]}`}
            />
            {Object.keys(users).length > 0 ? (
              <Table>
                <tr>
                  <TableHeader>Address</TableHeader>
                  <TableHeader>Passports owned</TableHeader>
                </tr>
                {Object.keys(users).map((user) => {
                  return (
                    <tr key={user}>
                      <TableData>{user}</TableData>
                      <TableData>{users[user]}</TableData>
                    </tr>
                  );
                })}
              </Table>
            ) : null}
          </>
        ) : null}
      </TableBox>
    </>
  );
};

export default UsersTabContent;
