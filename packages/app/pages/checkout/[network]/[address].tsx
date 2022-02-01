import { GetStaticPaths, GetServerSideProps } from "next";
import {
  networkNameById,
  contractAddressesByNetworkId,
  getAbiFromJson,
  networkIdByName
} from "../../../components/constants";
import { ContractSendMethod } from "web3-eth-contract";
import Web3 from "web3";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import { styled } from "../../../stitches.config";
import BN from "bn.js";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { IpfsImage } from "../..";

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
  px: "$4"
})

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
    right: 10
})

type PageProps = {
  address: string;
  name: string;
  symbol: string;
  supply: number;
  price: string;
  metadataHash: string;
  network: string;
};

const CheckoutPage = ({
  name,
  symbol,
  supply: initialSupply,
  price,
  address,
  metadataHash,
  network,
}: PageProps) => {
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [supply, setSupply] = useState(initialSupply);
  const [customization, setCustomization] = useState<Record<string,string>>({});
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  useEffect(() => {
    // Fetch redirect url from DB on page load.
    axios.post("/api/customization", {
      address: address
    })
    .then((result: { data: Record<string,string> }) => {
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
  const onBuy = useCallback(() => {
    setError("");
    setLoading(true);
    return (
      web3.current.givenProvider.isConnected()
        ? Promise.resolve()
        : (web3.current.givenProvider.enable() as Promise<void>)
    )
      .then(() =>
        Promise.all([
          web3.current.eth.getAccounts(),
          web3.current.eth.getChainId(),
        ])
      )
      .then(([accounts, chainId]) => {
        if (Number(chainId) !== Number(networkIdByName[network])) {
          setError(`Signed into the wrong network`);
          return;
        }
        const contract = new web3.current.eth.Contract(
          getAbiFromJson(passportJson),
          address
        );
        (
          contract.methods.buy(
            new BN(web3.current.utils.randomHex(32).replace(/^0x/, ""), "hex")
          ) as ContractSendMethod
        )
          .send({
            from: accounts[0],
            value: web3.current.utils.toWei(price, "ether"),
          })
          .on("receipt", (receipt) => {
            const id =
              (receipt.events?.["Purchase"]?.returnValues?.id as string) || "";
            console.log("successfully bought", id, "!");
            setLoading(false);
            setSupply(supply - 1);
            if (customization.url) {
              // If valid redirection URL is provided, redirect on successful purchase.
              // TODO show success toast and delay redirection.
              window.location.assign(customization.url);
            }
          })
          .on("error", (e) => {
            setError(e.message);
            setLoading(false);
          });
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [web3, network, address, price, setSupply, supply, customization]);
  return (
    <AppContainer>
      <AppBackground 
        style={{
          background: (customization.brand_color || "$sand")
        }}
      />
      <App>
        <AppOverview>
          <AppHeader>
            {
              (customization.logo_cid) ?
                (<IpfsImage
                  cid={customization.logo_cid}
                  height={50}
                  width={50}
                />) : null
            }
            <AppNetworkContainer>{network}</AppNetworkContainer>
          </AppHeader>
          <AppSummaryContainer>
            <ProductSummaryName>
              {name} ({symbol})
            </ProductSummaryName>
            <ProductSummaryAmount>Ξ{price}</ProductSummaryAmount>
            {
              (metadata && metadata.thumbnail) ?
                (<IpfsImage
                  cid={metadata.thumbnail}
                />) : null
            }
          </AppSummaryContainer>
        </AppOverview>
        <AppPayment>
          <PaymentRequestHeader>Pay With Wallet</PaymentRequestHeader>
          <Button 
            onClick={onBuy} 
            disabled={loading}
            style={{
              backgroundColor: (customization.accent_color || "$forest")
            }}
          >
            {customization.button_txt || "Buy"} ({supply} left)
          </Button>
          <p style={{ color: "darkred" }}>{error}</p>
        </AppPayment>
      </App>
      <BottomText>Powered by CabinDAO</BottomText>
    </AppContainer>
  );
};

const getWeb3 = (networkName: string) =>
  new Web3(
    networkName === "localhost"
      ? "http://localhost:8545"
      : `https://eth-${networkName}.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
  );

export const getStaticPaths: GetStaticPaths<QueryParams> = () => {
  return Promise.all(
    Object.entries(networkNameById)
      .map(([id, name]) => ({
        name,
        address: contractAddressesByNetworkId[Number(id)].passportFactory,
      }))
      .filter(({ address }) => !!address)
      .map(({ name, address }) => {
        const web3 = getWeb3(name);
        const contract = new web3.eth.Contract(
          getAbiFromJson(passportFactoryJson),
          address
        );
        return (contract.methods.getPassports() as ContractSendMethod)
          .call()
          .then((addresses: string[]) =>
            addresses.map((address) => ({ params: { network: name, address } }))
          );
      })
  ).then((paths) => {
    return { paths: paths.flat(), fallback: true };
  });
};

export const getServerSideProps: GetServerSideProps<PageProps, QueryParams> = (
  context
) => {
  const { network = "", address = "" } = context.params || {};
  const web3 = getWeb3(network);
  const contract = new web3.eth.Contract(getAbiFromJson(passportJson), address);
  return (contract.methods.get() as ContractSendMethod)
    .call()
    .then((p) => ({
      props: {
        address,
        name: p[0],
        symbol: p[1],
        supply: p[2],
        price: web3.utils.fromWei(p[3], "ether"),
        metadataHash: p[4],
        network,
      },
    }))
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
          metadataHash: ""
        },
      };
    });
};

export default CheckoutPage;
