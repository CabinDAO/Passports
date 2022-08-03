import { useState } from "react";
import { Modal } from "@cabindao/topo";
import { ModalInput } from "@/components/Modal";

import { useAddress, useWeb3 } from "@/components/Web3Context";

import { getStampContract } from "@/utils/stamps";
import { resolveAddress } from "@/utils/address";

const StampOwnershipModal = ({
  stamp,
  isOpen,
  setIsOpen,
  setToastMessage,
  setStamp,
}) => {
  const web3 = useWeb3();
  const address = useAddress();
  const [userAddress, setUserAddress] = useState("");

  return (
    <Modal
      hideCloseIcon
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Grant Access to Stamp"
      onConfirm={async () => {
        return Promise.all([
          getStampContract({
            web3,
            address: stamp.address,
            version: stamp.version,
          }),
          resolveAddress(userAddress, web3),
        ])
          .then(([contract, ethAddress]) =>
            ethAddress
              ? new Promise<void>((resolve, reject) =>
                  contract.methods
                    .grantAdmin(ethAddress)
                    .send({ from: address })
                    .on("receipt", () => {
                      // TODO: This did not go through, even though the transaction went through
                      axios
                        .put("/api/admin/stamp", {
                          address: ethAddress,
                          contract: stamp.address,
                          chain: chainId,
                        })
                        .then(() => {
                          setUserAddress("");
                          resolve();
                        });
                    })
                    .on("error", reject)
                )
              : Promise.reject(
                  new Error(`Invalid wallet address ${userAddress}`)
                )
          )
          .catch((e) => setToastMessage(`ERROR: ${e.message}`));
      }}
    >
      <ModalInput
        label={"Address"}
        value={userAddress}
        onChange={(e) => setUserAddress(e.target.value)}
      />
    </Modal>
  );
};

export default StampOwnershipModal;
