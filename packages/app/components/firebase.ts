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

export const getVersionByAddress = (address: string) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const versionsCol = collection(db, "versions");
  return getDocs(
    query(
      versionsCol,
      where("contract", "==", "stamp"),
      where("address", "==", address)
    )
  ).then((d) =>
    d.docs.length ? (d.docs[0].data()["version"] as string) : "0.0.0"
  );
};

export const getAbi = (contract: string, version: string) => {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const versionToUse = version
    ? Promise.resolve(version)
    : list(ref(storage, "abis/production")).then((versions) => {
        const version = versions.items
          .filter((i) => i.name.endsWith(`${contract}.json`))
          .map((i) => {
            const [version] = i.name.split("/");
            const [major, minor, patch] = version
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
        return version;
      });
  return versionToUse
    .then((version) =>
      getBytes(ref(storage, `abis/production/${version}/${contract}.json`))
    )
    .then((bytes) => JSON.parse(Buffer.from(bytes).toString()));
};
