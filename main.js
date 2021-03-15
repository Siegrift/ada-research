let ethers
try {
  ethers = require('ethers')
} catch {
  console.log(`Error: Unable to load ethers library. Forgot to run "yarn" or "npm i"?`)
  process.exit(0)
}
const assert = require('assert')

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

const main = async () => {
  await binanceSmartChainTest()
  await ethereumTest()
}

main()
