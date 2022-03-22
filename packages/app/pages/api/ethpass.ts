import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractSendMethod } from "web3-eth-contract";
import axios from "axios";
import { getWeb3 } from "../../components/utils";
import { getAbiFromJson, networkIdByName } from "../../components/constants";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      const { address, network, tokenId, signature, signatureMessage } =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const web3 = getWeb3(network);
      const contract = new web3.eth.Contract(
        getAbiFromJson(passportJson),
        address
      );
      return (contract.methods.symbol() as ContractSendMethod)
        .call()
        .then((description) => {
          const body = {
            contractAddress: address,
            chainId: networkIdByName[network],
            tokenId,
            signature,
            signatureMessage,
            platform: "apple",
            pass: {   
              description,
            },
          };
          return axios.post("https://api.ethpass.xyz/api/v0/passes", body, {
            headers: {
              "X-API-KEY": process.env.ETHPASS_API_KEY || "",
            },
          });
        })
        .then((r) => {
          console.log("Successfully created ethpass", r.data.id, 'at', r.data.fileURL);
          return res
            .status(200)
            .json({ fileURL: r.data.fileURL, id: r.data.id });
        })
        .catch((e) => res.status(500).send(e.response?.data || e.message));
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
