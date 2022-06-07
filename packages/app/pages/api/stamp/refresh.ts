import type { NextApiRequest, NextApiResponse } from "next";
import { addPins, lsPins } from "../../../components/backend";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "PUT": {
      const { paths } =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      return lsPins(paths)
        .catch(() => [])
        .then((results) =>
          addPins(paths).then(() => {
            res.status(200).json({ success: true, results });
          })
        )
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });
    }
    default:
      res.setHeader("Allow", ["PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
