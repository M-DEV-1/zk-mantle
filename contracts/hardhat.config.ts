import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";

dotenv.config();

const getPrivateKey = () => {
  const pk = process.env.ACCOUNT_PRIVATE_KEY;
  if (!pk) throw new Error("ACCOUNT_PRIVATE_KEY not found");
  return pk;
};

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "mantleSepolia",
  networks: {
    mantle: {
      url: "https://rpc.mantle.xyz",
      accounts: [getPrivateKey()],
    },
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      accounts: [getPrivateKey()],
      // Force legacy transaction type by setting gasPrice
      gasPrice: 20000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz/",
        },
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
    ],
  },
};

export default config;
