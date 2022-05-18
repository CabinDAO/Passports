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
import { firebaseConfig } from "../../components/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const urlCol = collection(db, "stamps");

  switch (req.method) {
    case "GET":
      return getDocs(
        query(
          urlCol,
          where("contract", "==", (req.query.contract as string).toLowerCase()),
          where("chain", "==", Number(req.query.chain)),
        ),
      )
        .then((stamps) => {
          res.status(200).json({
            users: stamps.docs
              .map((doc) => {
                const docData = doc.data();
                return {
                  address: docData["address"] as string,
                  token: docData["token"] as number,
                };
              })
              .reduce((p, c) => {
                if (p[c.address]) {
                  p[c.address].push(c.token);
                } else {
                  p[c.address] = [c.token];
                }
                return p;
              }, {} as Record<string, number[]>),
          });
        })
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });

    case "POST":
      const { tokens, contract, chain } = req.body;
      return Promise.all(
        (tokens as { tokenId: string; address: string }[]).map((token) =>
          setDoc(doc(urlCol), {
            address: token.address.toLowerCase(),
            contract: contract.toLowerCase(),
            chain: Number(chain),
            token: Number(token.tokenId),
          }),
        ),
      )
        .then(() => {
          res.status(200).json({ success: true });
        })
        .catch((e) => {
          console.error(e);
          res.status(500).json({ message: e.message });
        });

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
