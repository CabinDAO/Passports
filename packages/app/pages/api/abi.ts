import { initializeApp } from "firebase/app";
import { ref, getStorage, getBytes, list } from "firebase/storage";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../components/constants";
import { getAbi } from "../../components/firebase";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      const { contract, version } = req.query;
      return getAbi(contract as string, version as string)
        .then((abi) => {
          res.status(200).json({ ...abi, version });
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
