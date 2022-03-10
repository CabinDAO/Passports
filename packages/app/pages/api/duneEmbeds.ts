import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore/lite';
import type { NextApiRequest, NextApiResponse } from 'next'
import { firebaseConfig } from '../../components/constants';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Create a connection to the firebase DB.
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    switch (req.method) {
        case "POST": {
            const dataCol = collection(db, 'dune-urls');
            const duneData = doc(dataCol, req.body.address)
            setDoc(duneData, req.body.data, {merge: true})
                .then(() => {
                    res.status(200).json({});
                });
            break;
        }
        case "GET": {
            const dataCol = collection(db, 'dune-urls');
            const duneData = doc(dataCol, req.query.address as string)
            getDoc(duneData).then((d) => {
                const data = d.data() || {};
                const urls = data[req.query.contractAddr as string] || [];
                res.status(200).json(urls);
            });
            break;
        }
        default:
            res.setHeader("Allow", ["POST"]);
            res.status(405).end(`Method ${req.method} Not Allowed`);
            break;
    }
}