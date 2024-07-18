import mongoose from "mongoose";

const fileSchema  = mongoose.Schema({
    uuid:{
        type: String
    },

    ext_name: {
        type: String
    }
})

const fileModel = mongoose.model("files", fileSchema)

export default fileModel