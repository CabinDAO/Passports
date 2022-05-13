import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore/lite";
import { getStorage, list, ref, getBytes } from "firebase/storage";
import { firebaseConfig } from "./constants";

export const getVersionByAddress = (address: string, chain: number) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const versionsCol = collection(db, "versions");
  return getDocs(
    query(
      versionsCol,
      where("contract", "==", "stamp"),
      where("address", "==", address.toLowerCase()),
      where("chain", "==", chain)
    )
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
      (bytes) => ({ ...JSON.parse(Buffer.from(bytes).toString()), version })
    )
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
        where("chain", "==", chainId)
      )
    ),
    getDocs(
      query(
        versionsCol,
        where("contract", "==", "stamp"),
        where("chain", "==", chainId)
      )
    ),
  ]).then(([memberships, versions]) => {
    const versionByContract = Object.fromEntries(
      versions.docs
        .map((d) => d.data())
        .map((data) => [data["address"], data["version"]])
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
