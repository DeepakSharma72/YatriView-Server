const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        validate: (val) => {
            return validator.isEmail(val);
        }
    },
    password: {
        type: String,
        required: true
    },
    userImage: {
        type: String
    }
});

UserSchema.pre("save", async function (next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }
        const hashed = await bcrypt.hash(this.password, 10);
        this.password = hashed;
    } catch (err) {
        return next(err);
    }
})

const UserModel = new mongoose.model('user', UserSchema);

module.exports = UserModel;