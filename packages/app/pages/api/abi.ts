import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getAbi } from "@/utils/firebase";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      const { contract, version } = req.query as Record<string, string>;
      return process.env.USE_LOCAL_CONTRACTS && !version
        ? Promise.resolve(
            fs
              .readFileSync(
                `../contracts/artifacts/contracts/${contract
                  .slice(0, 1)
                  .toUpperCase()}${contract
                  .slice(1)
                  .toLowerCase()}.sol/${contract
                  .slice(0, 1)
                  .toUpperCase()}${contract.slice(1).toLowerCase()}.json`
              )
              .toString()
          ).then((s) =>
            res.status(200).json({ ...JSON.parse(s), version: "localhost" })
          )
        : getAbi(contract, version)
            .then((abi) => {
              res.status(200).json(abi);
            })
            .catch((e) => {
              res.status(500).json({ message: e.message });
            });
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
