import { ethers } from "hardhat";

async function main() {
    console.log("Deploying ZK GPS contracts to Mantle Sepolia...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT\n");

    // 1. Deploy Age Verifier (Groth16)
    console.log("1. Deploying Age Verifier...");
    const AgeVerifier = await ethers.getContractFactory("contracts/VerifierAge.sol:Groth16Verifier");
    const ageVerifier = await AgeVerifier.deploy();
    await ageVerifier.waitForDeployment();
    const ageVerifierAddress = await ageVerifier.getAddress();
    console.log("   Age Verifier deployed to:", ageVerifierAddress);

    // 2. Deploy Location Verifier (Groth16)
    console.log("2. Deploying Location Verifier...");
    const LocationVerifier = await ethers.getContractFactory("contracts/VerifierLocation.sol:Groth16Verifier");
    const locationVerifier = await LocationVerifier.deploy();
    await locationVerifier.waitForDeployment();
    const locationVerifierAddress = await locationVerifier.getAddress();
    console.log("   Location Verifier deployed to:", locationVerifierAddress);

    // 3. Deploy ZKGPSVerifier (main registry)
    console.log("3. Deploying ZKGPSVerifier...");
    const ZKGPSVerifier = await ethers.getContractFactory("ZKGPSVerifier");
    const zkgpsVerifier = await ZKGPSVerifier.deploy(ageVerifierAddress);
    await zkgpsVerifier.waitForDeployment();
    const zkgpsVerifierAddress = await zkgpsVerifier.getAddress();
    console.log("   ZKGPSVerifier deployed to:", zkgpsVerifierAddress);

    // 4. Deploy DID Registry
    console.log("4. Deploying DID Registry...");
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    const didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    const didRegistryAddress = await didRegistry.getAddress();
    console.log("   DID Registry deployed to:", didRegistryAddress);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log(`
Add these to your client .env:

NEXT_PUBLIC_VERIFIER_AGE_ADDRESS=${ageVerifierAddress}
NEXT_PUBLIC_VERIFIER_LOCATION_ADDRESS=${locationVerifierAddress}
NEXT_PUBLIC_ZKGPS_VERIFIER_ADDRESS=${zkgpsVerifierAddress}
NEXT_PUBLIC_DID_REGISTRY_ADDRESS=${didRegistryAddress}

View on MantleScan:
https://sepolia.mantlescan.xyz/address/${zkgpsVerifierAddress}
`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
