export const getChainName = (chainId) => {
    // non-local chains currently available from Metamask
    const chains = [
        {
            chainId: 1,
            chainName: "Ethereum mainnet"
        },
        {
            chainId: 3,
            chainName: "Ropsten testnet"
        },
        {
            chainId: 4,
            chainName: "Rinkeby testnet"
        },
        {
            chainId: 5,
            chainName: "Goerli testnet"
        },
        {
            chainId: 42,
            chainName: "Kovan testnet"
        },
    ];

    let chainName;
    for (let i = 0; i < chains.length; i++){
        if (chains[i].chainId === chainId) {
            chainName = chains[i].chainName
        }
    }

    if (chainName) {
        return chainName;
    } else {
        return "chain ID " + chainId;
    }
}