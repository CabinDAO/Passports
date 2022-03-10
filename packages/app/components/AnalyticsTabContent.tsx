import { Box, Button, Input, Label, Modal, Select, Toast, styled } from "@cabindao/topo";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useAddress, useChainId, useWeb3 } from "./Web3Context";
import {
    TrashIcon
} from "@radix-ui/react-icons";
import type { Contract, ContractSendMethod } from "web3-eth-contract";
import { contractAddressesByNetworkId, getAbiFromJson } from "./constants";
import passportJson from "@cabindao/nft-passport-contracts/artifacts/contracts/Passport.sol/Passport.json";
import passportFactoryJson from "@cabindao/nft-passport-contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";

interface MembershipDetail {
    name: string,
    symbol: string,
    supply: number,
    price: string
}

interface MembershipDetailMap {
    [key: string]: MembershipDetail
}

const EditButton = styled(Button, {
    width: '10%'
});

const AdditionalFieldRow = styled("div", {
    display: "flex",
    alignItems: "center",
    "& input": {
        marginRight: "8px",
    },
});

const SmallBox = styled(Box, {
    width: "25%",
    marginBottom: "15px"
});

const ModalInput = styled(Input, { paddingLeft: 8, marginBottom: 20, width: 400 });

const AnalyticsTabContent = () => {
    const address = useAddress();
    const web3 = useWeb3();
    const chainId = useChainId();
    const [duneUrls, setDuneUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState("");
    const [editIsOpen, setEditIsOpen] = useState(false);
    const [membershipDetails, setMembershipDetails] = useState<MembershipDetailMap>({});
    const defaultDuneUrls: string[] = [];
    const [selectedOption, setSelectedOption] = useState<string>("");
    const contractInstance = useMemo<Contract>(() => {
        const contract = new web3.eth.Contract(getAbiFromJson(passportFactoryJson));
        contract.options.address =
        contractAddressesByNetworkId[chainId]?.passportFactory || "";
        return contract;
    }, [web3, chainId]);

    useEffect(() => {
        // Get all memberships assosciated with wallet
        if (contractInstance.options.address) {
            setShowLoading(true);
            (contractInstance.methods.getMemberships() as ContractSendMethod)
            .call({
                from: address,
            })
            .then((mAddresses: string[]) => {
                if(mAddresses.length > 0) {
                    setShowLoading(true);
                    const promises = mAddresses.map((mAddr) => {
                        const contract = new web3.eth.Contract(getAbiFromJson(passportJson));
                        contract.options.address = mAddr;
                        return (contract.methods.get() as ContractSendMethod).call().then((p) => {
                            const data: MembershipDetailMap = {};
                            data[mAddr] = {
                                name: p[0],
                                symbol: p[1],
                                supply: p[2],
                                price: web3.utils.fromWei(p[3], "ether"),
                            };
                            return data;
                        });
                    });
                    Promise.all(promises).then((values) => {
                        const data = Object.assign({}, ...values);
                        setMembershipDetails(data);
                    })
                    .finally(() => setShowLoading(false));
                }
                else {
                    setMembershipDetails({});
                }
            })
            .catch(console.error)
            .finally(() => setShowLoading(false));
        }
    }, [contractInstance, address, setMembershipDetails]);

    useEffect(() => {
        if (selectedOption && address) {
            setIsLoading(true);
            // Fetch embed urls from DB on page load.
            axios.get("/api/duneEmbeds", {
                params: {
                    address: address,
                    contractAddr: selectedOption
                }
            })
            .then((result: { data: string[] }) => {
                if (result.data.length > 0) {
                    setDuneUrls(result.data);
                }
                else {
                    setDuneUrls(defaultDuneUrls);
                }
            })
            .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`))
            .finally(() => setIsLoading(false));
        }
    }, [selectedOption, address, setDuneUrls]);

    return (
        <>
            <h1>Analytics</h1>
            <SmallBox>
                {(Object.keys(membershipDetails).length > 0) ?
                    <Select
                        label = "Choose Membership Type:"
                        options = {Object.keys(membershipDetails).map((addr) => {
                            return {
                                key: addr, 
                                label: `${membershipDetails[addr]["name"]} (${membershipDetails[addr]["symbol"]})`
                            }
                        })}
                        onChange = {(val) => setSelectedOption(val)}
                        disabled = {false}
                    />  : <div>Please create some Membership Types first!</div>
                }
            </SmallBox>
            { showLoading ? 
                (<Label 
                    label={`Loading...`}
                />) : null
            }
            <Modal
                isOpen={editIsOpen}
                setIsOpen={setEditIsOpen}
                title="Edit Dashboard"
                onConfirm={() => {
                    const data: Record<string,string[]> = {};
                    data[selectedOption] = duneUrls;
                    return axios.post("/api/duneEmbeds", {
                        address: address,
                        data: data
                    })
                    .then((result: {}) => setToastMessage(`Successfully saved!`))
                    .catch((e: Error) => setToastMessage(`ERROR: ${e.message}`));
                }}
            >
                {duneUrls.map((url, idx) => (
                    <AdditionalFieldRow>
                        <ModalInput
                            label={`Visualization URL `+(idx+1)}
                            value={url}
                            onChange={(e) => {
                                const newUrls = [...duneUrls];
                                newUrls.splice(idx,1, e.target.value);
                                setDuneUrls(newUrls);
                            }}
                            type={"string"}
                        />
                        <Button
                            leftIcon={<TrashIcon />}
                            onClick={() => {
                                const newUrls = [...duneUrls];
                                newUrls.splice(idx,1);
                                setDuneUrls(newUrls);
                            }}
                        />
                    </AdditionalFieldRow>
                ))}
                <Button
                    onClick={() =>
                        setDuneUrls([
                        ...duneUrls,
                        "",
                        ])
                    }
                >
                    Add Visualization
                </Button>
            </Modal>
            {isLoading ? 
                <div>Loading...</div> 
            :  <EditButton onClick={() => setEditIsOpen(true)}>Edit Dashboard</EditButton>}
            <table>
                {
                    duneUrls.reduce(
                        function(accumulator: string[][], currentValue, currentIndex, array: string[]) {
                          if (currentIndex % 2 === 0)
                            accumulator.push(array.slice(currentIndex, currentIndex + 2));
                          return accumulator;
                        }
                    , []).map(p => (
                        <tr>
                            <td>
                                <iframe src={p[0]} height='300px' width='100%' />
                            </td>
                            {p[1] ? 
                                (<td>
                                    <iframe src={p[1]} height='300px' width='100%' />
                                </td>) 
                            : null}
                        </tr>
                    ))
                }
            </table>
            <Toast
                isOpen={!!toastMessage}
                onClose={() => setToastMessage("")}
                message={toastMessage}
                intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
            />
        </>
    );
};

export default AnalyticsTabContent;
