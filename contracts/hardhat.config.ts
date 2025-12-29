import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "mantleSepolia",
  networks: {
    mantle: {
      url: "https://rpc.mantle.xyz", // mainnet
      accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
    },
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
    },
  }
};

export default config;
