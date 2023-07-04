const express = require('express');
const contactUsRoute = express.Router();
const mongoose = require('mongoose');
const ContactUsCollection = require('../DB/Models/Contact');


contactUsRoute.post('/contactus', async (req, res) => {
    try {
        console.log(req.body);
        if (req.body.subject.length < 5 || req.body.subject.length > 30) {
            return res.json({ success: false, ServerMsg: 'Subject length should be in between 5 to 30 characters' });
        }
        else if (req.body.message.length < 10 || req.body.message.length > 200) {
            return res.json({ success: false, ServerMsg: 'Subject length should be in between 10 to 200 characters' });
        }
        else {
            const newObj = new ContactUsCollection({ fullName: req.body.fullName, emailAddress: req.body.emailAddress, subject: req.body.subject, message: req.body.message });
            await newObj.save();
            // console.log(result);
            return res.status(201).json({ success: true, ServerMsg: 'Message sent successfully' });
        }
    }
    catch (err) {
        console.log('error from contact us: ', err);
        return res.status(404).json({ success: false, ServerMsg: 'Unknown error.' });
    }
})


module.exports = contactUsRoute;