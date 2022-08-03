import React, { useState, useCallback } from "react";
import axios from "axios";
import { styled, theme, Box, Text, Tooltip, Button, Modal, Input} from "@cabindao/topo";
import {
  Pencil1Icon,
  Share1Icon,
  Pencil2Icon,
  PlayIcon,
  PauseIcon,
  OpacityIcon,
  ExitIcon,
  Link1Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import {
  useAddress,
  useChainId,
  useWeb3,
} from "../Web3Context";
import {
  getStampContract,
} from "../utils";
import {
  networkNameById,
} from "../constants";
import type { ContractSendMethod } from "web3-eth-contract";

const SettingTitle = styled(Text, {
  font: "$mono",
  color: "$wheat",
  fontSize: "$sm",
  textTransform: "uppercase",
})

const StampCardValue = styled(Text, {
  color: "white",
  fontWeight: "$bold",
  fontFamily: "$sans",
  "& > button": {
    height: "16px",
  },
})

interface IStampProps {
  address: string;
  name: string;
  symbol: string;
  mintIndex: number;
  supply: number;
  price: string;
  metadataHash: string;
  royalty: number;
  isPrivate: boolean;
  version: string;
  paused: boolean;
  thumbnail: string;
  metadata: Record<string, string>;
  // based on query params - should prob separate into individual routes based on path params
  users?: Record<string, { tokens: number[]; name: string }>;
  userTotal?: number;
  transactions?: unknown[];
  balance?: string;
  customization?: Record<string, string>;
}

const StampSettings = (props: IStampProps) => {
  const [stamp, setStamp] = useState(props);
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [pauseIsOpen, setPauseIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  return <Box>
    <Box css={{display: "flex", justifyContent: "space-between", width: "100%"}}>
      <Box>
        <Tooltip content={"Share Stamp Ownership"}>
          <Button onClick={() => setShareIsOpen(true)}>
            <Share1Icon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={"Customize checkout"}>
          <Button onClick={open} >
            <Pencil2Icon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={"Airdrop stamps"}>
          <Button onClick={() => setAirDropIsOpen(true)} >
            <OpacityIcon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={stamp.paused ? "Unpause" : "Pause"}>
          <Button
            onClick={() => {
              setPauseIsOpen(true);
            }}
          >
            {stamp.paused ? (
              <PlayIcon width={20} height={20} color={theme.colors.wheat} />
            ) : (
              <PauseIcon width={20} height={20} color={theme.colors.wheat} />
            )}
          </Button>
        </Tooltip>
      </Box>

      <Box>
        <Tooltip content={"Refresh IPFS pin"}>
          <Button
            onClick={() =>
              axios.put(`/api/stamp/refresh`, {
              paths: [props.metadataHash, props.thumbnail],
            })
            }
          >
            <ReloadIcon width={20} height={20} color={theme.colors.wheat}/>
          </Button>
        </Tooltip>
      </Box>
    </Box>

    <Box css={{padding: "$6 $4", maxWidth: 400, background: "$forest"}}>
      <StampCardRow>
        <SettingTitle>Balance</SettingTitle>

        <StampCardValue>
          {((Number(stamp.balance) * 39) / 40).toFixed(2)} ETH
          <Tooltip content={"Withdraw"}>
            <Button
              type={"icon"}
              disabled={stamp.balance === "0"}
              onClick={(e) => {
                getStampContract({
                  web3,
                  address: stamp.address,
                  version: stamp.version,
                }).then((contract) =>
                  (contract.methods.claimEth() as ContractSendMethod)
                .send({ from: address })
                .on("receipt", () => {
                  setToastMessage(
                    `Successfully Claimed ${stamp.balance} ETH!`,
                  );
                  setStamp({
                    ...stamp,
                    balance: "0",
                  });
                }),
                       );
                       e.stopPropagation();
              }}
            >
              <ExitIcon color={theme.colors.wheat} width={12} height={12} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>

      <StampCardRow>
        <span>MINTED</span>
        <StampCardValue>
          {stamp.mintIndex}
          <Tooltip content={"Copy checkout link"}>
            <Button
              onClick={(e) => {
                window.navigator.clipboard.writeText(
                  `${window.location.origin}/checkout/${
                    networkNameById[Number(networkId)]
                  }/${stamp.address}`,
                );
                setToastMessage("Copied checkout link!");
                e.stopPropagation();
              }}
              type="icon"
            >
              <Link1Icon width={12} height={12} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>

      <EditableStampCardRow
        field={"supply"}
        stamp={stamp}
        setStamp={setStamp}
      />

      <EditableStampCardRow
        field={"price"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={" ETH"}
      />

      <EditableStampCardRow
        field={"royalty"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={"%"}
      />
    </Box>
  </Box>
};

export default StampSettings;

const ModalInput = styled(Input, {
  paddingLeft: 8,
  border: "1px solid $forest",
  borderRadius: 5,
  fontWeight: 600,
  width: "100%",
});

const StampCardRow = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
  alignItems: "center",
});

const StampCardKey = styled("span", {
  textTransform: "uppercase",
});



const EditableStampCardRow = ({
  field,
  stamp,
  setStamp,
  decorator = "",
}: {
  field: keyof IStampProps;
  stamp: IStampProps;
  setStamp: (s: IStampProps) => void;
  decorator?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const web3 = useWeb3();
  const address = useAddress();
  const [value, setValue] = useState(stamp[field] || 0);

  if (field === "price") {
    console.log("hello world");
    console.log("UI value", typeof value, value);
  }

  return (
    <StampCardRow>
      <StampCardKey>{field}</StampCardKey>
      <StampCardValue>
        {stamp[field]}
        {decorator}
        <Tooltip content={"Edit"}>
          <Button onClick={() => setIsOpen(true)} type={"icon"}>
            <Pencil1Icon color={theme.colors.wheat} width={12} height={12} />
          </Button>
        </Tooltip>

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
                  .on("error", reject),
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
      </StampCardValue>
    </StampCardRow>
  );
};
