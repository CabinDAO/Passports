import { Modal } from "@cabindao/topo";
import { useAddress, useWeb3 } from "@/components/Web3Context";
import { ModalInput } from "@/components/Modal";

import { getStampContract } from "@/utils/stamps";

const TogglePauseStamp = ({
  stamp,
  isOpen,
  setIsOpen,
  setToastMessage,
  setStamp,
}) => {
  const web3 = useWeb3();
  const address = useAddress();

  return (
    <Modal
      hideCloseIcon
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={stamp.paused ? "Unpause Stamp" : "Pause Stamp"}
      onConfirm={async () => {
        return getStampContract({
          web3,
          address: stamp.address,
          version: stamp.version,
        })
          .then(
            (contract) =>
              new Promise<void>((resolve, reject) => {
                const sendMethod = stamp.paused
                  ? contract.methods.unpause?.()
                  : contract.methods.pause?.();
                if (!sendMethod) {
                  throw new Error(
                    "This stamp is on an older version that does not support pausing/unpausing"
                  );
                } else {
                  return sendMethod
                    .send({ from: address })
                    .on("receipt", () => {
                      // TODO: Modal doesn't close, stamp isn't updated when the transaction goes through
                      const newPauseValue = !stamp.paused;
                      setToastMessage(
                        `Successfully ${
                          newPauseValue ? "paused" : "unpaused"
                        } the stamp.`
                      );
                      setStamp({
                        ...stamp,
                        paused: newPauseValue,
                      });
                      resolve();
                    })
                    .on("error", reject);
                }
              })
          )
          .catch((e) => setToastMessage(`ERROR: ${e.message}`));
      }}
    >
      <p>
        {stamp.paused
          ? "Are you sure you want to unpause the Stamp? Doing so would allow anyone to buy one"
          : "Are you sure you want to pause the Stamp? Doing so would prevent anyone from buying one."}
      </p>
    </Modal>
  );
};

export default TogglePauseStamp;
