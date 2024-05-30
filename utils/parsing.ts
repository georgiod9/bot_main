import { IOrderBase } from "./interfaces";

export function parseLogOrder(log: string): IOrderBase | null {
    const clientRegex = /client: ([^,]+),/
    const tokenRegex = /token: ([^,]+),/
    const botRegex = /bot: (\d+),/
    const frequencyRegex = /frequency: (\d+),/
    const durationRegex = /duration: (\d+),/
    const fundingRegex = /funding: (\d+),/
    const feeRegex = /fee: (\d+)/

    const clientMatch = log.match(clientRegex)
    const tokenMatch = log.match(tokenRegex)
    const botMatch = log.match(botRegex)
    const frequencyMatch = log.match(frequencyRegex)
    const durationMatch = log.match(durationRegex)
    const fundingMatch = log.match(fundingRegex)
    const feeMatch = log.match(feeRegex)

    if (clientMatch && tokenMatch && botMatch && frequencyMatch && durationMatch && fundingMatch && feeMatch) {
        const [, client] = clientMatch
        const [, token] = tokenMatch
        const [, botNbr] = botMatch
        const [, freq] = frequencyMatch
        const [, duration] = durationMatch
        const [, funding] = fundingMatch
        const [, fee] = feeMatch

        const Order: IOrderBase = {
            client: client,
            tokenAddress: token,
            botNbr: parseInt(botNbr),
            freq: parseInt(freq),
            duration: parseInt(duration),
            funding: parseInt(funding) / 100,
            fee: parseInt(fee) / 100,
        }
        return Order
    }
    return null
}

export function parseLogCancel(log: string): number | null {
    const regex = /CancelOrder \{ id: (\d+) \}/
    const match = log.match(regex)
    if (match) {
        const [, id] = match
        return parseInt(id)
    } else {
        return null
    }
}