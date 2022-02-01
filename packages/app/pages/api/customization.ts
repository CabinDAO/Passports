import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getFirestore } from 'firebase/firestore/lite';
import type { NextApiRequest, NextApiResponse } from 'next'
import { firebaseConfig } from '../../components/constants';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case "POST":
            // Create a connection to the firebase DB.
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const urlCol = collection(db, 'customizations');
            const membershipDoc = doc(urlCol, req.body.address)
            getDoc(membershipDoc).then((membership) => {
                const membershipData = membership.data();
                res.status(200).json(membershipData);
            });
            break;
        default:
            res.setHeader("Allow", ["POST"]);
            res.status(405).end(`Method ${req.method} Not Allowed`);
            break;
    }
}