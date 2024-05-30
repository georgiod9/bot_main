import { addOrderToDB, genWalletAndSaveDB, IOrderBase } from '../utils';
import { connectDB } from '../utils';
import { Order as OrderMod } from '../models/order';
import { addOrderTasks } from '../queue';

export async function createOrder(Order: IOrderBase) {
    await connectDB()
    const orderID = await OrderMod.countDocuments() + 1
    const orderok = await addOrderToDB(orderID, Order.client, Order.tokenAddress, Order.botNbr, Order.freq, Order.duration, Order.funding, Order.fee)
    if (!orderok) throw new Error(`Error saving order #${orderID}`)
    else {
        console.log(`> Generating ${Order.botNbr} wallets for order #${orderID}...`)
        console.log('-------------------------------------------------------------')
        const walletsok = await genWalletAndSaveDB(orderID, Order.botNbr)
        if (!walletsok) throw new Error(`Error saving wallets for order #${orderID}`)
        else {
            console.log(`> Preparing & adding taskslist to queue for order #${orderID}...`)
            console.log('-------------------------------------------------------------')
            await addOrderTasks(orderID, Order.tokenAddress, Order.freq, Order.duration, Order.funding)
        }
    }
}