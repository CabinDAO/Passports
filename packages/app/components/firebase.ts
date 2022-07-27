import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore/lite";
import { getStorage, list, ref, getBytes } from "firebase/storage";
import { getStampContract, getWeb3 } from "./backend";
import { firebaseConfig, networkNameById } from "./constants";
import type { ContractSendMethod } from "web3-eth-contract";
import { bytes32ToIpfsHash } from "./utils";
import axios from "axios";
import { users } from "@clerk/clerk-sdk-node";

export const getVersionByAddress = (address: string, chain: number) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const versionsCol = collection(db, "versions");
  return getDocs(
    query(
      versionsCol,
      where("contract", "==", "stamp"),
      where("address", "==", address.toLowerCase()),
      where("chain", "==", chain),
    ),
  ).then((d) => {
    return d.docs.length ? (d.docs[0].data()["version"] as string) : "0.0.0";
  });
};

export const getAbi = (contract: string, version: string) => {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const versionToUse = version
    ? Promise.resolve(version)
    : list(ref(storage, "abis/production"), {}).then((versions) => {
        const version = versions.prefixes
          .map((i) => {
            const [major, minor, patch] = i.name
              .split(".")
              .map((s) => Number(s));
            return {
              major,
              minor,
              patch,
            };
          })
          .sort((a, b) => {
            if (a.major !== b.major) return b.major - a.major;
            if (a.minor !== b.minor) return b.minor - a.minor;
            else return b.patch - a.patch;
          })[0];
        return `${version.major}.${version.minor}.${version.patch}`;
      });
  return versionToUse.then((version) =>
    getBytes(ref(storage, `abis/production/${version}/${contract}.json`)).then(
      (bytes) => ({ ...JSON.parse(Buffer.from(bytes).toString()), version }),
    ),
  );
};

export const getAdminStamps = ({
  address,
  chainId,
}: {
  address: string;
  chainId: number;
}) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const adminStampsCol = collection(db, "admin_stamps");
  const versionsCol = collection(db, "versions");
  return Promise.all([
    getDocs(
      query(
        adminStampsCol,
        where("address", "==", address.toLowerCase()),
        where("chain", "==", chainId),
      ),
    ),
    getDocs(
      query(
        versionsCol,
        where("contract", "==", "stamp"),
        where("chain", "==", chainId),
      ),
    ),
  ]).then(([memberships, versions]) => {
    const versionByContract = Object.fromEntries(
      versions.docs
        .map((d) => d.data())
        .map((data) => [data["address"], data["version"]]),
    );
    return {
      contracts: memberships.docs.map((doc) => {
        const docData = doc.data();
        const address = docData["contract"] as string;
        return {
          address,
          version: versionByContract[address] as string,
        };
      }),
    };
  });
};

export const getStampsByUser = ({
  address,
  chainId,
}: {
  address: string;
  chainId: number;
}) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const urlCol = collection(db, "stamps");
  return getDocs(
    query(
      urlCol,
      where("address", "==", address.toLowerCase()),
      where("chain", "==", chainId),
    ),
  )
    .then((stamps) => {
      const tokensByAddress = stamps.docs
        .map((doc) => {
          const docData = doc.data();
          return {
            address: docData["contract"] as string,
            token: docData["token"] as number,
          };
        })
        .reduce((p, c) => {
          if (p[c.address]) {
            p[c.address].push(c.token);
          } else {
            p[c.address] = [c.token];
          }
          return p;
        }, {} as Record<string, number[]>);

      const network = networkNameById[chainId];
      const web3 = getWeb3(networkNameById[chainId]);

      return Promise.all(
        Object.entries(tokensByAddress).map(([address, tokens]) =>
          getStampContract({ web3, network, address })
            .then(({ contract }: any) =>
              Promise.all([
                (contract.methods.name() as ContractSendMethod)
                  .call()
                  .then((r) => r as string),
                (contract.methods.symbol() as ContractSendMethod)
                  .call()
                  .then((r) => r as string),
                (contract.methods.metadataHash() as ContractSendMethod)
                  .call()
                  .then((hash) => bytes32ToIpfsHash(hash))
                  .then((hash) =>
                    axios.get<{ thumbnail: string }>(
                      `https://ipfs.io/ipfs/${hash}`,
                    ),
                  )
                  .then((r) => `https://ipfs.io/ipfs/${r.data.thumbnail}`),
              ]),
            )
            .then(([name, symbol, thumbnail]) =>
              tokens.map((token) => ({
                token,
                address,
                name,
                symbol,
                thumbnail,
              })),
            )
            // .catch((e) => {
            //   console.log("caught getStampContract", network, address);
            //   console.log("error: ", e);
            //   return [];
            // })
        ),
      );
    })
    .then((stamps) => stamps.flat());
};

// fetch user data
export const getCommunitiesByUser = async (userId: string) => {
  const dummy = [
    {
      name: "ACME Corporation",
      symbol: "AC",
      description:
        "Acme Corporation is a member-owned global network of independent, innovative hubs powered by web3.",
      quantity: 3000,
      thumbnail: "/logo.png",
    },
    {
      name: "House DAO",
      symbol: "HDAO",
      description:
        "House DAO is a member-owned global network of independent, innovative hubs powered by web3.",
      quantity: 230,
      thumbnail: "/logo.png",
    },
    {
      name: "Rocket Science",
      symbol: "RS",
      description:
        "Acme Corporation is a member-owned global network of independent, innovative hubs powered by web3.",
      quantity: 7100403,
      thumbnail: "/logo.png",
    },
  ];
  return [dummy, dummy].flat();
};

export const getStampOwners = ({
  contract,
  chain,
  offset = 0,
  size = 10,
}: {
  contract: string;
  chain: number;
  offset?: number;
  size?: number;
}) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const urlCol = collection(db, "stamps");
  return getDocs(
    query(
      urlCol,
      where("contract", "==", contract.toLowerCase()),
      where("chain", "==", chain),
    ),
  )
    .then((stamps) =>
      stamps.docs
        .map((doc) => {
          const docData = doc.data();
          return {
            address: docData["address"] as string,
            token: docData["token"] as number,
          };
        })
        .reduce((p, c) => {
          if (p[c.address]) {
            p[c.address].push(c.token);
          } else {
            p[c.address] = [c.token];
          }
          return p;
        }, {} as Record<string, number[]>),
    )
    .then((tokensByAddress) => {
      const allAddresses = Object.keys(tokensByAddress).sort();
      const paginatedAddresses = allAddresses.slice(offset, offset + size);
      return users
        .getUserList({ web3Wallet: paginatedAddresses })
        .then((userList) => {
          const userByAddress = Object.fromEntries(
            userList.flatMap((u) =>
              u.web3Wallets.map((w) => [
                w.web3Wallet || "",
                u.firstName
                  ? u.lastName
                    ? `${u.firstName} ${u.lastName}`
                    : u.firstName
                  : "Anonymous User",
              ]),
            ),
          );
          return {
            users: Object.fromEntries(
              paginatedAddresses.map((addr) => [
                addr,
                {
                  tokens: tokensByAddress[addr],
                  name: userByAddress[addr] || "Anonymous User",
                },
              ]),
            ),
            userTotal: allAddresses.length,
          };
        });
    });
};
