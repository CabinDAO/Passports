import { GetServerSideProps } from "next";
import { getAbiFromJson, networkIdByName } from "../../../components/constants";
import type { ContractSendMethod } from "web3-eth-contract";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import IpfsImage from "../../../components/IpfsImage";
import { Checkbox, Label, styled } from "@cabindao/topo";
import { getStampContract, getWeb3 } from "../../../components/utils";
import {
  useAddress,
  useChainId,
  useWeb3,
  Web3Provider,
} from "../../../components/Web3Context";
import QRCode from "qrcode";
import { getAbi, getVersionByAddress } from "../../../components/firebase";

type QueryParams = {
  network: string;
  address: string;
};

const Button = styled("button", {
  display: "inline-flex",
  flexGrow: 0,
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "$sans",
  fontWeight: 600,
  fontSize: "$sm",
  transition: "all 0.2s ease-in-out",
  textDecoration: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  height: "$10",
  py: 0,
  px: "$4",
});

const AppContainer = styled("div", {
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "center",
  "&::before": {
    height: "100%",
    width: "50%",
    background: "#fff",
    position: "fixed",
    content: " ",
    top: 0,
    right: 0,
    animationFillMode: "both",
    transformOrigin: "right",
  },
});

const AppBackground = styled("div", {
  position: "fixed",
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  zIndex: -1,
  background: "$sand",
});

const App = styled("div", {
  alignItems: "flex-start",
  transform: "translateY(max(48px,calc(50vh - 55%)))",
  width: "100%",
  display: "flex",
  position: "relative",
  flexDirection: "row",
  justifyContent: "space-between",
  maxWidth: 920,
});

const AppOverview = styled("div", {
  width: "380px",
  maxWidth: "380px",
});

const AppHeader = styled("header", {
  display: "flex",
  alignItems: "center",
});

const AppNetworkContainer = styled("div", {
  margin: "0 8px",
  background: "$wheat",
  borderRadius: "4px",
  padding: "2px 4px",
  display: "flex",
});

const AppSummaryContainer = styled("div", {
  marginTop: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
});

const ProductSummaryName = styled("span", {
  color: "#00000090",
  fontSize: 16,
  fontWeight: 500,
});

const ProductSummaryAmount = styled("span", {
  color: "#000000",
  fontSize: 36,
  fontWeight: 600,
  margin: "2px 0 3px",
});

const AppPayment = styled("div", {
  width: "380px",
  maxWidth: "380px",
  height: "100%",
  marginBottom: "24px",
});

const PaymentRequestHeader = styled("div", {
  fontSize: 20,
  fontWeight: 500,
  marginBottom: "24px",
});

const BottomText = styled("p", {
  position: "fixed",
  bottom: 0,
  right: 10,
});

const CheckBoxContainer = styled("div", {
  margin: "16px 0",
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
  const [error, setError] = useState("");
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
  const [generateApplePass, setGenerateApplePass] = useState(false);
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
  useEffect(() => {
    if (qrFile)
      QRCode.toCanvas(qrCanvasRef.current, qrFile).catch((e) =>
        setError(e.message)
      );
  }, [qrFile, qrCanvasRef]);
  const onBuy = useCallback(() => {
    setError("");
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
        if (generateApplePass && tokenId) {
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
        setError(e.message);
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
    generateApplePass,
    account,
    chainId,
    version,
  ]);
  return (
    <AppContainer>
      <AppBackground
        style={{
          background: customization.brand_color || "#FDF3E7",
        }}
      />
      <App>
        <AppOverview>
          <AppHeader>
            {customization.logo_cid ? (
              <IpfsImage cid={customization.logo_cid} height={50} width={50} />
            ) : null}
            <AppNetworkContainer>{network}</AppNetworkContainer>
            {!correctNetwork && (
              <div>
                You are connected to the wrong network to buy this NFT. Please
                switch to {network}
              </div>
            )}
          </AppHeader>
          <AppSummaryContainer>
            <ProductSummaryName>
              {name} ({symbol})
            </ProductSummaryName>
            <ProductSummaryAmount>Ξ{price}</ProductSummaryAmount>
            {metadata && metadata.thumbnail ? (
              <IpfsImage cid={metadata.thumbnail} />
            ) : null}
          </AppSummaryContainer>
        </AppOverview>
        <AppPayment>
          <PaymentRequestHeader>Pay With Wallet</PaymentRequestHeader>
          <div>
            <Button
              onClick={onBuy}
              disabled={!correctNetwork || loading}
              style={{
                backgroundColor: customization.accent_color || "#324841",
                color: "#FDF3E7",
              }}
            >
              {customization.button_txt?.replace?.(
                /{supply}/g,
                supply.toString()
              ) || `Buy (${supply} left)`}
            </Button>
          </div>
          <CheckBoxContainer>
            <Label label={"Generate Apple Wallet Pass"}>
              <Checkbox
                checked={generateApplePass}
                onCheckedChange={(e) =>
                  e === "indeterminate"
                    ? setGenerateApplePass(false)
                    : setGenerateApplePass(e)
                }
                disabled={!correctNetwork}
              />
            </Label>
          </CheckBoxContainer>
          <div>
            <canvas ref={qrCanvasRef} />
          </div>
          <p style={{ color: "darkred" }}>{error}</p>
        </AppPayment>
      </App>
      <BottomText>Powered by CabinDAO</BottomText>
    </AppContainer>
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
            metadataHash: p[5],
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
