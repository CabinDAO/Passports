import { useCallback, useEffect, useMemo, useState } from "react";
import { useAddress, useWeb3, useChainId } from "../components/Web3Context";
import type { Contract, ContractSendMethod } from "web3-eth-contract";
import { contractAddressesByNetworkId, getAbiFromJson } from "../components/constants";
import stakingJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Staking.sol/Staking.json";
import testTokenJson from "@cabindao/nft-passport-contracts/artifacts/contracts/TestToken.sol/TestToken.json";
import { Button } from "@cabindao/topo";
import Layout from "../components/CommunityLayout";

const useFaucet = () => {
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const tokenContractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(testTokenJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.token || "";
    return contract;
  }, [web3, chainId]);
  const faucetCallback = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F" && e.shiftKey) {
        (
          tokenContractInstance.methods.faucet(
            web3.utils.toWei("100", "ether")
          ) as ContractSendMethod
        ).send({
          from: address,
        });
      }
    },
    [web3, address, tokenContractInstance]
  );
  useEffect(() => {
    document.addEventListener("keydown", faucetCallback);
    return () => document.removeEventListener("keydown", faucetCallback);
  }, [faucetCallback]);
};

const SettingsTabContent = () => {
  const [isStaked, setIsStaked] = useState(false);
  const [loading, setLoading] = useState(true);
  const address = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const contractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(stakingJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.staking || "";
    return contract;
  }, [web3, chainId]);
  const tokenContractInstance = useMemo<Contract>(() => {
    const contract = new web3.eth.Contract(getAbiFromJson(testTokenJson));
    contract.options.address =
      contractAddressesByNetworkId[chainId]?.token || "";
    return contract;
  }, [web3, chainId]);
  // uncomment this line to add a hidden keyboard shortcut to faucet yourself with ERC20 until hardhat task is working
  // useFaucet();
  useEffect(() => {
    if (contractInstance.options.address) {
      (contractInstance.methods.isStakeholder(address) as ContractSendMethod)
        .call()
        .then(setIsStaked)
        .finally(() => setLoading(false));
    }
  }, [setLoading, setIsStaked, address, contractInstance]);
  const stake = useCallback(() => {
    setLoading(true);
    return new Promise<void>((resolve) => {
      tokenContractInstance.methods
        .approve(
          contractInstance.options.address,
          web3.utils.toWei("10", "ether")
        )
        .send({ from: address })
        .on("receipt", () => {
          resolve();
        });
    }).then(() =>
      (
        contractInstance.methods.createStake(
          web3.utils.toWei("10", "ether")
        ) as ContractSendMethod
      )
        .send({ from: address })
        .on("receipt", () => {
          setIsStaked(true);
          setLoading(false);
        })
    );
  }, [
    setLoading,
    setIsStaked,
    address,
    contractInstance,
    web3,
    tokenContractInstance,
  ]);
  const unstake = useCallback(() => {
    setLoading(true);
    (
      contractInstance.methods.removeStake(
        web3.utils.toWei("10", "ether")
      ) as ContractSendMethod
    )
      .send({ from: address })
      .on("receipt", () => {
        setIsStaked(false);
        setLoading(false);
      });
  }, [setLoading, setIsStaked, address, contractInstance, web3]);
  return (
    <div>
      {loading ? (
        <span>Loading...</span>
      ) : isStaked ? (
        <Button onClick={unstake}>Remove Stake</Button>
      ) : (
        <Button onClick={stake}>Stake</Button>
      )}
    </div>
  );
};

const SettingsPage = () => {
  return (
    <Layout>
      <SettingsTabContent />
    </Layout>
  )
}

export default SettingsPage;
