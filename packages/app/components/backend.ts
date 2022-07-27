import { create } from "ipfs-http-client";
import Web3 from "web3";
import { getAbiFromJson, networkIdByName } from "./constants";
import { getAbi, getVersionByAddress } from "./firebase";

export const getWeb3 = (networkName: string) =>
  new Web3(
    networkName === "localhost"
      ? "http://localhost:8545"
      : `https://${networkName}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
  );

const getIpfsClient = () =>
  create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: `Basic ${Buffer.from(
        `${process.env.IPFS_INFURA_ID}:${process.env.IPFS_INFURA_SECRET}`,
      ).toString("base64")}`,
    },
  });

export const addPins = (files: string[]) => {
  const client = getIpfsClient();
  const addPin = (hash: string) => {
    return client.pin.add(hash).catch((e) => {
      console.error(`Failed to pin hash ${hash}:`);
      console.error(e);
      return "";
    });
  };
  return Promise.all(files.map(addPin));
};

export const lsPins = async (paths: string[]) => {
  const client = getIpfsClient();
  const iter = client.pin.ls({ paths });
  const results = [];
  for await (const res of iter) {
    results.push(res);
  }
  return results;
};

export const getStampContract = ({
  network,
  address,
  web3 = getWeb3(network),
}: {
  network: string;
  address: string;
  web3?: Web3;
}) => {
  return getVersionByAddress(address, networkIdByName[network]).then(
    (version) => {
      return getAbi("stamp", version)
        .then((stampJson) => {
          return new web3.eth.Contract(getAbiFromJson(stampJson), address);
        })
        .then((contract) => ({ contract, version }))
        .catch((e) => {
          console.log("failed: getVersionByAddress", network);
          console.log("error: ", e);
        });
    },
  );
};
