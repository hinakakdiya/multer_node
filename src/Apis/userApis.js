import express from "express";
import userModel from "../Models/userModel.js";

const userRouter = express.Router()

userRouter.post("/create/users", async (req, res) =>{
    try {
        const userName = req.body.name
        const userEmail = req.body.email
        const userPass = req.body.password

        const dataModel = new userModel({
            name: userName,
            email: userEmail,
            password: userPass
        })

        const savedData = await dataModel.save()

        res.status(200).send(savedData)

    } catch (error) {
        res.status(400).send({
            message: "not found",
            error: error
        })
    }
})

userRouter.get("/user/check/:userEmail", async(req, res) =>{
    try {
        const userEmail = req.params.userEmail

        const userData = await userModel.find({
            email: userEmail
        })

        if(!userData.length){
            res.status(400).send({
                error: "user doesn't exist"
            })
        }

        res.send({
            userDetails: userData[0]
        })

    } catch (error) {
        res.status(400).send({
            error
        })
    }
})

export default userRouter;