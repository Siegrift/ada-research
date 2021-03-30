# Ada-research

Basic example of sending transactions on Ethereum and Binance smart chain networks.

## Running the example

1. Install js dependencies (ethers.js) with: `yarn` or `npm i`
2. Download BSC CLI tool from [here](https://docs.binance.org/api-reference/cli.html#where-can-i-download-the-binance-chain-cli)
3. Recover the BSC account
   1. `./tbnbcli keys add test_key --recover --home .`
   2. Use password: `password`
   3. Enter the seed: `cause lecture affair occur liar menu air under powder whisper brain tuition hair youth finger void air usage jelly multiply sense express insane engage`
4. Run `node main.js`
