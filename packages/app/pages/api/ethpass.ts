import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractSendMethod } from "web3-eth-contract";
import axios from "axios";
import { getWeb3 } from "../../components/utils";
import { getAbiFromJson } from "../../components/constants";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address, network, tokenId, signature, signatureMessage } =
    typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  switch (req.method) {
    case "POST":
      const web3 = getWeb3(network);
      const contract = new web3.eth.Contract(
        getAbiFromJson(passportJson),
        address
      );
      return (contract.methods.symbol() as ContractSendMethod)
        .call()
        .then((description) =>
          axios.post(
            "https://api.ethpass.xyz.com/api/v1/pass",
            {
              contractAddress: address,
              tokenId,
              signature,
              signatureMessage,
              pass: {
                type: "generic",
                description,
              },
            },
            {
              headers: {
                "X-API-KEY": process.env.ETHPASS_API_KEY || "",
                "x-api-scope": "pass.com.ethpass",
              },
            }
          )
        )
        .then((r) => res.status(200).json(r.data))
        .catch((e) => res.status(500).send(e.response?.data || e.message));
    case "GET":
      return axios
        .get(
          `https://api.ethpass.xyz.com/api/v1/pass/status?contractAddress=${req.query.address}&tokenId=${req.query.tokenId}&passTypeIdentifier=generic`
        )
        .then((r) => res.status(200).json(r.data));
    default:
      res.setHeader("Allow", ["POST", "GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
