import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "../config"
import { getWalletEncodedPrivateKeysForOrderId } from "../utils"
import Bull from "bull"

const redisOptions = { redis: { host: REDIS_HOST, port: parseInt(REDIS_PORT, 10), password: REDIS_PASSWORD, keyPrefix: "{bump}:" } }
const bumpQueue = new Bull("bump", redisOptions)

export async function addOrderTasks(orderID: number, token: string, frequency: number, duration: number, funding: number) {
    let delay = 0
    const PKS = await getWalletEncodedPrivateKeysForOrderId(orderID)
    if (!PKS) {
        console.error("\u001b[1;31m" + '> ERROR ' + "\u001b[0m" + `impossible to extract private keys for order ${orderID}`)
        return
    }
    bumpQueue.add({ task: "set_order_status_live", orderId: `#${orderID.toString()}`, param: orderID }, { delay })
    delay += 1000
    bumpQueue.add({ task: "split", orderId: `#${orderID.toString()}`, param: orderID, funding }, { delay })
    delay += 10500
    for (let i = 0; i < PKS.length; i++) {
        bumpQueue.add({ task: "buy_token", orderId: `#${orderID.toString()}`, param: orderID, skcrypted: PKS[i], token, amountSol: ((funding / PKS.length) / 2) }, { delay })
        delay += frequency * 1000
    }
    const IMS = frequency * 1000
    const NIS = Math.floor(duration * 3600000 / IMS)
    for (let j = 0; j < NIS; j++) {
        const ri = Math.floor(Math.random() * PKS.length);
        const rt = Math.random() < 0.5 ? "buy_token_random" : "sell_token_random"
        bumpQueue.add({ task: rt, orderId: `#${orderID.toString()}`, param: orderID, skcrypted: PKS[ri], token }, { delay: delay + j * IMS })
    }
    delay += duration * 3600000
    bumpQueue.add({ task: "withdraw", orderId: `#${orderID.toString()}`, param: orderID }, { delay })
    delay += 100
    bumpQueue.add({ task: "set_order_status_finished", orderId: `#${orderID.toString()}`, param: orderID }, { delay })
    console.log("\u001b[1;32m" + 'SUCCESS ' + "\u001b[0m" + `adding tasks for order ID #${orderID.toString()}`)
    console.log('-------------------------------------------------------------')
}


export async function removeTasksForOrderId(orderID: number) {
    let delay = 1000
    const alltasks = await bumpQueue.getJobs(["delayed", "active", "waiting", "completed"])
    const tasksok = alltasks.filter(task => task.data.orderId === `#${orderID.toString()}`)
    for (const task of tasksok) {
        await task.remove()
    }
    console.log("\u001b[1;32m" + 'SUCCESS ' + "\u001b[0m" + `removing ${tasksok.length} tasks for order ID #${orderID.toString()}`)
    console.log('-------------------------------------------------------------')
    console.log(`> Initiating emergency withdrawal for order #${orderID}...`)
    bumpQueue.add({ task: "withdraw", orderId: `#${orderID.toString()}`, param: orderID }, { delay })
    console.log('-------------------------------------------------------------')
    console.log("\u001b[1;32m" + 'SUCCESS ' + "\u001b[0m" + `withdrawal initiated for order ID #${orderID.toString()}`)
}
