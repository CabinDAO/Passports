import { GetServerSideProps } from "next";
import { getAbiFromJson, networkIdByName } from "../../../components/constants";
import type { ContractSendMethod } from "web3-eth-contract";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import IpfsImage from "../../../components/IpfsImage";
import {
  Button,
  Label,
  Radio,
  RadioGroup,
  styled,
  Toast,
} from "@cabindao/topo";
import {
  bytes32ToIpfsHash,
  getStampContract,
  getWeb3,
} from "../../../components/utils";
import {
  useAddress,
  useChainId,
  useWeb3,
  Web3Provider,
} from "../../../components/Web3Context";
import QRCode from "qrcode";
import { getAbi, getVersionByAddress } from "../../../components/firebase";
import NetworkIndicator from "../../../components/NetworkIndicator";

type QueryParams = {
  network: string;
  address: string;
};

const App = styled("div", {
  alignItems: "center",
  width: "100%",
  display: "flex",
  position: "relative",
  flexDirection: "row",
  justifyContent: "center",
  height: "100vh",
});

const AppOverview = styled("div", {
  width: "50%",
  padding: "120px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  flexDirection: "column",
  height: "100%",
  color: "white",
});

const AppHeader = styled("header", {
  color: "white",
  paddingBottom: "64px",
  height: "50%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "end",
  alignItems: "start",
});

const AppSummaryContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  height: "50%",
  width: "100%",
});

const ProductSummaryName = styled("span", {
  fontSize: 16,
  fontWeight: 600,
  color: "$sand",
  fontFamily: "$mono",
  lineHeight: "21px",
  textTransform: "uppercase",
  display: "block",
});

const LineItemAmount = styled("span", {
  fontSize: 16,
  fontWeight: 600,
  color: "$sand",
  fontFamily: "$mono",
  lineHeight: "21px",
  textTransform: "uppercase",
});

const ProductSummaryQuantity = styled("span", {
  fontSize: 16,
  fontWeight: 600,
  color: "#8B9389",
  fontFamily: "$mono",
  lineHeight: "21px",
  textTransform: "uppercase",
});

const LineItem = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0 6px 16px",
  alignItems: "start",
  flexGrow: 1,
});

const LineItemSummary = styled("div", {
  display: "flex",
  width: "100%",
  alignItems: "start",
  justifyContent: "start",
});

const LineItemThumbnail = styled("div", {
  width: "80px",
  height: "56px",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
});

const ProductSummaryTotal = styled("h2", {
  fontSize: 32,
  fontWeight: 600,
  fontFamily: "$mono",
  lineHeight: "42px",
  marginBottom: 0,
  marginTop: "16px",
});

const ProductSummaryAmount = styled("h1", {
  fontSize: 48,
  fontWeight: 700,
  fontFamily: "$mono",
  lineHeight: "62px",
  marginTop: 0,
  marginBottom: "64px",
});

const AppPayment = styled("div", {
  width: "50%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
});

const PaymentRequestHeader = styled("div", {
  fontSize: 32,
  fontWeight: 600,
  marginBottom: "24px",
  textTransform: "uppercase",
  color: "white",
  fontFamil: "$mono",
});

const BottomText = styled("p", {
  position: "fixed",
  bottom: 0,
  right: 10,
});

const SelectBoxContainer = styled("div", {
  marginTop: "64px",
  color: "white",
});

type PageProps = {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  price: string;
  metadataHash: string;
  network: string;
  version: string;
};

const walletLabels: Record<string, string> = {
  "": "None",
  apple: "Apple Wallet",
  google: "Google Pay",
};

const CheckoutPageContent = ({
  name,
  symbol,
  supply: initialSupply,
  price,
  address,
  metadataHash,
  network,
  version,
}: PageProps) => {
  const web3 = useWeb3();
  const account = useAddress();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);
  const [supply, setSupply] = useState(initialSupply);
  const correctNetwork = useMemo(
    () => Number(chainId) === Number(networkIdByName[network]),
    [network, chainId]
  );
  const [customization, setCustomization] = useState<Record<string, string>>(
    {}
  );
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [walletPassPlatform, setWalletPassPlatform] = useState<string>("");

  const [qrFile, setQrfile] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Fetch redirect url from DB on page load.
    axios
      .post("/api/customization", {
        address: address,
      })
      .then((result: { data: Record<string, string> }) => {
        setCustomization(result.data);
      })
      .catch(console.error);
  }, [address, setCustomization]);
  useEffect(() => {
    if (!Object.entries(metadata).length && metadataHash) {
      axios.get(`https://ipfs.io/ipfs/${metadataHash}`).then((r) => {
        setMetadata(r.data);
      });
    }
  }, [metadata, metadataHash]);
  const [toastMessage, setToastMessage] = useState("");
  useEffect(() => {
    if (qrFile)
      QRCode.toCanvas(qrCanvasRef.current, qrFile).catch((e) =>
        setToastMessage(`ERROR: ${e.message}`)
      );
  }, [qrFile, qrCanvasRef]);
  const onBuy = useCallback(() => {
    setLoading(true);
    return getStampContract({
      web3,
      address,
      version,
    })
      .then(
        (contract) =>
          new Promise<string>((resolve, reject) =>
            (contract.methods.buy() as ContractSendMethod)
              .send({
                from: account,
                value: web3.utils.toWei(price, "ether"),
              })
              .on("receipt", (receipt) => {
                const tokenId =
                  (receipt.events?.["Transfer"]?.returnValues
                    ?.tokenId as string) || "";
                axios
                  .post("/api/stamp", {
                    token: tokenId,
                    chain: chainId,
                    address: account,
                    contract: address,
                  })
                  .then(() => {
                    setLoading(false);
                    setSupply(supply - 1);
                    resolve(tokenId);
                  });
              })
              .on("error", reject)
          )
      )
      .then((tokenId) => {
        setToastMessage(`Stamp purchased!`);
        if (walletPassPlatform && tokenId) {
          const signatureMessage = `Give Passports permission to generate an Apple Wallet Pass for token ${tokenId}`;
          return web3.eth.personal
            .sign(signatureMessage, account, "")
            .then((signature) =>
              axios.post("/api/ethpass", {
                tokenId,
                address,
                network,
                signature,
                signatureMessage,
                platform: walletPassPlatform,
              })
            )
            .then((r) => setQrfile(r.data.fileURL));
        }
      })
      .then(() => {
        if (customization.redirect_url) {
          // If valid redirection URL is provided, redirect on successful purchase.
          // TODO show success toast and delay redirection.
          //      Maybe also pass qrfile url as a query param
          window.location.assign(customization.redirect_url);
        }
      })
      .catch((e) => {
        setToastMessage(`ERROR: ${e.message}`);
      })
      .finally(() => setLoading(false));
  }, [
    web3,
    network,
    address,
    price,
    setSupply,
    supply,
    customization,
    account,
    chainId,
    version,
    walletPassPlatform,
  ]);
  return (
    <App>
      <AppOverview
        style={{
          background: customization.brand_color || "#1D2B2A",
        }}
      >
        <NetworkIndicator chainId={chainId} />
        {!correctNetwork && (
          <div>
            You are connected to the wrong network to buy this NFT. Please
            switch to {network}
          </div>
        )}
        <ProductSummaryTotal>Total</ProductSummaryTotal>
        <ProductSummaryAmount>{price} ETH</ProductSummaryAmount>
        <LineItemSummary>
          <LineItemThumbnail>
            {metadata && metadata.thumbnail ? (
              <IpfsImage
                cid={metadata.thumbnail}
                height={"100%"}
                width={"100%"}
              />
            ) : null}
          </LineItemThumbnail>
          <LineItem>
            <span>
              <ProductSummaryName>
                {name} ({symbol})
              </ProductSummaryName>
              <ProductSummaryQuantity>Quantity 1</ProductSummaryQuantity>
            </span>
            <LineItemAmount>{price} ETH</LineItemAmount>
          </LineItem>
        </LineItemSummary>
        <SelectBoxContainer>
          <Label label={"Generate Mobile Wallet Pass"}>
            <RadioGroup
              defaultValue={""}
              onValueChange={(val) => setWalletPassPlatform(val)}
            >
              {Object.keys(walletLabels)
                .sort()
                .map((k) => (
                  <Radio
                    id={`radio-${k}`}
                    inputLabel={walletLabels[k]}
                    value={k}
                    key={k}
                  />
                ))}
            </RadioGroup>
          </Label>
        </SelectBoxContainer>
      </AppOverview>
      <AppPayment style={{ backgroundColor: "#324841" }}>
        <PaymentRequestHeader>
          {qrFile
            ? `Download ${walletLabels[walletPassPlatform]}`
            : "Pay With Wallet"}
        </PaymentRequestHeader>
        {!qrFile && (
          <div>
            <Button
              onClick={onBuy}
              disabled={!correctNetwork || loading}
              type="primary"
              tone={"wheat"}
            >
              {customization.button_txt?.replace?.(
                /{supply}/g,
                supply.toString()
              ) || `Buy Stamp`}
            </Button>
          </div>
        )}
        <div>
          <canvas ref={qrCanvasRef} />
        </div>
      </AppPayment>
      <BottomText>
        {customization.logo_cid ? (
          <IpfsImage cid={customization.logo_cid} height={56} width={80} />
        ) : (
          "Powered By CabinDAO"
        )}
      </BottomText>
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </App>
  );
};

const CheckoutPage = (props: PageProps) => {
  return (
    <Web3Provider>
      <CheckoutPageContent {...props} />
    </Web3Provider>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps, QueryParams> = (
  context
) => {
  const { network = "", address = "" } = context.params || {};
  const web3 = getWeb3(network);
  return getVersionByAddress(address, networkIdByName[network])
    .then((version) =>
      getAbi("stamp", version)
        .then((stampJson) => {
          return new web3.eth.Contract(getAbiFromJson(stampJson), address);
        })
        .then((contract) =>
          (contract.methods.get() as ContractSendMethod).call()
        )
        .then((p) => ({
          props: {
            address,
            name: p[0],
            symbol: p[1],
            supply: p[2] - p[3],
            price: web3.utils.fromWei(p[4], "ether"),
            metadataHash: bytes32ToIpfsHash(p[5]),
            network,
            version,
          },
        }))
    )
    .catch((e) => {
      console.error(e);
      return {
        props: {
          address,
          network,
          name: "Not Found",
          symbol: "404",
          price: "0",
          supply: 0,
          metadataHash: "",
          version: "0.0.0",
        },
      };
    });
};

export default CheckoutPage;
