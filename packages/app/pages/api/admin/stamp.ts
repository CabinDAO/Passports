import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { addPins } from "@/utils/backend";
import { firebaseConfig } from "@/utils/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST": {
      const {
        address,
        contract,
        chain,
        version,
        files = [],
      } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const adminStampsCol = collection(db, "admin_stamps");
      const versionCol = collection(db, "versions");
      const contractDoc = doc(adminStampsCol);
      const versionDoc = doc(versionCol);
      return Promise.all([
        setDoc(contractDoc, {
          address: address.toLowerCase(),
          contract: contract.toLowerCase(),
          chain,
        }),
        setDoc(versionDoc, {
          address: contract.toLowerCase(),
          version,
          contract: "stamp",
          chain,
        }),
      ])
        .then(() => addPins(files))
        .then(() => {
          res.status(200).json({ success: true });
        })
        .catch((e) => {
          res
            .status(e.response?.status || 500)
            .json({ message: e.response?.data || e.message });
        });
    }
    case "PUT": {
      const { address, contract, chain } =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const adminStampsCol = collection(db, "admin_stamps");
      const contractDoc = doc(adminStampsCol);
      return setDoc(contractDoc, {
        address: address.toLowerCase(),
        contract: contract.toLowerCase(),
        chain,
      })
        .then(() => {
          res.status(200).json({ success: true });
        })
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });
    }
    default:
      res.setHeader("Allow", ["POST", "PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
