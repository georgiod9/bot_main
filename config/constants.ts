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
export const RPC = 'https://lingering-damp-lambo.solana-mainnet.quiknode.pro/41ced52afd17c1798eb1b6524ae12a981521a1d4'
export const PROGRAM_ID = '2kptyUB75N4fZE7FfkMpC1qxoM6VWJ26HN95QFDgN9P4'

// SOLANA DEVNET - NETWORK CONFIG
// export const NETWORK = 'devnet'
// export const RPC = 'https://api.devnet.solana.com'

