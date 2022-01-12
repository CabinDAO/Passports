# Contributing

This contribution guide should take you through the process of setting up the project locally, choosing a task to work on, and pushing a new pull request. If you have any questions, please reach out through the #passports channel within the CabinDAO Discord.

## Web App Setup

Please follow the steps below to set up the web app locally:

1. Fork the repo to your account
1. Clone the repo from your github to your local machine
1. Navigate to the App's directory with `cd packages/app`
1. Install dependencies with `npm install`
1. Run the app with `npm run dev`

This should open the app in your browser pointed to `localhost:3000`. You could connect to whichever live Ethereum network through your wallet, and the user interface should respond accordingly.

## Contracts Setup

If you are looking to make changes to the smart contracts, it helps to run a local network for the app to interact with.

1. Navigate to the Contracts directory with `cd packages/contracts`
1. Install dependencies with `npm install`
1. Run a local blockchain with `npm run dev`
1. Notice that a bunch of accounts with addresses were printed. Copy the private key of one of them.
1. Create a local `packages/contracts/.env` file and add `PRIVATE_KEY=0x12341234` to the top of the file. Replace `0x12341234` with the private key that you pasted.
1. Open another terminal tab and build the contracts with `npm run build`
1. Deploy the newly build contracts to your local network with `npm run migrate:local`. Copy the address that the PassportFactory was deployed to.
1. Navigate to the `packages/app` directory.
1. Create a local `packages/app/.env` file and add `NEXT_PUBLIC_LOCAL_PASSPORT_ADDRESS=0x12341234` to the top of the file. Replace `0x12341234` with the address that you copied
1. Run the webapp locally by running `npm run dev` from the `packages/app` directory.
1. Once on the browser, add the new network to your wallet. In Metamask, you could do this by going to Settings > Networks > Add Network and fill out the following data:
    - Network Name: Localhost
    - New RPC URL: http://localhost:8545
    - ChainId: 31337
1. You can now connect to and interact with your local network

Note that every time you change the smart contracts, you will need to rebuild and redeploy it to your local network in order to see the changes. Most of the times this will require copying a new contract addres to your `packages/app/.env` file. If you update that file, you will then need to reboot the frontend.

The contract artifacts are deployed as an `npm` package called `@cabindao/nft-passport-contracts`, which is one of the web app's dependencies. To see your changes in production version of the app, we will need to first publish the artifacts to npm, then install the latest version of the package to the web app.

## Bounties

CabinDAO operates under a Bounty system for its products, including Passports. Each Bounty is specced as a task in Clarity, which you could view the full board of tasks [here](https://app.clarity.so/cabin/view/3039c279-2ee2-4da2-a604-dc1c23d5010c). On each task, you could comment to ask questions to gain more context on what needs to be done. Once you understand a task well enough and are interested, you could begin tackling the task.

1. Assign yourself to the task on Clarity and mark the task as "In Progress".
1. Make changes locally to a new branch
1. Push and create a pull request against the main repo
1. Tag the relevant maintainers for review
1. Once approved, merge your pull request and delete the branch
