import axios from "axios";
import Web3 from "web3";
// @ts-ignore They don't have a types file available -.-
import namehash from "@ensdomains/eth-ens-namehash";
import { getAbiFromJson } from "./constants";
import b58 from "b58";

export const ipfsAdd = (s: string | Blob) => {
  const formData = new FormData();
  formData.append("files", s);
  return axios
    .post<{ Hash: string }>(
      "https://ipfs.infura.io:5001/api/v0/add",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    .then((r) => r.data.Hash);
};

export const ipfsHashToBytes32 = (s: string) => `0x${b58.decode(s).slice(2).toString('hex')}`;
export const bytes32ToIpfsHash = (s: string) =>  {
  const hashHex = "1220" + s.slice(2)
  const hashBytes = Buffer.from(hashHex, 'hex');
  const hashStr = b58.encode(hashBytes)
  return hashStr
};

export const resolveAddress = (addr: string, web3: Web3) =>
  addr.endsWith(".eth")
    ? web3.eth.ens.getAddress(addr).catch(() => "")
    : addr.startsWith("0x")
    ? Promise.resolve(addr)
    : Promise.resolve("");

export const lookupAddress = async (
  addr: string,
  web3: Web3
): Promise<string> => {
  const lookup = addr.toLowerCase().substr(2) + ".addr.reverse";
  return web3.eth.ens
    .resolver(lookup)
    .then((ResolverContract) => {
      const nh = namehash.hash(lookup);
      return ResolverContract.methods.name(nh).call();
    })
    .catch(() => addr);
};

export const getAllManagedStamps = ({
  web3, // web3 is unused for now - but we might need it when we migrate from firebase to the graph or some other blockchain indexer
  chainId,
  from,
}: {
  web3: Web3;
  chainId: number;
  from: string;
}) => {
  return axios
    .get<{ contracts: { address: string; version: string }[] }>(
      `/api/admin/stamps?address=${from}&chain=${chainId}`
    )
    .then((s) => s.data.contracts);
};

const versionCache: Record<string, Parameters<typeof getAbiFromJson>[0]> = {};

export const getStampContract = ({
  web3,
  address,
  version,
}: {
  web3: Web3;
  address: string;
  version: string;
}) =>
  (versionCache[version]
    ? Promise.resolve(versionCache[version])
    : axios.get(`/api/abi?contract=stamp&version=${version}`).then(r => r.data)
  ).then((r) => {
    versionCache[version] = r;
    const contract = new web3.eth.Contract(getAbiFromJson(r));
    contract.options.address = address;
    return contract;
  });
