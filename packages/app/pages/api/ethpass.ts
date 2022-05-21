import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractSendMethod } from "web3-eth-contract";
import axios from "axios";
import { networkIdByName } from "../../components/constants";
import { getStampContract } from "../../components/backend";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      const {
        address,
        network,
        tokenId,
        signature,
        signatureMessage,
        platform,
      } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      return getStampContract({ address, network })
        .then(({ contract }) =>
          (contract.methods.symbol() as ContractSendMethod).call()
        )
        .then((description) => {
          const body = {
            contractAddress: address,
            chainId: networkIdByName[network],
            tokenId,
            signature,
            signatureMessage,
            platform,
            templateId: process.env.ETHPASS_TEMPLATE_ID,
            barcode: {
              message:
                "Thanks for participating at Cabin’s first inaugural GUILD GAMES!",
            },
            pass: {
              description,
              headerFields: [
                {
                  key: "header1",
                  value: "DEMO PASS",
                  textAlignment: "PKTextAlignmentNatural",
                },
              ],
            },
          };
          return axios.post("https://api.ethpass.xyz/api/v0/passes", body, {
            headers: {
              "X-API-KEY": process.env.ETHPASS_API_KEY || "",
            },
          });
        })
        .then((r) => {
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
