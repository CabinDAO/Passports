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
      const adminStampsCol = collection(db, "admin_stamps");
      const versionsCol = collection(db, "versions");
      return Promise.all([
        getDocs(
          query(
            adminStampsCol,
            where("address", "==", (req.query.address as string).toLowerCase()),
            where("chain", "==", Number(req.query.chain))
          )
        ),
        getDocs(
          query(
            versionsCol,
            where("contract", "==", "stamp"),
            where("chain", "==", Number(req.query.chain))
          )
        ),
      ])
        .then(([memberships, versions]) => {
          const versionByContract = Object.fromEntries(
            versions.docs
              .map((d) => d.data())
              .map((data) => [data["address"], data["version"]])
          );
          res.status(200).json({
            contracts: memberships.docs.map((doc) => {
              const docData = doc.data();
              const address = docData["contract"] as string;
              return {
                address,
                version: versionByContract[address],
              };
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
