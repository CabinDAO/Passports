import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../../components/constants";
import { getAdminStamps } from "../../../components/firebase";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
     return getAdminStamps({
        address: req.query.address as string,
        chainId: Number(req.query.chain),
      })
        .then((data) => {
          res.status(200).json(data);
        })
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
