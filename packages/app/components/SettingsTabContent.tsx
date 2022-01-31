import { useCallback, useEffect, useMemo, useState } from "react";
import { useAddress, useWeb3, useChainId } from "./Web3Context";
import type { Contract, ContractSendMethod } from "web3-eth-contract";
import { contractAddressesByNetworkId, getAbiFromJson } from "./constants";
import stakingJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Staking.sol/Staking.json";
import { Button } from "@cabindao/topo";

const SettingsTagContent = () => {
  const [isStaked, setIsStaked] = useState(false);
  const [loading, setLoading] = useState(true);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const contractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(stakingJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.passportFactory || "";
    return contract;
  }, [web3, chainId]);
  useEffect(() => {
    (contractInstance.methods.isStakeholder(address) as ContractSendMethod)
      .call()
      .then((c) => {
        console.log(c);
        setIsStaked(c === "true");
      })
      .finally(() => setLoading(false));
  }, [setLoading, setIsStaked, address, contractInstance]);
  const stake = useCallback(() => {
    setLoading(true);
    (contractInstance.methods.createStake(10) as ContractSendMethod)
      .send({ from: address })
      .on("receipt", () => {
        setIsStaked(true);
        setLoading(false);
      });
  }, [setLoading, setIsStaked, address, contractInstance]);
  const unstake = useCallback(() => {
    setLoading(true);
    (contractInstance.methods.createStake(10) as ContractSendMethod)
      .send({ from: address })
      .on("receipt", () => {
        setIsStaked(false);
        setLoading(false);
      });
  }, [setLoading, setIsStaked, address, contractInstance]);
  return (
    <>
      <h1>Settings</h1>
      <div>
        {loading ? (
          <span>Loading...</span>
        ) : isStaked ? (
          <Button onClick={unstake}>Remove Stake</Button>
        ) : (
          <Button onClick={stake}>Stake</Button>
        )}
      </div>
    </>
  );
};

export default SettingsTagContent;
