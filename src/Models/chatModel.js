import mongoose from "mongoose";
import { v4 } from "uuid"

const chatSchema = mongoose.Schema({
    messageID: {
        type: String,
        required: true,
        unique: true,
        default: v4
    },

    chatID: {
        type: String,
        required: true
    },

    senderID: {
        type: String,
        required: true
    },

    receiverID: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["sended","received","seen"],
        default: "sended"
    },

    message: {
        type: String,
        required: true
    },

    time: {
        type: Date,
        default: Date.now()
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    isEdited: {
        type: String,
        default: false
    }

})

const chatModel = mongoose.model("chats", chatSchema)

export default chatModel