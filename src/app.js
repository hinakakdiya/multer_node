import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import multer from "multer"
import path from "path"
import { v4 } from "uuid"
import cron from "node-cron"
import { rateLimit } from "express-rate-limit"

import admin from "firebase-admin"
import { readFileSync } from "fs"
// import serviceAccount from "../firstfb-6aa63-firebase-adminsdk-vrfzf-452637f945.json" assert { type: "json"}
import serviceAccount from "../firestore-535c6-firebase-adminsdk-tuahb-493092faca.json" assert { type: "json"}

import fileModel from "./Models/Files.js"
import { timeStamp } from "console"
import { type } from "os"


const apiServerInstance = express()
// apiServerInstance.use(express.urlencoded({ extended: true }))

dotenv.config()

apiServerInstance.use(express.json())


//upload file in firebase with postman
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

    //file send karva mate
    // storageBucket: "firstfb-6aa63.appspot.com"

    //database ma data add karva mate
    storageBucket: "firestore-535c6.appspot.com"
});
const bucket = admin.storage().bucket()

const db = admin.firestore()


//rateLimit
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

//cors policy
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

apiServerInstance.get("/server-status", (req, res) => {
    try {
        res.send("server is live")
    } catch (error) {
        res.send(error)
    }
})

//get image in multer
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

//upload image in multer
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

//get all data in multer
apiServerInstance.get("/getAllData", async (req, res) => {
    try {

        const filesData = await fileModel.find();
        res.send(filesData)
    } catch (error) {

        res.send(filesData)
    }
})


//upload file in firebase with postman
apiServerInstance.post('/upload/file', upload.single('file'), async (req, res) => {
    try {
        const { file } = req
        const storageRef = bucket.file(`uploads/${file.originalname}`)
        const fileBuffer = readFileSync(file.path)
        await storageRef.save(fileBuffer, { contentType: file.mimetype })
        const [downloadURL] = await storageRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        })
        res.status(200).json({ message: 'File uploaded successfully', downloadURL })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

//upload file in firebase without postman
const __dirname = path.resolve()
apiServerInstance.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'http://127.0.0.1:5500/firebase.html'))
})

//<-------data add, data delete by ID and data update by ID in firestore-------->
// add data in firebase
apiServerInstance.post('/upload/data', async (req, res) => {
    try {
        const { name, email, std } = req.body;

        const docRef = db.collection('users').doc();  // Create a new document reference
        await docRef.set({
            name,
            email,
            std
        });

        res.status(200).json({ message: 'User data uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// Delete user data by ID in firebase
apiServerInstance.delete('/delete/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const userRef = db.collection('users').doc(userId);
        await userRef.delete();
        res.status(200).json({ message: 'User data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// Update user data by ID in firebase
apiServerInstance.put('/update/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates= req.body
        const userRef = db.collection('users').doc(userId);
        await userRef.update(updates);
        res.status(200).json({ message: 'User data update successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
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


//create server
const severport = process.env.SERVER_PORT;
apiServerInstance.listen(severport, () => {

    console.log(`Hello Node == ${severport}`)
})
//<--------------->


