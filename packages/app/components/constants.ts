import { AbiType, StateMutabilityType, AbiItem } from "web3-utils";
import {
  KOVAN_PASSPORT_FACTORY_ADDRESS,
  ROPSTEN_PASSPORT_FACTORY_ADDRESS,
} from "@cabindao/nft-passport-contracts/artifacts/addresses";

const KOVAN_NETWORK_ID = 0x2a;
const ROPSTEN_NETWORK_ID = 0x3;
const LOCALHOST_NETWORK_ID = 0x7a69;

export const networkNameById: {
  [id: number]: string;
} = {
  [LOCALHOST_NETWORK_ID]: "localhost",
  [KOVAN_NETWORK_ID]: "kovan",
  [ROPSTEN_NETWORK_ID]: "ropsten",
};

export const networkIdByName = Object.fromEntries(
  Object.entries(networkNameById).map(([id, name]) => [name, id])
);

export const contractAddressesByNetworkId: {
  [id: number]: { passportFactory: string };
} = {
  [LOCALHOST_NETWORK_ID]: {
    passportFactory: process.env.NEXT_PUBLIC_LOCAL_PASSPORT_ADDRESS || "",
  },
  [KOVAN_NETWORK_ID]: {
    passportFactory: KOVAN_PASSPORT_FACTORY_ADDRESS,
  },
  [ROPSTEN_NETWORK_ID]: {
    passportFactory: ROPSTEN_PASSPORT_FACTORY_ADDRESS,
  },
};

export const getAbiFromJson = (json: {
  abi: (Omit<AbiItem, "stateMutability" | "type"> & {
    stateMutability?: string;
    type?: string;
  })[];
}) =>
  json.abi.map((a) => ({
    ...a,
    stateMutability: a.stateMutability as StateMutabilityType,
    type: a.type as AbiType,
  }));

/*
 * Config needed to make a firebase DB connection.
 * TODO: use a Cabin account.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBlP4xTTtpua7u2Jl0Bpybn896NNNUFwx8",
  authDomain: "passports-339418.firebaseapp.com",
  projectId: "passports-339418",
  storageBucket: "passports-339418.appspot.com",
  messagingSenderId: "198686036255",
  appId: "1:198686036255:web:47b24729c8c3e52eaf202a",
  measurementId: "G-ZS4NL2R3GS"
};
