import { expect } from "chai";
import { ethers } from "hardhat";

describe("WorkPassport", function () {
  it("Should add and retrieve credentials", async function () {
    const WorkPassport = await ethers.getContractFactory("WorkPassport");
    const workPassport = await WorkPassport.deploy();
    await workPassport.waitForDeployment();

    const [owner, worker] = await ethers.getSigners();
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("test credential"));

    await workPassport.addCredential(worker.address, testHash);

    const credentials = await workPassport.getCredentials(worker.address);
    expect(credentials.length).to.equal(1);
    expect(credentials[0].hash).to.equal(testHash);
  });
});