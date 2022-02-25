import axios from "axios";
import Web3 from "web3";
import NodeFormData from "form-data";

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

export const resolveAddress = (addr: string, web3: Web3) =>
  addr.endsWith(".eth")
    ? web3.eth.ens.getAddress(addr).catch(() => "")
    : addr.startsWith("0x")
    ? Promise.resolve(addr)
    : Promise.resolve("");

export const getWeb3 = (networkName: string) =>
  new Web3(
    networkName === "localhost"
      ? "http://localhost:8545"
      : `https://eth-${networkName}.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
  );
