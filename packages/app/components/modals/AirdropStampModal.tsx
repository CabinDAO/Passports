import { useState } from "react";
import Papa from "papaparse";

import { Modal, Label } from "@cabindao/topo";
import { ModalInputBox } from "@/components/Modal";

import { useAddress, useWeb3 } from "@/components/Web3Context";
import { getStampContract } from "@/utils/stamps";
import { resolveAddress } from "@/utils/address";

const AirdropStampModal = ({
  stamp,
  isOpen,
  setIsOpen,
  setToastMessage,
  setStamp,
}) => {
  const web3 = useWeb3();
  const address = useAddress();

  const [airdropAddrList, setAirdropAddrList] = useState<string[]>([]);

  return (
    <Modal
      hideCloseIcon
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Airdrop Passports"
      onConfirm={() => {
        return getStampContract({
          web3,
          address: stamp.address,
          version: stamp.version,
        })
          .then((contract) =>
            Promise.all(
              airdropAddrList.map((addr) => resolveAddress(addr, web3))
            ).then(
              (addrList) =>
                new Promise<void>((resolve, reject) =>
                  contract.methods
                    .airdrop(addrList)
                    .send({
                      from: address,
                    })
                    .on("receipt", (receipt: TransactionReceipt) => {
                      const transferEvents = receipt.events?.["Transfer"];
                      const transfers = Array.isArray(transferEvents)
                        ? transferEvents
                        : [transferEvents];
                      const tokens = transfers.map((t) => ({
                        tokenId: t?.returnValues?.tokenId as string,
                        address: t?.returnValues?.to as string,
                      }));
                      const mintIndex =
                        (receipt.events?.["Airdrop"]
                          ?.returnValues?.[1] as number) || 0;
                      axios
                        .post("/api/stamps", {
                          chain: chainId,
                          tokens,
                          contract: stamp.address,
                        })
                        .then((r) => {
                          // TODO: This does not work but it should
                          setToastMessage("Airdrop Successful!");
                          setStamp({
                            ...stamp,
                            mintIndex,
                          });
                          setIsOpen(false);
                          resolve();
                        });
                    })
                    .on("error", (e: Error) => {
                      setToastMessage(`ERROR: ${e.message}`);
                      reject(e);
                    })
                )
            )
          )
          .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
      }}
    >
      <div>
        {" "}
        {`All the addresses should be under column named "address". An optional "quantity" column could be added for airdropping multiple stamps per address."`}{" "}
      </div>
      <ModalInputBox>
        <Label label={"Upload CSV"}>
          <input
            type={"file"}
            accept={".csv"}
            onChange={async (e) => {
              if (e.target.files) {
                const f: File = e.target.files[0];
                Papa.parse<Record<string, string>, File>(f, {
                  header: true,
                  complete: function (results) {
                    const addrsInCsv = results.data.map((result) => ({
                      address: result["address"],
                      quantity: result["quantity"],
                    }));
                    const relevantAddr = addrsInCsv.flatMap((a) =>
                      !a.address
                        ? ([] as string[])
                        : Array(Number(a.quantity) || 1)
                            .fill(null)
                            .map(() => a.address)
                    );
                    setAirdropAddrList(relevantAddr);
                  },
                  error: function (e) {
                    setToastMessage(`ERROR: ${e.message}`);
                  },
                });
              }
            }}
          />
        </Label>
      </ModalInputBox>
      {airdropAddrList.length > 0 ? (
        <div>{airdropAddrList.length} Addresses</div>
      ) : null}
    </Modal>
  );
};

export default AirdropStampModal;
