const hre = require("hardhat");

async function main() {
  const PYUSD_SEPOLIA = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  console.log("Deploying PaymentEscrow...");
  const PaymentEscrow = await hre.ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy(PYUSD_SEPOLIA);
  await escrow.waitForDeployment();
  console.log("PaymentEscrow deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});