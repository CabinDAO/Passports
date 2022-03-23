import { Box, Label, Select } from "@cabindao/topo";
import { useEffect, useMemo, useState } from "react";
import type { ContractSendMethod } from "web3-eth-contract";
import { getAbiFromJson } from "../components/constants";
import { useAddress, useChainId, useWeb3 } from "../components/Web3Context";
import { styled } from "@cabindao/topo";
import Layout from "../components/Layout";
import {
  getAllManagedMemberships,
  getStampContract,
} from "../components/utils";

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
  const [mAddresses, setMAddresses] = useState<
    Awaited<ReturnType<typeof getAllManagedMemberships>>
  >([]);
  const versionByAddress = useMemo(
    () =>
      Object.fromEntries(
        mAddresses.map(({ address, version }) => [address, version])
      ),
    [mAddresses]
  );
  const [membershipDetails, setMembershipDetails] =
    useState<MembershipDetailMap>({});
  const [users, setUsers] = useState<{ [key: string]: number }>({});
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    // Get all memberships assosciated with wallet
    if (address && chainId) {
      setShowLoading(true);
      getAllManagedMemberships({ web3, chainId, from: address })
        .then((r) => {
          setMAddresses(r);
        })
        .catch(console.error)
        .finally(() => setShowLoading(false));
    }
  }, [web3, chainId, address, setMAddresses]);

  useEffect(() => {
    if (selectedOption) {
      setShowLoading(true);
      getStampContract({
        web3,
        address: selectedOption,
        version: versionByAddress[selectedOption],
      }).then((contract) =>
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
          })
      );
    }
  }, [selectedOption, setUsers, web3, versionByAddress]);

  useEffect(() => {
    // Get details of all memberships to populate dropdown
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
            const data: MembershipDetailMap = {};
            data[mAddr.address] = {
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

const UsersPage = () => {
  return (
    <Layout>
      <UsersTabContent />
    </Layout>
  );
};

export default UsersPage;
