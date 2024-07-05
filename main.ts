import { RPC, PROGRAM_ID } from './config/constants';
import { Connection, PublicKey } from '@solana/web3.js';
import { createOrder, cancelOrder } from './_process';
import { parseLogCancel, parseLogOrder } from './utils/parsing';
import { connectDB, decrementTxStatus, getTxStatus, incrementTxStatus, resetTxStatus } from './utils';
import { pingExecService } from './queue';

const connection = new Connection(RPC)
const programId = new PublicKey(PROGRAM_ID)

async function getTransactionLogs(status: number) {
    try {
        console.log(`Current status:`, status)
        const signatures = await connection.getConfirmedSignaturesForAddress2(programId)
        console.log(`Retrieved signatures for program ID ${PROGRAM_ID}:`, signatures.length)
        if (status >= 0 && status < signatures.length) {
            console.log(`status within range....`)
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
        else {
            // await decrementTxStatus();
        }
    } catch (e) {
        console.error(e)
        return []
    }
}

async function check(status: number) {
    const txLog = await getTransactionLogs(status)
    await pingExecService();
    if (txLog) {
        const logMessage = txLog.find(log => log.startsWith('Program log:'))

        // Check for deployment transaction log
        if (!logMessage) {
            console.log(`Log message does not include "Program log" string. Searching for deployment tx.`)

            const deployMessage = txLog.find(log => log.startsWith('Deployed program'))

            if (deployMessage && deployMessage.includes(PROGRAM_ID)) {
                console.log('> Identified Initial deployment transaction.')
                console.log('-------------------------------------------------------------')
                resetTxStatus(); // Set status to 1 in case of a new program
            }
            else {
                console.log(`Unidentified program log:`, txLog)
            }
        }
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
                console.log(`Cancelling order id:`, cancelRequestID)
                await cancelOrder(cancelRequestID)
            }
            await incrementTxStatus()
        }

        else if (logMessage) {
            console.log('> NO VALUE or SPAM TX')
            console.log(`Log mesage`, logMessage)
            console.log('-------------------------------------------------------------')
            incrementTxStatus()
        }
        else {
            console.log('> NULL VALUE LOG MESSAGE OR ERROR')
            console.log(`Log mesage`, logMessage)
            console.log('-------------------------------------------------------------')
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
    console.log(`CONNECTING TO MONGO DB...`);
    await connectDB();
    console.log(`DB CONNECTED!`);
    console.log(`LISTENER RUNNING`)
    console.log('-------------------------------------------------------------')
    listen()
}

main().catch((e) => {
    console.error('Main', e)
    listen()
})