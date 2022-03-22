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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const urlCol = collection(db, "admin_stamps");
      return getDocs(
        query(
          urlCol,
          where("address", "==", req.query.address),
          where("chain", "==", Number(req.query.chain))
        )
      )
        .then((memberships) => {
          res.status(200).json({
            addresses: memberships.docs.map((doc) => {
              const docData = doc.data();
              return docData["contract"] as string;
            }),
          });
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
