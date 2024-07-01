import dotenv from 'dotenv';
dotenv.config();

const getEnv = (varName: string) => {
    const variable = process.env[varName] || '';
    return variable;
}

// GLOBAL CONFIG
export const ENCRYPT_PASSWORD = getEnv('ENCRYPT_PASSWORD')
export const MONGODB_URI = getEnv('MONGODB_URI')
export const REDIS_HOST = getEnv('REDIS_HOST')
export const REDIS_PORT = getEnv('REDIS_PORT')
export const REDIS_PASSWORD = getEnv('REDIS_PASSWORD')

// SOLANA MAINNET - NETWORK CONFIG
export const NETWORK = 'mainnet-beta'
export const RPC_DEV = 'https://lingering-damp-lambo.solana-mainnet.quiknode.pro/41ced52afd17c1798eb1b6524ae12a981521a1d4'
export const RPC = 'https://thrilling-orbital-model.solana-mainnet.quiknode.pro/3ece94e189b82ceca072c6ac7f3b3d09e6504463/';
export const PROGRAM_ID_dev = '2kptyUB75N4fZE7FfkMpC1qxoM6VWJ26HN95QFDgN9P4'
export const PROGRAM_ID = 'EJPQnTwg1soxB1qpYMh4B2ZRcgfVdUMghKbuH95kKLa1'
export const NETWORK_LATENCY = 1000; // Latency to communicate with Mongo DocumentDB in ms

// SOLANA DEVNET - NETWORK CONFIG
// export const NETWORK = 'devnet'
// export const RPC = 'https://api.devnet.solana.com'

