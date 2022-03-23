import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../../components/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      const { address, contract, chain, version } = req.body;
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const adminStampsCol = collection(db, "admin_stamps");
      const versionCol = collection(db, "versions");
      const contractDoc = doc(adminStampsCol);
      const versionDoc = doc(versionCol);
      return Promise.all([
        setDoc(contractDoc, { address, contract, chain }),
        setDoc(versionDoc, { address: contract, version, contract: "stamp", chain }),
      ])
        .then(() => {
          res.status(200).json({ success: true });
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
