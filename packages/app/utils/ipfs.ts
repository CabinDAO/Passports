import axios from "axios";
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

export const ipfsHashToBytes32 = (s: string) =>
  `0x${b58.decode(s).slice(2).toString("hex")}`;

export const bytes32ToIpfsHash = (s: string) => {
  const hashHex = "1220" + s.slice(2);
  const hashBytes = Buffer.from(hashHex, "hex");
  const hashStr = b58.encode(hashBytes);
  return hashStr;
};
