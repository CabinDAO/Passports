import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../../components/constants";
import { create } from "ipfs-http-client";
import AbortController from "abort-controller";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  global.AbortController = AbortController;
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
        .then(() => {
          const client = create({
            host: "ipfs.infura.io",
            port: 5001,
            protocol: "https",
            headers: {
              authorization: `Basic ${Buffer.from(
                `${process.env.IPFS_INFURA_ID}:${process.env.IPFS_INFURA_SECRET}`
              ).toString("base64")}`,
            },
          });
          const addPin = (hash: string) => {
            return client.pin.add(hash);
          };
          return Promise.all(files.map(addPin));
        })
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
