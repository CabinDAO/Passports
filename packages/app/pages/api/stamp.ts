import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ContractSendMethod } from "web3-eth-contract";

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

import { firebaseConfig, networkNameById } from "@/utils/constants";
import { bytes32ToIpfsHash } from "@/utils/ipfs";
import { getStampContract } from "@/utils/backend";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  switch (req.method) {
    case "POST":
      const { address, contract, chain, token } = req.body;
      const urlCol = collection(db, "stamps");
      const contractDoc = doc(urlCol);
      return setDoc(contractDoc, {
        address: address.toLowerCase(),
        contract: contract.toLowerCase(),
        chain: Number(chain),
        token: Number(token),
      })
        .then(() => {
          res.status(200).json({ success: true });
        })
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });

    case "GET":
      const {
        address: contractAddress,
        // token: stampToken - We would use this if we want to start actually differentiating between stamps
      } = req.query as Record<string, string>;
      const adminCol = collection(db, "admin_stamps");
      return getDocs(
        query(adminCol, where("contract", "==", contractAddress.toLowerCase())),
      ).then((data) => {
        if (!data.docs.length) {
          return res
            .status(409)
            .end(`Contract ${contractAddress} Missing From Firebase`);
        }
        const doc = data.docs[0].data();
        const networkId = doc["chain"];
        const networkName = networkNameById[networkId];
        return getStampContract({
          network: networkName,
          address: contractAddress,
        })
          .then(({ contract, version }) => {
            return Promise.all([
              (contract.methods.name() as ContractSendMethod)
                .call()
                .then((s) => ({ success: true, value: s as string }))
                .catch((e) => ({
                  success: false,
                  value: `Failed to get name: ${e.message}`,
                })),
              (contract.methods.symbol() as ContractSendMethod)
                .call()
                .then((s) => ({ success: true, value: s as string }))
                .catch((e) => ({
                  success: false,
                  value: `Failed to get symbol: ${e.message}`,
                })),
              (contract.methods.metadataHash() as ContractSendMethod)
                .call()
                .then((s) => ({ success: true, value: s as string }))
                .catch((e) => ({
                  success: false,
                  value: `Failed to get metadata hash: ${e.message}`,
                })),
              (contract.methods.tokenURI(1) as ContractSendMethod)
                .call()
                .then((s) => ({ success: true, value: s as string }))
                .catch((e) => ({
                  success: false,
                  value: `Failed to get tokenUri: ${e.message}`,
                })),
            ]);
          })
          .then((args) => {
            if (!args) return;
            const failures = args.filter((s) => !s.success);
            if (failures.length)
              return res
                .status(500)
                .end(
                  `Querying Contract failed. Errors:\n${failures
                    .map((s) => ` - ${s.value}`)
                    .join("\n")}`,
                );
            return axios
              .get(`https://ipfs.io/ipfs/${bytes32ToIpfsHash(args[2].value)}`)
              .then((r) => {
                const { thumbnail, ...fields } = r.data;
                const nftStandard = {
                  description: `${args[0].value} (${args[1].value})`,
                  external_url: `https://passports.creatorcabins.com/checkout/${networkName}/${contractAddress}`,
                  image: `https://ipfs.io/ipfs/${thumbnail}`,
                  name: args[0].value,
                  attributes: Object.entries(fields).map(
                    ([trait_type, value]) => ({ trait_type, value }),
                  ),
                };
                res.status(200).send(nftStandard);
              })
              .catch((e) =>
                res
                  .status(500)
                  .end(
                    `Failed to get metadata ${args?.[2]?.value}: ${e.message}`,
                  ),
              );
          })
          .catch((e) => {
            console.log(
              "caught getStampContract",
              networkName,
              contractAddress,
            );
            console.log("error: ", e);
            res
              .status(500)
              .end(
                `Failed to get versions for stamp ${contractAddress} in network ${networkName}: ${e.message}`,
              );
          });
      });

    default:
      res.setHeader("Allow", ["POST", "GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
