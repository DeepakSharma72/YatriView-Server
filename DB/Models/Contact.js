const mongoose = require('mongoose');
const validator = require('validator');

const ContactSchema = new mongoose.Schema({
    fullName: {
       type:  String,
       required: true
    },
    emailAddress: {
        type: String,
        validate: (val) => {
            return validator.isEmail(val);
        },
        required: true 
    },
    subject: {
        type: String,
        minlength: 5,
        maxlength: 30,
        required: true 
    },
    message: {
        type: String,
        minlength: 10,
        maxlength: 200,
        required: true 
    }
});

const ContactModel = new mongoose.model('contactus', ContactSchema);

module.exports = ContactModel;