import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()

const port = process.env.DB_PORT
const user = process.env.DB_USER
const password = process.env.DB_PASS
const domain = process.env.DB_DOMAIN
const name = process.env.DB_NAME 

console.log("port ===", port);

mongoose.connect(`${port}://${user}:${password}@${domain}/${name}`).then(()=>{
    console.log("database sucessfully connected....");

}).catch((error)=>{
    console.log("error in db connection==",error);
})


// mongodb+srv://kakdiyahina:Hina123@cluster0.5r5newu.mongodb.net/chatapp
// mongodb+srv://ADMIN:123@denish-instance.fgtae5d.mongodb.net/