import Web3 from "web3";
// @ts-ignore They don't have a types file available -.-
import namehash from "@ensdomains/eth-ens-namehash";

export const resolveAddress = (addr: string, web3: Web3) =>
  addr.endsWith(".eth")
    ? web3.eth.ens.getAddress(addr).catch(() => "")
    : addr.startsWith("0x")
    ? Promise.resolve(addr)
    : Promise.resolve("");

export const lookupAddress = async (
  addr: string,
  web3: Web3
): Promise<string> => {
  const lookup = addr.toLowerCase().substr(2) + ".addr.reverse";
  return web3.eth.ens
    .resolver(lookup)
    .then((ResolverContract) => {
      const nh = namehash.hash(lookup);
      return ResolverContract.methods.name(nh).call();
    })
    .catch(() => addr);
};