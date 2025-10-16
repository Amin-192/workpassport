const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkPassport", function () {
  it("Should issue a credential", async function () {
    const [employer, worker] = await ethers.getSigners();
    
    const WorkPassport = await ethers.getContractFactory("WorkPassport");
    const workPassport = await WorkPassport.deploy();
    
    const credHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential"));
    
    await workPassport.connect(employer).issueCredential(worker.address, credHash);
    
    const count = await workPassport.getCredentialCount(worker.address);
    expect(count).to.equal(1);
  });
});