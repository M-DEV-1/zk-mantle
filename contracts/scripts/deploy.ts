import { viem, run } from "hardhat";

async function verifyContract(address: string, constructorArguments: any[] = []) {
    console.log(`Verifying contract at ${address}...`);
    try {
        await run("verify:verify", {
            address,
            constructorArguments,
        });
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log("Verification failed:", error);
        }
    }
}

async function main() {
    console.log("Starting deployment to Mantle Sepolia with Viem...");
    const publicClient = await viem.getPublicClient();

    // 1. Deploy SchemaRegistry
    const schemaRegistry = await viem.deployContract("SchemaRegistry");
    console.log(`SchemaRegistry deployed to: ${schemaRegistry.address}`);

    // 2. Deploy Verifiers
    const verifierAge = await viem.deployContract("VerifierAge");
    console.log(`VerifierAge deployed to: ${verifierAge.address}`);

    const verifierLocation = await viem.deployContract("VerifierLocation");
    console.log(`VerifierLocation deployed to: ${verifierLocation.address}`);

    // 3. Deploy DIDRegistry
    const didRegistry = await viem.deployContract("DIDRegistry");
    console.log(`DIDRegistry deployed to: ${didRegistry.address}`);

    // 4. Configure DIDRegistry
    console.log("Configuring DIDRegistry...");

    // Register Age Schema and Verifier
    // schemaId must match what frontend uses. "age-check".
    const tx1 = await didRegistry.write.setVerifier(["age-check", verifierAge.address]);
    console.log(`Set verifier for 'age-check'. Tx: ${tx1}`);

    // Register Location Schema and Verifier
    // schemaId: "location-check"
    const tx2 = await didRegistry.write.setVerifier(["location-check", verifierLocation.address]);
    console.log(`Set verifier for 'location-check'. Tx: ${tx2}`);

    // 5. Create Schemas in SchemaRegistry
    console.log("Creating Schemas...");
    const tx3 = await schemaRegistry.write.createSchema([
        "age-check",
        "Age Verification",
        "Verifies user is above 18 without revealing exact age."
    ]);
    console.log(`Created schema 'age-check'. Tx: ${tx3}`);

    const tx4 = await schemaRegistry.write.createSchema([
        "location-check",
        "Location Verification",
        "Verifies user is within a specific radius of a provider."
    ]);
    console.log(`Created schema 'location-check'. Tx: ${tx4}`);

    console.log("\nDeployment Complete!");
    console.table({
        SchemaRegistry: schemaRegistry.address,
        VerifierAge: verifierAge.address,
        VerifierLocation: verifierLocation.address,
        DIDRegistry: didRegistry.address,
    });

    // Verify Contracts
    console.log("\nVerifying contracts...");
    // Wait a bit for block propagation
    console.log("Waiting 10 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    await verifyContract(schemaRegistry.address);
    await verifyContract(verifierAge.address);
    await verifyContract(verifierLocation.address);
    await verifyContract(didRegistry.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
