import mongoose, { Schema, Document, models, ObjectId, Mongoose, Date } from 'mongoose';

export interface ITask extends Document {
    orderId: Number;
    taskName: String;
    taskNumber: Number;
    totalDelayMs: Number;
    expectedEndDate: Date;
    assignedBot?: Number;
}

export const taskSchema = new Schema({
    orderId: {
        type: Number,
        required: true,
    },
    taskName: {
        type: String,
        required: true,
    },
    taskNumber: {
        type: Number,
        required: true
    },
    totalDelayMs: {
        type: Number,
        required: true,
    },
    expectedEndDate: {
        type: Schema.Types.Date,
        required: true,
    },
    assignedBot: {
        type: Number,
        required: false
    }

}, { timestamps: true });


export const Task = models.Task || mongoose.model<ITask>("Task", taskSchema);
export default Task;
