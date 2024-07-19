import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import multer from "multer"
import path from "path"
import { v4 } from "uuid"
import cron from "node-cron"
import { rateLimit } from "express-rate-limit"
import { Server } from "socket.io"

import fileModel from "./Models/Files.js"
import userRouter from "./Apis/userApis.js"
import userModel from "./Models/userModel.js"
import chatModel from "./Models/chatModel.js"
import groupChatModel from "./Models/groupChatModel.js"
import { timeStamp } from "console"
import groupApi from "./Apis/groupApi.js"


const apiServerInstance = express()
// apiServerInstance.use(express.urlencoded({ extended: true }))

dotenv.config()

apiServerInstance.use(express.json())


//<--------rateLimit----------->
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 1,  // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//     standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
//     // store: ... , // Redis, Memcached, etc. See below.
//     statusCode: 908,
//     message: "rate limit failure",
// })
// apiServerInstance.use(limiter)
//<-------------------->

//<--------cors policy---------->
apiServerInstance.use(cors({
    methods: "*",
    origin: "*",
    // origin: ["http://127.0.0.1:5500",
    //     "http://localhost:5500",
    //     "http://127.0.0.1:5501",
    //     "http://localhost:5501",
    //     "http://localhost:7000",
    // ],

    allowedHeaders: "*",
    exposedHeaders: "*",
    preflightContinue: true,
}));
//<------------------>

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("file == file", file);

        switch (path.extname(file.originalname)) {
            case ".pdf":
                cb(null, 'src/Assets/Pdf');
                break;

            default:
                cb(null, 'src/Assets/Image');
                break;
        }
        // Set the destination folder for uploaded files
    },

    filename: async (req, file, cb) => {

        let extName = path.extname(file.originalname)
        req.body.extension = extName.split(".")[1]

        let uuid = v4()
        req.body.uuid = uuid

        cb(null, `${uuid}${extName}`); // Set a unique filename
        // filename1 = file.originalname;
    }

});

var upload = multer({
    storage: storage,
    limits: { fileSize: 104857600 }
});

apiServerInstance.use(express.json())

apiServerInstance.use(userRouter)

apiServerInstance.use(groupApi)

apiServerInstance.get("/server-status", (req, res) => {
    try {
        res.send("server is live")
    } catch (error) {
        res.send(error)
    }
})

apiServerInstance.get("/getImage/:uuid", async (req, res) => {
    console.log("12345678");
    try {
        console.log("downoad link");

        const fileData = await fileModel.find({ uuid: req.params.uuid })

        let folderName

        switch (fileData[0].ext_name) {
            case "pdf":
                folderName = "Pdf"
                break;

            default:
                folderName = "Image"
                break;
        }

        const filePath = path.resolve(`./src/Assets/${folderName}/${req.params.uuid}.${fileData[0].ext_name}`)
        res.sendFile(filePath)

    } catch (error) {
        console.log("error == ", error);
        res.send(error)
    }
})

apiServerInstance.post('/upload/image', upload.array("file"), async (req, res) => {
    try {
        console.log("body ==", req.body);
        const FileObjectforDb = new fileModel({
            ext_name: req.body.extension,
            uuid: req.body.uuid
        })

        const savedData = await FileObjectforDb.save()

        console.log("image api called");
        res.send(savedData)

    } catch (error) {
        // console.log("error ==", error);
        res.send({
            error: error,
            status: 500
        })
    }
});

apiServerInstance.get("/getAllData", async (req, res) => {
    try {

        const filesData = await fileModel.find();
        res.send(filesData)
    } catch (error) {

        res.send(filesData)
    }
})

//<-----cron---->every same time runing------>
// cron.schedule('*/10 * * * * *', async () => {
//     console.log('Task running every 1 minutes');

//     // Place your task code here
//     const rawData = await fileModel.find()
//     console.log("rawdata ===", rawData);

// }, {
//     timezone: "Asia/Kolkata",
//     runOnInit: true,
// })
//<--------------->


//<-----create server------->
const severport = process.env.SERVER_PORT;
const server = apiServerInstance.listen(severport, () => {

    console.log(`Hello Node == ${severport}`)
})
//<--------------->


//<--------socket connect with api----------->

//The server which in the bracket is api server (line no. 168) and the server which is after new key word is the socker server.
const io = new Server(server, {
    cookie: true,
    cors: {
        origin: "*",
        // origin: ["http://127.0.0.1:5500", "http://192.168.1.20:7000"] //aapde connect kariae tyare same vala no port and aapdu ipconfig
        // origin: ["http://127.0.0.1:5501"] //koi jode connrction kariae tyare, aapdo port je go live kariae tyare aave
    },
});

let connectedSocketUsersObj = {}

// console.log(io);

io.on("connection", (socket) => {
    console.log("user connected and id is === ", socket.id);


    socket.on("disconnect", (socket) => {
        console.log("abcdefgh");
        console.log("user disconnected == ", socket.id);
    });

    socket.on("register", async (doc) => {
        console.log("register event");
        connectedSocketUsersObj[doc.userID] = socket.id
        console.log(connectedSocketUsersObj);

        const data = await userModel.find();

        console.log("data === ", data);

        socket.emit("all_user_get", { data });

        const chatData = await chatModel.find({ senderID: "1" })

        socket.emit("chat-data", { chatData })
    });

    socket.on("drop_message", async (doc) => {
        console.log("driver message doc == ", doc);

        const chatData = await chatModel.find({
            $or: [
                { senderID: doc.senderID, receiverID: doc.receiverID },
                { senderID: doc.receiverID, receiverID: doc.senderID },
            ],
        });

        let chatMessage

        if (!chatData.length) {
            console.log("receiverId == ", doc.receiverID);
            const prepareChatData = new chatModel({
                chatID: v4(),
                senderID: doc.senderID,
                receiverID: doc.receiverID,
                message: doc.message
            })

            const savedData = await prepareChatData.save()
            chatMessage = savedData

        } else {

            const prepareChatData = new chatModel({
                chatID: chatData[0].chatID,
                senderID: doc.senderID,
                receiverID: doc.receiverID,
                message: doc.message
            })

            const savedData = await prepareChatData.save()
            chatMessage = savedData
        }
        console.log("chat message == ", chatMessage);

        const user = connectedSocketUsersObj[`${doc.receiverID}`];
        console.log("user === ", doc.receiverID, user);

        socket.to(user).emit("caught_message",chatMessage);
    });

    socket.on("get_all_chat", async (doc) => {
        const chatData = await chatModel.find({
          $or: [
            { senderID: doc.senderID, receiverID: doc.receiverID },
            { senderID: doc.receiverID, receiverID: doc.senderID },
          ],
        });
    
        socket.emit("catch_all_chat", {chatData})
      })

    socket.on("get_users", async (doc) => {
        try {
            const { search } = doc;
            const str = `/^${search}/`;

            const data = await userModel.find({
                $or: [
                    { name: { $regex: `^[${search}]`, $options: "i" } },
                    { email: { $regex: `^[${search}]`, $options: "i" } },
                ],
            });

            console.log("data === ", data);

            socket.emit("searched_value", { data });
        } catch (error) {
            
        }
    });

    //group join
    socket.on("joinGroup", async (groupID) => {
        socket.join(groupID)
        const group = await groupChatModel.findOne({groupID})

        socket.emit("groupMessage", group.message)
    })

    // group message
    socket.on("groupMesage", async (doc) => {
        const {groupID, senderID, message} = doc
        const group = await groupChatModel.findOneAndUpdate(
            {groupID},
            {$push : {messages: {senderID, message, timeStamp: new Date()}}},
            {new: true}
        )
        io.to(groupID).emit("newGroupMessage", {senderID, message, timeStamp: new Date()})
    })

    socket.on("jkl", (doc) => {
        console.log("jkl log == ", doc);
    });
});