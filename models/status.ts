import mongoose, { Schema } from "mongoose";

export interface IStatus extends Document {
    tx: number;
}

const statusSchema = new Schema({
    tx: {
        type: Number,
        required: true
    },
}, { timestamps: true });

export const StatusMod = mongoose.models.StatusMod || mongoose.model("Status", statusSchema);
export default StatusMod;