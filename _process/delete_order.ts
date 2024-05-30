import { setOrderCancelStatus } from "../utils";
import { removeTasksForOrderId } from '../queue';

export async function cancelOrder(orderId: number) {
    console.log(`> Setting cancel status for order #${orderId}...`)
    console.log('-------------------------------------------------------------')
    await setOrderCancelStatus(orderId)
    console.log(`> Deleting all tasks in queue for order #${orderId}...`)
    console.log('-------------------------------------------------------------')
    await removeTasksForOrderId(orderId)
}