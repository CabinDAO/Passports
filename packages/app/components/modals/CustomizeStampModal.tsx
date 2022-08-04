// TODO: refactor. This component is long and complex
// TODO: refactor modals generally. Need a better way to create, manage, and trigger them.
// TODO: refactor. Move custimzations away from a modal and make this part of the settings page.
//       We should give checkout pages a custom URL (/checkout/:id) with the option to create a
//       pretty URL (/checkout/jump-membership). You should also have to opt-in to a checkout
//       page rather than them being created by default.

import { useState } from "react";
import { axios } from "axios";
import { Modal, Label } from "@cabindao/topo";
import {
  ModalContent,
  ModalInput,
  ModalLabel,
  ModalInputBox,
  ModalInputLabel,
} from "@/components/Modal";

import { useAddress, useWeb3 } from "@/components/Web3Context";
import { getStampContract } from "@/utils/stamps";
import { resolveAddress } from "@/utils/address";

const CustomizeStampModal = ({
  stamp,
  isOpen,
  setIsOpen,
  setToastMessage,
  setStamp,
}) => {
  const [fileLoading, setFileLoading] = useState(false);

  return (
    <Modal
      hideCloseIcon
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Customize Checkout"
      onConfirm={() => {
        let upsertData: Record<string, string | undefined> = {
          redirect_url: stamp.customization?.url,
          contractAddr: stamp.address,
          brand_color: stamp.customization?.brandColor,
          accent_color: stamp.customization?.accColor,
          text_color: stamp.customization?.textColor,
          button_txt: stamp.customization?.buttonTxt,
          logo_cid: stamp.customization?.logoCid,
        };
        return axios
          .post("/api/updateCustomization", {
            data: upsertData,
          })
          .then(() =>
            setToastMessage(
              "Successfully updated stamp's customized checkout experience!"
            )
          )
          .catch((e) =>
            setToastMessage(`ERROR: ${e.response?.data || e.message}`)
          );
      }}
    >
      <ModalContent>
        <ModalLabel>{`${stamp.name} (${stamp.symbol})`}</ModalLabel>
        <ModalInput
          label={"Redirect URL"}
          value={stamp.customization?.url}
          onChange={(e) =>
            setStamp({
              ...stamp,
              customization: {
                ...stamp.customization,
                url: e.target.value,
              },
            })
          }
        />
        <ModalInputBox>
          <ModalInputLabel htmlFor="bcolor">Brand color:</ModalInputLabel>
          <input
            type="color"
            id="bcolor"
            name="bcolor"
            value={stamp.customization?.brandColor || "#fdf3e7"}
            onChange={(e) =>
              setStamp({
                ...stamp,
                customization: {
                  ...stamp.customization,
                  brandColor: e.target.value,
                },
              })
            }
          ></input>
        </ModalInputBox>
        <ModalInputBox>
          <ModalInputLabel htmlFor="acolor">Accent color:</ModalInputLabel>
          <input
            type="color"
            id="acolor"
            name="acolor"
            value={stamp.customization?.accColor || "#324841"}
            onChange={(e) =>
              setStamp({
                ...stamp,
                customization: {
                  ...stamp.customization,
                  accColor: e.target.value,
                },
              })
            }
          ></input>
        </ModalInputBox>
        <ModalInputBox>
          <ModalInputLabel htmlFor="acolor">Text color:</ModalInputLabel>
          <input
            type="color"
            id="textColor"
            name="textColor"
            value={stamp.customization?.textColor || "#ffffff"}
            onChange={(e) =>
              setStamp({
                ...stamp,
                customization: {
                  ...stamp.customization,
                  textColor: e.target.value,
                },
              })
            }
          ></input>
        </ModalInputBox>
        <ModalInput
          label={"Button Text"}
          value={stamp.customization?.buttonTxt}
          onChange={(e) =>
            setStamp({
              ...stamp,
              customization: {
                ...stamp.customization,
                buttonTxt: e.target.value,
              },
            })
          }
        />
        <ModalInputBox>
          <Label
            label={stamp.customization?.logoCid ? "Change Logo" : "Upload Logo"}
          >
            <input
              type={"file"}
              accept="video/*,image/*"
              onChange={async (e) => {
                if (e.target.files) {
                  setFileLoading(true);
                  const file = e.target.files[0];
                  if (file) {
                    return ipfsAdd(file)
                      .then((logoCid) =>
                        setStamp({
                          ...stamp,
                          customization: {
                            ...stamp.customization,
                            logoCid,
                          },
                        })
                      )
                      .finally(() => setFileLoading(false));
                  }
                }
              }}
            />
          </Label>
          {fileLoading && "Loading..."}
        </ModalInputBox>
      </ModalContent>
    </Modal>
  );
};

export default CustomizeStampModal;
