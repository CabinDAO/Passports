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
import {
  firebaseConfig,
  getAbiFromJson,
  networkNameById,
} from "../../components/constants";
import { getAbi, getVersionByAddress } from "../../components/firebase";
import { bytes32ToIpfsHash, getWeb3 } from "../../components/utils";
import type { ContractSendMethod } from "web3-eth-contract";
import axios from "axios";

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
        query(adminCol, where("contract", "==", contractAddress.toLowerCase()))
      ).then((data) => {
        if (!data.docs.length) {
          return res
            .status(409)
            .end(`Contract ${contractAddress} Missing From Firebase`);
        }
        const doc = data.docs[0].data();
        const networkId = doc["chain"];
        const networkName = networkNameById[networkId];
        return getVersionByAddress(contractAddress, networkId)
          .then((version) =>
            getAbi("stamp", version)
              .then((stampJson) => {
                const web3 = getWeb3(networkName);
                const contract = new web3.eth.Contract(
                  getAbiFromJson(stampJson),
                  contractAddress
                );
                return (contract.methods.get() as ContractSendMethod).call();
              })
              .catch((e) =>
                res
                  .status(500)
                  .end(`Failed to get abi for version ${version}: ${e.message}`)
              )
          )
          .then((args) => {
            return axios
              .get(`https://ipfs.io/ipfs/${bytes32ToIpfsHash(args[5])}`)
              .then((r) => {
                const { thumbnail, ...fields } = r.data;
                const nftStandard = {
                  description: `${args[0]} (${args[1]})`,
                  external_url: `https://passports.creatorcabins.com/checkout/${networkName}/${contractAddress}`,
                  image: `https://ipfs.io/ipfs/${thumbnail}`,
                  name: args[0],
                  attributes: Object.entries(fields).map(
                    ([trait_type, value]) => ({ trait_type, value })
                  ),
                };
                res.status(200).send(nftStandard);
              })
              .catch((e) =>
                res
                  .status(500)
                  .end(`Failed to get metadata ${args?.[5]}: ${e.message}`)
              );
          })
          .catch((e) =>
            res
              .status(500)
              .end(
                `Failed to get versions for stamp ${contractAddress} in network ${networkName}: ${e.message}`
              )
          );
      });

    default:
      res.setHeader("Allow", ["POST", "GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
