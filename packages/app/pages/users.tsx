// TODO: refactor and delete out duplicate or unused code. A lot of this is copied from somewhere else
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { ContractSendMethod } from "web3-eth-contract";

import { Box, Label, Select, styled } from "@cabindao/topo";
import { useAddress, useChainId, useWeb3 } from "@/components/Web3Context";
import Layout from "@/layouts/CommunityLayout";

import { getAllManagedStamps, getStampContract } from "@/utils/stamps";
import { lookupAddress } from "@/utils/address";

interface StampDetail {
  name: string;
  symbol: string;
  supply: number;
  price: string;
  remaining: number;
}

interface StampDetailMap {
  [key: string]: StampDetail;
}

// TODO: refactor and/or delete out - all of this stuff is also in manage.tsx
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

const TokenId = styled("span", {
  margin: "0 4px",
});

// REFACTOR: merge <UserPage /> with <UserTabContent />
const UsersTabContent = () => {
  const [mAddresses, setMAddresses] = useState<
    Awaited<ReturnType<typeof getAllManagedStamps>>
  >([]);
  const [stampDetails, setStampDetails] = useState<StampDetailMap>({});
  const [users, setUsers] = useState<{ [key: string]: number[] }>({});
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    if (address && chainId) {
      setShowLoading(true);
      getAllManagedStamps({ web3, chainId, from: address })
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
      axios
        .get(`/api/stamps?contract=${selectedOption}&chain=${chainId}`)
        .then((r) =>
          Promise.all(
            Object.entries(r.data.users).map(([addr, ids]) =>
              lookupAddress(addr, web3).then((addr) => [addr, ids])
            )
          )
        )
        .then((entries) => setUsers(Object.fromEntries(entries)))
        .finally(() => setShowLoading(false));
    }
  }, [selectedOption, setUsers, chainId, web3]);

  useEffect(() => {
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
            const data: StampDetailMap = {};
            data[mAddr.address] = {
              name: p[0],
              symbol: p[1],
              supply: p[2],
              price: web3.utils.fromWei(p[3], "ether"),
              remaining: Number(p[2]) - Number(p[3]),
            };
            return data;
          });
      });
      Promise.all(promises)
        .then((values) => {
          const data = Object.assign({}, ...values);
          setStampDetails(data);
        })
        .finally(() => setShowLoading(false));
    } else {
      setStampDetails({});
    }
  }, [mAddresses, web3]);

  return (
    <>
      <SmallBox>
        {Object.keys(stampDetails).length > 0 ? (
          <Select
            label="Choose Stamp:"
            options={Object.keys(stampDetails).map((addr) => {
              return {
                key: addr,
                label: `${stampDetails[addr]["name"]} (${stampDetails[addr]["symbol"]})`,
              };
            })}
            onChange={(val) => setSelectedOption(val)}
            disabled={false}
          />
        ) : (
          <div>Please create some Stamps first!</div>
        )}
      </SmallBox>
      {showLoading ? <Label label={`Loading...`} /> : null}
      <TableBox>
        {selectedOption ? (
          <>
            <Label
              label={`Total supply: ${stampDetails[selectedOption]["supply"]}`}
            />
            <Label
              label={`Remaining supply: ${stampDetails[selectedOption]["remaining"]}`}
            />
            {Object.keys(users).length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Address</TableHeader>
                    <TableHeader>Stamp Ids</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(users).map((user) => {
                    return (
                      <tr key={user}>
                        <TableData>{user}</TableData>
                        <TableData>
                          {users[user].map((u) => (
                            <TokenId key={u}>{u}</TokenId>
                          ))}
                        </TableData>
                      </tr>
                    );
                  })}
                </tbody>
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
