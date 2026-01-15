import { viem } from "hardhat";
import { formatEther } from "viem";

async function main() {
    const publicClient = await viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();
    const address = deployer.account.address;

    console.log(`Checking balance for: ${address}`);

    const balance = await publicClient.getBalance({ address });
    console.log(`Balance: ${formatEther(balance)} MNT`);

    const gasPrice = await publicClient.getGasPrice();
    console.log(`Current Gas Price: ${formatEther(gasPrice)} MNT`);
}

main().catch(console.error);
