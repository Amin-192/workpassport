const hre = require("hardhat");

async function main() {
  const WorkPassport = await hre.ethers.getContractFactory("WorkPassport");
  const workPassport = await WorkPassport.deploy();
  
  await workPassport.waitForDeployment();
  
  console.log("WorkPassport deployed to:", await workPassport.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});