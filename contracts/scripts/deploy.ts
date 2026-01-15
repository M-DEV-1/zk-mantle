import hre from "hardhat";

async function main() {
    console.log("Deploying ZK GPS contracts to Mantle Sepolia...\n");

    const publicClient = await hre.viem.getPublicClient();
    const [deployer] = await hre.viem.getWalletClients();

    console.log("Deployer:", deployer.account.address);

    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log("Balance:", (Number(balance) / 1e18).toFixed(4), "MNT\n");

    // 1. Deploy Age Verifier (Groth16)
    console.log("1. Deploying Age Verifier...");
    const ageVerifier = await hre.viem.deployContract("contracts/VerifierAge.sol:Groth16Verifier");
    console.log("   Age Verifier deployed to:", ageVerifier.address);

    // 2. Deploy Location Verifier (Groth16)
    console.log("2. Deploying Location Verifier...");
    const locationVerifier = await hre.viem.deployContract("contracts/VerifierLocation.sol:Groth16Verifier");
    console.log("   Location Verifier deployed to:", locationVerifier.address);

    // 3. Deploy ZKGPSVerifier (main registry)
    console.log("3. Deploying ZKGPSVerifier...");
    const zkgpsVerifier = await hre.viem.deployContract("ZKGPSVerifier", [ageVerifier.address]);
    console.log("   ZKGPSVerifier deployed to:", zkgpsVerifier.address);

    // 4. Deploy DID Registry
    console.log("4. Deploying DID Registry...");
    const didRegistry = await hre.viem.deployContract("DIDRegistry");
    console.log("   DID Registry deployed to:", didRegistry.address);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log(`
Add these to your client/.env:

NEXT_PUBLIC_VERIFIER_AGE_ADDRESS=${ageVerifier.address}
NEXT_PUBLIC_VERIFIER_LOCATION_ADDRESS=${locationVerifier.address}
NEXT_PUBLIC_ZKGPS_VERIFIER_ADDRESS=${zkgpsVerifier.address}
NEXT_PUBLIC_DID_REGISTRY_ADDRESS=${didRegistry.address}

View on MantleScan:
https://sepolia.mantlescan.xyz/address/${zkgpsVerifier.address}
`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
