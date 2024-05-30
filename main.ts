import { RPC, PROGRAM_ID } from './config/constants';
import { Connection, PublicKey } from '@solana/web3.js';
import { createOrder, cancelOrder } from './_process';
import { parseLogCancel, parseLogOrder } from './utils/parsing';
import { getTxStatus, incrementTxStatus } from './utils';

const connection = new Connection(RPC)
const programId = new PublicKey(PROGRAM_ID)

async function getTransactionLogs(status: number) {
    try {
        const signatures = await connection.getConfirmedSignaturesForAddress2(programId)
        if (status >= 0 && status < signatures.length) {
            const txSign = signatures.reverse()[status].signature
            const txDetails = await connection.getTransaction(txSign)
            if (txDetails && txDetails.meta && txDetails.meta.logMessages) {
                const logs = txDetails.meta.logMessages
                return logs
            } else {
                console.log(`No log for tx ${status}`)
                return []
            }
        }
    } catch (e) {
        console.error(e)
        return []
    }
}

async function check(status: number) {
    const txLog = await getTransactionLogs(status)
    if (txLog) {
        const logMessage = txLog.find(log => log.startsWith('Program log:'))
        if (logMessage && logMessage.includes('NewOrder')) {
            console.log(`> Got a new order`)
            console.log('-------------------------------------------------------------')
            const newOrder = parseLogOrder(logMessage)
            console.log(newOrder)
            if (newOrder != null) {
                await createOrder(newOrder)
            }
            await incrementTxStatus()
        } else if (logMessage && logMessage.includes('CancelOrder')) {
            console.log(`> Got a cancel order request`)
            console.log('-------------------------------------------------------------')
            const cancelRequestID = parseLogCancel(logMessage)
            if (cancelRequestID != null) {
                await cancelOrder(cancelRequestID)
            }
            await incrementTxStatus()
        } else {
            console.log('> NO VALUE or SPAM TX')
            console.log('-------------------------------------------------------------')
            incrementTxStatus()
        }
    } else {
        console.log('> No new transactions, retrying in 30sec...')
        console.log('-------------------------------------------------------------')
    }
}


async function listen() {
    const status = await getTxStatus()
    await check(status)
    console.log("\u001b[1;33m" + 'WAITING ' + "\u001b[0m" + `30sec to check again...`);
    console.log('-------------------------------------------------------------')
    await new Promise(resolve => setTimeout(resolve, 30000));
    listen()
}

async function main() {
    console.log(`LISTENER RUNNING`)
    console.log('-------------------------------------------------------------')
    listen()
}

main().catch((e) => {
    console.error('Main', e)
    listen()
})