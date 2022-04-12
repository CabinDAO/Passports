import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore/lite";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../components/constants";

export const getCustomization = (address: string) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const urlCol = collection(db, "customizations");
  const membershipDoc = doc(urlCol, address);
  return getDoc(membershipDoc).then((membership) => {
    return { ...membership.data() };
  });
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      return getCustomization(req.body.address).then((data) =>
        res.status(200).json(data)
      );
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
