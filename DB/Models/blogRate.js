const mongoose = require('mongoose');

const blogRateSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    blogId: {
        type: String, 
        required: true
    },
    authorId:{
        type: String,
        required: true 
    },
    rating:{
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
});

const blogRateModel = mongoose.model('blogratings', blogRateSchema);

module.exports = blogRateModel;
