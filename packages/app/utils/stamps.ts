import axios from "axios"
import { getAbiFromJson } from "@/utils/constants";

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
  