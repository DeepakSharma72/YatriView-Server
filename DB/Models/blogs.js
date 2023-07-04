const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 250
    },
    Categories: {
        type: [{cat_active: Boolean, cat_name: String}]
    },
    BlogImage: {
        type: String,
        required: true
    },
    Content: {
        type: String,
        maxlength: 3000,
        required: true
    },
    Rating: {
        type: Number,
        default: 0
    },
    Views: {
        type: Number,
        default: 0
    },
    ReadTime: {
        type: Number,
        default: 0
    },
    AuthorId: {
        type: String,
        required: true
    }
}, { timestamps: true });

const BlogModel = new mongoose.model('post',BlogSchema);

module.exports = BlogModel;