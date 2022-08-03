import { Modal } from "@cabindao/topo";

const EditStampField = ({ isOpen, setIsOpen, field, stamp }) => {
  const web3 = useWeb3();
  const address = useAddress();

  return (
    <Modal
      hideCloseIcon
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={`Change ${field}`}
      onConfirm={() => {
        getStampContract({
          web3,
          address: stamp.address,
          version: stamp.version,
        }).then((contract) => {
          // This is to account for the price being denominated in Ether
          // in the UI, but needs to be sent in Wei.
          let valueToSend =
            field === "price"
              ? web3.utils.toBN(web3.utils.toWei("0.5"))
              : value;
          console.log("valueToSend: ", typeof valueToSend, valueToSend);

          return new Promise<void>((resolve, reject) =>
            contract.methods[
              `set${field.slice(0, 1).toUpperCase()}${field.slice(1)}`
            ](valueToSend)
              .send({ from: address })
              .on("receipt", () => {
                setStamp({
                  ...stamp,
                  [field]: value,
                });
                resolve();
              })
              .on("error", reject)
          );
        });
      }}
    >
      <ModalInput
        label={`New ${field}`}
        value={value.toString()}
        onChange={(e) => setValue(Number(e.target.value))}
        type={"number"}
      />
    </Modal>
  );
};

export default EditStampField;
