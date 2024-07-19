import express from "express";
import groupChatModel from "../Models/groupChatModel.js";

const groupApi = express.Router()

//Create Group
groupApi.post("/create/group", async (req, res) => {
    try {
        const group = req.body.groupName
        const groupMembers = req.body.members

        const dataModel = new groupChatModel({
            groupName: group,
            members: groupMembers
        })

        const savedData = await dataModel.save()

        res.send({
            message: "group created successfully",
            savedData
        })

    } catch (error) {
        res.status(500).send({
            message: "not found",
            error: error
        })
    }
})

//Get Group
groupApi.get("/getGroup/:groupID", async (req, res) => {
    try {
        
        const group = await groupChatModel.findOne({groupID: req.params.groupID})

        req.send({group})

    } catch (error) {
        res.status(500).send({
            error: error
        })
    }
})

//Add Members
groupApi.put("/addMembers/:groupID", async (req, res) => {
    try {
        const group = await groupChatModel.findOne({ groupID: req.params.groupID });

        if (!group) {
            return res.status(404).send({ message: "Group not found" });
        }

        const newMembers = req.body.members;
        group.members = [...new Set([...group.members, ...newMembers])]; // Ensure no duplicates

        const updatedGroup = await group.save();

        res.send({
            message: "Members added successfully",
            updatedGroup
        });

    } catch (error) {
        res.status(500).send({
            message: "Error adding members",
            error: error.message
        });
    }
})

// Remove Members
groupApi.put("/removeMembers/:groupID", async (req, res) => {
    try {
        const group = await groupChatModel.findOne({ groupID: req.params.groupID });

        if (!group) {
            return res.status(404).send({ message: "Group not found" });
        }

        const membersToRemove = req.body.members;
        group.members = group.members.filter(member => !membersToRemove.includes(member));

        const updatedGroup = await group.save();

        res.send({
            message: "Members removed successfully",
            updatedGroup
        });

    } catch (error) {
        res.status(500).send({
            message: "Error removing members",
            error: error.message
        });
    }
})

export default groupApi