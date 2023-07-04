const express = require('express');
const UserRoute = express.Router();
const UserCollection = require('../DB/Models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


UserRoute.post('/signup', async (req, res) => {
    try {
        const result = await UserCollection.find({ email: req.body.email });
        if (result.length !== 0) {
            return res.status(200).json({ success: false, ServerMsg: 'Email ID already exist' })
        }
        else {
            const document = new UserCollection({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            })
            await document.save();
            return res.status(200).json({ success: true, ServerMsg: 'Successfully Registered' })
        }
    }
    catch (err) {
        // console.log(err);
        return res.status(400).json({ success: false, ServerMsg: 'Unknown Error!' })
    }
});


UserRoute.post('/login', async (req, res) => {
    try {
        const userData = await UserCollection.findOne({ email: req.body.email });
        // console.log(req.body.email," : ",userData);
        if (!userData) {
            return res.status(200).json({ success: false, ServerMsg: 'Account with this email not Exist!' });
        }
        const passMatch = await bcrypt.compare(req.body.password, userData.password);
        if (passMatch === false) {
            return res.status(200).json({ success: false, ServerMsg: 'Incorrect Password' });
        }
        else {
            const UserData = { _id: userData._id };
            jwt.sign({ UserData }, process.env.SECRET_KEY, { expiresIn: '86400s' }, (err, token) => {
                if (err) {
                    return res.status(200).json({ success: false, ServerMsg: 'Credentials not matched' });
                }
                else {
                    return res.status(200).json({ success: true, token, ServerMsg: 'Login Successful' });
                }
            });
        }
    }
    catch (err) {
        return res.status(200).json({ success: false, ServerMsg: 'Unkown Error!' });
    }
})


function appendTokenToReq(req, res, next) {
    try {
        const headerToken = req.get('authorization');
        if (!headerToken) {
            return res.status(200).json({ success: false, ServerMsg: 'not token availabe' })
        }
        else {
            req.token = headerToken.split(' ')[1];
            next();
        }
    }
    catch (err) {
        res.status(200).json({ success: false });
    }
}


UserRoute.post('/auth', appendTokenToReq, (req, res) => {
    if (req.token === "null") {
        return res.status(200).json({ success: false });
    }
    jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
        if (err) {
            return res.status(400).json({ success: false, serverMsg: 'Token expired'});
        }
        else {
            return res.status(200).json({ success: true });
        }
    });
})

UserRoute.get('/getprofile', appendTokenToReq, (req, res) => {
    if (req.token === "null") {
        return res.status(200).json({ success: false });
    }
    jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
        if (err) {
            return res.status(400).json({ success: false, serverMsg: 'Token expired' });
        }
        else {
            const userData = await UserCollection.findOne({ _id: authData.UserData._id });
            return res.status(200).json({ success: true, userData: userData });
        }
    })
});

const UpdateUserDetailById = async (obj) => {
    console.log(obj);
    try {
        const hashedPassword = await bcrypt.hash(obj.userpassword, 10);
        // console.log(hashedPassword);
        await UserCollection.updateOne(
            { _id: obj._id },
            { $set: { name: obj.username, email: obj.useremail, password: hashedPassword, userImage: obj.userimage } }
        );
        return { success: true, serverMsg: 'updated succesfully' };
    }
    catch (err) {
        // console.log(err);
        return { success: false, serverMsg: 'Unable to update.. Information provided is wrong' };
    }
}

UserRoute.put('/updateprofile', appendTokenToReq, (req, res) => {
    if (req.token === "null") {
        return res.status(200).json({ success: false });
    }
    jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
        if (err) {
            return res.status(400).json({ success: false, serverMsg: 'Token expired' });
        }
        else {
            const response = await UpdateUserDetailById(req.body)
            return res.status(200).json({ ...response });
        }
    })
})

module.exports = UserRoute;

