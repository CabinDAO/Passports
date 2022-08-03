import { initializeApp } from "firebase/app";
import { collection, doc, setDoc, getFirestore } from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { addPins } from "@/utils/backend";
import { firebaseConfig } from "@/utils/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const urlCol = collection(db, "customizations");
      const contractDoc = doc(urlCol, req.body.data["contractAddr"]);
      return (
        req.body.data.logo_cid ? addPins([req.body.data.logo_cid]) : addPins([])
      )
        .then(() => setDoc(contractDoc, req.body.data))
        .then(() => {
          res.status(200).json({});
        });
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
