import mongoose from "mongoose";
import {v4} from "uuid"

const groupChatSchema = mongoose.Schema({
    groupID: {
        type: String,
        required: true,
        // unique: true,
        default: v4
    },

    groupName: {
        type:String,
        required: true
    },

    members: {
        type: [String],
        required: true
    },
    
    // message: {
    //     // type: [object],
    //     type: String,
    //     required: true
        
    // }
})

const groupChatModel = mongoose.model("groupChat", groupChatSchema)

export default groupChatModel