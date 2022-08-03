import React, { useState, useCallback } from "react";
import axios from "axios";
import {
  styled,
  theme,
  Box,
  Label,
  Text,
  Tooltip,
  Button,
  Modal,
  Input,
  Toast,
} from "@cabindao/topo";
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
import { useAddress, useChainId, useWeb3 } from "@/components/Web3Context";
import {
  ModalInput,
  ModalContent,
  ModalLabel,
  ModalInputLabel,
  ModalInputBox,
} from "@/components/Modal";
import EditStampField from "@/components/modals/EditStampField";
import TogglePauseStamp from "@/components/modals/TogglePauseStamp";
import AirdropStampModal from "@/components/modals/AirdropStampModal";
import StampOwnershipModal from "@/components/modals/StampOwnershipModal";
import CustomizeStampModal from "@/components/modals/CustomizeStampModal";

import { getStampContract } from "@/utils/stamps";
import { networkNameById } from "@/utils/constants";

import type { ContractSendMethod } from "web3-eth-contract";

// Stamp Settings ----
const SettingTitle = styled(Text, {
  font: "$mono",
  // fontSize: "$sm",
  textTransform: "uppercase",
  fontWeight: "light",
});

const StampCardValue = styled(Text, {
  fontWeight: "$bold",
  fontFamily: "$sans",
  mx: "$2",
  "& > button": {
    height: "16px",
  },
});

const StampCardRow = styled(Box, {
  display: "flex",
  marginBottom: "10px",
  fontSize: "14px",
  fontFamily: "$mono",
  alignItems: "center",
  [`& ${SettingTitle}`]: {
    marginRight: "auto",
  },
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

  return (
    <StampCardRow>
      <SettingTitle>{field}</SettingTitle>
      <StampCardValue>
        {stamp[field]}
        {decorator}
      </StampCardValue>
      <Tooltip content={"Edit"}>
        <Button onClick={() => setIsOpen(true)}>
          <Pencil1Icon color={theme.colors.wheat} width={12} height={12} />
        </Button>
      </Tooltip>

      {/* Modal for editing the stamp field */}
      <EditStampField
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        field={field}
        stamp={stamp}
        setStamp={setStamp}
        value={value}
        setValue={setValue}
      />
    </StampCardRow>
  );
};

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
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();

  const [stamp, setStamp] = useState(props);

  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [pauseIsOpen, setPauseIsOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState("");

  return (
    <Box>
      {/* Settings header toolbar */}
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box>
          <Tooltip content={"Share Stamp Ownership"}>
            <Button onClick={() => setShareIsOpen(true)}>
              <Share1Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Customize checkout"}>
            <Button onClick={setIsCustomizationOpen}>
              <Pencil2Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Airdrop stamps"}>
            <Button onClick={() => setAirDropIsOpen(true)}>
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
              <ReloadIcon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Stamp Settings Body */}
      <Box css={{ padding: "$6 $4", maxWidth: 400 }}>
        <StampCardRow>
          <SettingTitle>Balance</SettingTitle>

          <StampCardValue>
            {((Number(stamp.balance) * 39) / 40).toFixed(2)} ETH
          </StampCardValue>
          <Tooltip content={"Withdraw"}>
            <Button
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
                        `Successfully Claimed ${stamp.balance} ETH!`
                      );
                      setStamp({
                        ...stamp,
                        balance: "0",
                      });
                    })
                );
                e.stopPropagation();
              }}
            >
              <ExitIcon color={theme.colors.wheat} width={12} height={12} />
            </Button>
          </Tooltip>
        </StampCardRow>

        <StampCardRow>
          <SettingTitle>Minted</SettingTitle>
          <StampCardValue>{stamp.mintIndex}</StampCardValue>
          <Tooltip content={"Copy checkout link"}>
            <Button
              onClick={(e) => {
                window.navigator.clipboard.writeText(
                  `${window.location.origin}/checkout/${
                    networkNameById[Number(networkId)]
                  }/${stamp.address}`
                );
                setToastMessage("Copied checkout link!");
                e.stopPropagation();
              }}
            >
              <Link1Icon width={12} height={12} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
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

      {/* Modals */}
      <TogglePauseStamp
        stamp={stamp}
        isOpen={pauseIsOpen}
        setIsOpen={setPauseIsOpen}
      />

      <StampOwnershipModal
        stamp={stamp}
        isOpen={shareIsOpen}
        setIsOpen={setShareIsOpen}
        setStamp={setStamp}
        setToastMessage={setToastMessage}
      />

      <AirdropStampModal
        stamp={stamp}
        isOpen={airDropIsOpen}
        setIsOpen={setAirDropIsOpen}
        setStamp={setStamp}
        setToastMessage={setToastMessage}
      />

      <CustomizeStampModal
        stamp={stamp}
        isOpen={isCustomizationOpen}
        setIsOpen={setIsCustomizationOpen}
        setStamp={setStamp}
        setToastMessage={setToastMessage}
      />
    </Box>
  );
};

export default StampSettings;
