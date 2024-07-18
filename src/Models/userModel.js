import mongoose from "mongoose"
import {v1} from "uuid"

const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: true 
    },

    userID:{
        type: String,
        default: v1
    },

    email:{
        type: String,
        unique: true,
        required: true
    },

    password:{
        type: String,
        required: true
    }
})

const userModel = mongoose.model("createUser", userSchema)
export default userModel;