import axios from "axios";

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
