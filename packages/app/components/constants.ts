import { AbiType, StateMutabilityType, AbiItem } from "web3-utils";

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
    passportFactory: "0x0707DD02fCabE1466848a6A2Eb5bc610C3976873",
  },
  [ROPSTEN_NETWORK_ID]: {
    passportFactory: "0x87d6B2888D7830c69de98D6497716C3e2eFA400e",
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
