import mongoose, { Schema, Document, models, ObjectId, Mongoose } from 'mongoose';

export interface IDelay extends Document {
    orderId: Number;
    startTime: Date;
    totalDelayMs: number;
}

export const delaySchema = new Schema({
    orderId: {
        type: Number,
        required: true,
    },
    startTime: {
        type: Schema.Types.Date,
        required: true,
    },
    totalDelayMs: {
        type: Number,
        required: true,
    },

}, { timestamps: true });


export const Delay = models.Delay || mongoose.model<IDelay>("Delay", delaySchema);
export default Delay;
