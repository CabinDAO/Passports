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
    passportFactory: "0xd799120D85Fef68Cb98E216c3bCc65ac030b3e50",
  },
  [ROPSTEN_NETWORK_ID]: {
    passportFactory: "0xC79C2a027d88f5ec6c82fC9b17491E8C761E2C19",
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
