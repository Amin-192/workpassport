import { ethers } from "hardhat";

async function main() {
  console.log("Deploying WorkPassport contract...");

  const WorkPassport = await ethers.getContractFactory("WorkPassport");
  const workPassport = await WorkPassport.deploy();

  await workPassport.waitForDeployment();

  const address = await workPassport.getAddress();

  console.log("WorkPassport deployed to:", address);
  console.log("Save this address for frontend integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });