import { create } from "ipfs-http-client";
import AbortController from "abort-controller";

global.AbortController = AbortController;

export const addPins = (files: string[]) => {
  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: `Basic ${Buffer.from(
        `${process.env.IPFS_INFURA_ID}:${process.env.IPFS_INFURA_SECRET}`
      ).toString("base64")}`,
    },
  });
  const addPin = (hash: string) => {
    return client.pin.add(hash).catch((e) => {
      console.error(`Failed to pin hash ${hash}:`);
      console.error(e);
      return "";
    });
  };
  return Promise.all(files.map(addPin));
};
