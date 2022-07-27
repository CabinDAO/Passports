import { AbiType, StateMutabilityType, AbiItem } from "web3-utils";
import {
  GOERLI_STAKING_ADDRESS,
  GOERLI_TEST_TOKEN_ADDRESS,
  KOVAN_STAKING_ADDRESS,
  KOVAN_TEST_TOKEN_ADDRESS,
  RINKEBY_STAKING_ADDRESS,
  RINKEBY_TEST_TOKEN_ADDRESS,
  ROPSTEN_STAKING_ADDRESS,
  ROPSTEN_TEST_TOKEN_ADDRESS,
} from "@cabindao/nft-passport-contracts/artifacts/addresses";

const MAINNET_NETWORK_ID = 0x1;
const KOVAN_NETWORK_ID = 0x2a;
const ROPSTEN_NETWORK_ID = 0x3;
const RINKEBY_NETWORK_ID = 0x4;
const GOERLI_NETWORK_ID = 0x5;
const OPTIMISM_NETWORK_ID = 10;
const OPTIMISM_KOVAN_NETWORK_ID = 69;
const ARBITRUM_TEST_NETWORK_ID = 421611;
const ARBITRUM_NETWORK_ID = 42161;
const POLYGON_MAIN_NETWORK_ID = 137;
const POLYGON_TEST_NETWORK_ID = 80001;
const LOCALHOST_NETWORK_ID = 0x7a69;

export const networkNameById: {
  [id: number]: string;
} = {
  [LOCALHOST_NETWORK_ID]: "localhost",
  [KOVAN_NETWORK_ID]: "kovan",
  [ROPSTEN_NETWORK_ID]: "ropsten",
  [MAINNET_NETWORK_ID]: "mainnet",
  [RINKEBY_NETWORK_ID]: "rinkeby",
  [OPTIMISM_NETWORK_ID]: "optimism-mainnet",
  [OPTIMISM_KOVAN_NETWORK_ID]: "optimism-kovan",
  [POLYGON_MAIN_NETWORK_ID]: "polygon-mainnet",
  [POLYGON_TEST_NETWORK_ID]: "polygon-mumbai",
  [GOERLI_NETWORK_ID]: "goerli",
  [ARBITRUM_TEST_NETWORK_ID]: "arbitrum-rinkeby",
  [ARBITRUM_NETWORK_ID]: "arbitrum-mainnet",
};

export const networkIdByName = Object.fromEntries(
  Object.entries(networkNameById).map(([id, name]) => [name, Number(id)]),
);

export const contractAddressesByNetworkId: {
  [id: number]: { staking: string; token?: string };
} = {
  [LOCALHOST_NETWORK_ID]: {
    staking: process.env.NEXT_PUBLIC_LOCAL_STAKING_ADDRESS || "",
    token: process.env.NEXT_PUBLIC_LOCAL_TEST_TOKEN_ADDRESS || "",
  },
  [KOVAN_NETWORK_ID]: {
    staking: KOVAN_STAKING_ADDRESS,
    token: KOVAN_TEST_TOKEN_ADDRESS,
  },
  [ROPSTEN_NETWORK_ID]: {
    staking: ROPSTEN_STAKING_ADDRESS,
    token: ROPSTEN_TEST_TOKEN_ADDRESS,
  },
  [GOERLI_NETWORK_ID]: {
    staking: GOERLI_STAKING_ADDRESS,
    token: GOERLI_TEST_TOKEN_ADDRESS,
  },
  [RINKEBY_NETWORK_ID]: {
    staking: RINKEBY_STAKING_ADDRESS,
    token: RINKEBY_TEST_TOKEN_ADDRESS,
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
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_PROJECT_ID + ".firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_PROJECT_ID + ".appspot.com",
  messagingSenderId: process.env.FIREBASE_MSSG_SENDER,
  appId: process.env.FIREBASE_APP_ID,
};

export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

export const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);
