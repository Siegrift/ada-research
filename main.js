let ethers
try {
  ethers = require('ethers')
} catch {
  console.log(`Error: Unable to load ethers library. Forgot to run "yarn" or "npm i"?`)
  process.exit(0)
}
const assert = require('assert')
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
const { BncClient } = require("@binance-chain/javascript-sdk")
const fetch = require('node-fetch')

const sender = "0xb0A20975f540656E331e2331C6caEc608Ff254fc"
const senderPrivateKey = "0508d5f96e139a0c18ee97a92d890c55707c77b90916395ff7849efafffbd810"
const receiver = "0x0B4F50560fcD98c61D4e61bC1c3AD4FfB8aFde96"

const binanceSmartChainTest = async () => {
  // https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain
  const bscProvider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/")
  const network = await bscProvider.getNetwork()
  assert.strictEqual(network.chainId, 97)

  // used https://testnet.binance.org/faucet-smart to fund the account
  const balance = await bscProvider.getBalance(sender)
  console.log(`Sender balance is: ${balance.toString()} BSC`)
  assert.notStrictEqual(balance.toString(), "0")

  const wallet = new ethers.Wallet(senderPrivateKey, bscProvider)
  assert.deepStrictEqual(await wallet.getBalance(), balance)
  
  const tx = {
    to: receiver,
    value: ethers.utils.parseEther("0.01"), // same denomination between ETH and BSC
  }
  const res = await wallet.sendTransaction(tx)
  const txReceipt = await res.wait()
  console.log(`View transaction on: https://testnet.bscscan.com/tx/${txReceipt.transactionHash}`)

  return Promise.resolve()
}

const ethereumTest = async () => {
  // ethers.getDefaultProvider("ropsten") returns different balance on each getBalance call
  const ropstenProvider = new ethers.providers.EtherscanProvider('ropsten')
  const network = await ropstenProvider.getNetwork()
  assert.strictEqual(network.chainId, 3)

  // used https://faucet.ropsten.be/ to fund the account
  const balance = await ropstenProvider.getBalance(sender)
  console.log(`Sender balance is: ${balance.toString()} ETH`)
  assert.notStrictEqual(balance.toString(), "0")

  const wallet = new ethers.Wallet(senderPrivateKey, ropstenProvider)
  assert.deepStrictEqual(await wallet.getBalance(), balance)
  
  const tx = {
    to: receiver,
    value: ethers.utils.parseEther("0.01"),
  }
  const res = await wallet.sendTransaction(tx)
  const txReceipt = await res.wait()
  console.log(`View transaction on: https://ropsten.etherscan.io/tx/${txReceipt.transactionHash}`)

  return Promise.resolve()
}

const binanceSmartChainStakingTest = async () => {
  // the node was one the listed peers in https://testnet-dex.binance.org/api/v1/peers. See notes or binance staking docs for more info.
  const topValidatorsCommand = './tbnbcli staking side-top-validators --top 3 --side-chain-id=chapel --chain-id=Binance-Chain-Ganges --node=https://data-seed-pre-0-s1.binance.org:443'
  const validators = (await exec(topValidatorsCommand)).stdout

  // this just parses the validator address from the response.
  // Do not pay much attention to the (boring) parsing logic.
  const validatorAddr = validators.split('\n\n')[0]
    .split('\n')
    .slice(1)
    .reduce((acc, x) => {
      const [k, v] = x.split(':')
      acc[k.trim()] = v.trim()
      return acc
    }, {})
    ['Operator Address']

  // this key should be created per instructions in README
  const from = 'test_key'
  const publicKey = 'tbnb1z66d2rmcp302mula5sm7ufjmwqmn30qj7nj4j6'
  const password = 'password'

  const amount = 100000000 // = 1 BNB, which is minimum
  const delegateComamnd = `echo ${password} | ./tbnbcli staking bsc-delegate --chain-id Binance-Chain-Ganges --side-chain-id chapel --from ${from} --node https://data-seed-pre-0-s1.binance.org:443 --validator ${validatorAddr} --amount ${amount}:BNB --home .`

  // inspect the transaction on testnet explorer
  // e.g. https://testnet-explorer.binance.org/tx/D17AF10685ADE92ABF1CC59C19F45D0A09C6EAA852368C08E6D06BCCF730EBCB
  // (use 'tx hash' from the console output)
  console.log((await exec(delegateComamnd)).stdout)

  // unfortunately, thuis seems not available in the JS SDK at the moment.
  // also the library is not really maintained? Last commit was 9 months ago...
  const queryDelegations = `./tbnbcli staking side-delegations ${publicKey} --chain-id Binance-Chain-Ganges --side-chain-id chapel --node https://data-seed-pre-0-s1.binance.org:443 --home .`
  const delegations = (await exec(queryDelegations)).stdout
  console.log(delegations)
}

const binanceSmartJavascriptStakingTest = async () => {
  // this API is poorly documented, the logic was reverse engeneered by looking at the code
  // implementation: https://github.com/binance-chain/javascript-sdk/commit/451adeea390573cfc5e12d1fcab0db09d0108782
  const client = new BncClient("https://testnet-dex.binance.org/")
  await client.initChain()

  const mnemonic = 'cause lecture affair occur liar menu air under powder whisper brain tuition hair youth finger void air usage jelly multiply sense express insane engage'
  const account = client.recoverAccountFromMneomnic(mnemonic)
  await client.setPrivateKey(account.privateKey)

  // reverse engeneered from https://testnet-staking.binance.org/en/staking (see notes for mainnet endpoint)
  const res = await fetch("https://testnet-api.binance.org/v1/staking/chains/chapel/validators?limit=3&offset=0", {
    "headers": {
      "accept": "*/*",
      "accept-language": "sk-SK,sk;q=0.9,cs;q=0.8,en-US;q=0.7,en;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site"
    },
    "referrer": "https://testnet-staking.binance.org/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
  });

  const {validators} = await res.json();
  // inspec the result on tesnet explorer: (e.g. https://testnet-explorer.binance.org/tx/D7A5AABE5A3E10E2C73930B96C14CBFC03962E13B1CD92082B2B149B5FA9B1BF)
  console.log(
    await client.stake.bscDelegate({
      delegateAddress: account.address,
      validatorAddress: validators[0].validator,
      amount: 1,
    })
  )
}

const main = async () => {
  await binanceSmartChainTest()
  await ethereumTest()
  await binanceSmartChainStakingTest()
  await binanceSmartJavascriptStakingTest()
}

main()
