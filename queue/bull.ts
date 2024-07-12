import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "../config"
import { getWalletEncodedPrivateKeysForOrderId } from "../utils"
import Bull from "bull"

const redisOptions = { redis: { host: REDIS_HOST, port: parseInt(REDIS_PORT, 10), password: REDIS_PASSWORD, keyPrefix: "{bump}:" } }
const bumpQueue = new Bull("bump", redisOptions)


bumpQueue.on('error', (error) => {
    console.error('Redis connection error:', error);
});

bumpQueue.on('stalled', (job) => {
    console.error('Job stalled:', job.id);
});

bumpQueue.on('waiting', (jobId) => {
    console.log('Job waiting:', jobId);
});

bumpQueue.on('active', (job, jobPromise) => {
    console.log('Job active:', job.id);
});

bumpQueue.on('completed', (job, result) => {
    console.log('Job completed with result:', result);
});

bumpQueue.on('failed', (job, err) => {
    console.error('Job failed with error:', err);
});



async function checkQueueLength() {
    const waitingCount = await bumpQueue.getWaitingCount();
    const activeCount = await bumpQueue.getActiveCount();
    const completedCount = await bumpQueue.getCompletedCount();
    const failedCount = await bumpQueue.getFailedCount();
    const delayedCount = await bumpQueue.getDelayedCount();

    console.log(`Waiting: ${waitingCount}, Active: ${activeCount}, Completed: ${completedCount}, Failed: ${failedCount}, Delayed: ${delayedCount}`);
}



export async function pingExecService() {
    console.log(`Pinging exec service...`)
    await checkQueueLength();

    bumpQueue.add({ task: "ping", orderId: `pinging...` }, { delay: 0 })
        .then(job => {
            console.log(`Job added with ID: ${job.id}`);
        })
        .catch(err => {
            console.error(`Failed to add job: ${err.message}`);
        });

}

const calculateExpectedEndDate = (delay: number) => {
    const nowMs = new Date().getTime();
    const expectedEndMs = nowMs + delay;
    return new Date(expectedEndMs);
}

// Duration in hours
export async function addOrderTasks(orderID: number, token: string, frequency: number, duration: number, funding: number) {
    let delay = 0
    let tasks = [];
    const startTime = new Date().getTime();

    const PKS = await getWalletEncodedPrivateKeysForOrderId(orderID)
    if (!PKS) {
        console.error("\u001b[1;31m" + '> ERROR ' + "\u001b[0m" + `impossible to extract private keys for order ${orderID}`)
        return
    }
    bumpQueue.add({ task: "set_order_status_live", orderId: `#${orderID.toString()}`, param: orderID }, { delay })

    // Debug tasks
    tasks.push({ orderId: orderID, taskName: "set_order_status_live", taskNumber: tasks.length + 1, totalDelayMs: delay, expectedEndDate: calculateExpectedEndDate(delay) })

    delay += 1000
    bumpQueue.add({ task: "split", orderId: `#${orderID.toString()}`, param: orderID, funding }, { delay })

    // Debug tasks
    tasks.push({ orderId: orderID, taskName: "split", taskNumber: tasks.length + 1, totalDelayMs: delay, expectedEndDate: calculateExpectedEndDate(delay) })
    delay += 10500

    const durationMs = duration * 60 * 60 * 1000;
    const actualEndTimeMs = new Date().getTime() + durationMs;

    console.log(`Creating tasks for buy token for pks:`, PKS)
    for (let i = 0; i < PKS.length; i++) {

        bumpQueue.add({ task: "buy_token", orderId: `#${orderID.toString()}`, param: orderID, skcrypted: PKS[i], token, amountSol: ((funding / PKS.length) / 2) }, { delay })

        // Debug tasks
        tasks.push({ orderId: orderID, taskName: "buy_token", taskNumber: tasks.length + 1, totalDelayMs: delay, expectedEndDate: calculateExpectedEndDate(delay), assignedBot: i })

        delay += frequency * 1000
    }
    const IMS = frequency * 1000
    const NIS = Math.floor(duration * 3600000 / IMS)

    for (let j = 0; j < NIS; j++) {
        const taskDelay = delay + j * IMS;
        const expectedEndTimeMs = startTime + taskDelay;

        // Break out of the task distribution loop
        if (expectedEndTimeMs > actualEndTimeMs) {
            break;
        }

        // Create the buy/sell task
        const ri = Math.floor(Math.random() * PKS.length);
        const rt = Math.random() < 0.5 ? "buy_token_random" : "sell_token_random"
        bumpQueue.add({ task: rt, orderId: `#${orderID.toString()}`, param: orderID, skcrypted: PKS[ri], token, initialBalance: (funding / PKS.length) / 2 }, { delay: taskDelay })

        // Debug tasks
        tasks.push({ orderId: orderID, taskName: rt, taskNumber: tasks.length + 1, totalDelayMs: delay, expectedEndDate: calculateExpectedEndDate(taskDelay), assignedBot: ri })
    }


    delay += duration * 3600000

    const delayDrift = ((Math.abs(delay - actualEndTimeMs)) / delay) * 100;

    // Check if estimated delay is more than 5%
    if (delayDrift > 5) {
        delay = actualEndTimeMs - new Date().getTime(); // Enforce actual end time
    }

    bumpQueue.add({ task: "withdraw", orderId: `#${orderID.toString()}`, param: orderID }, { delay })

    // Debug tasks
    tasks.push({ orderId: orderID, taskName: "withdraw", taskNumber: tasks.length + 1, totalDelayMs: delay, expectedEndDate: calculateExpectedEndDate(delay) })

    delay += 100
    bumpQueue.add({ task: "set_order_status_finished", orderId: `#${orderID.toString()}`, param: orderID }, { delay })
    console.log("\u001b[1;32m" + 'SUCCESS ' + "\u001b[0m" + `adding tasks for order ID #${orderID.toString()}`)
    console.log(`Total delay applied for order #${orderID.toString()} -> ${delay / 1000}seconds -> ${((delay / 1000) / 60) / 60}hrs -> ${delay}ms`)
    console.log('-------------------------------------------------------------')


    return { orderId: orderID, startTime: new Date(), totalDelayMs: delay, tasks: tasks }
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
