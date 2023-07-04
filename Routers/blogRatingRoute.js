const express = require('express');
const blogRateRouter = express.Router();
const Blogs = require('../DB/Models/blogs');
const BlogRate = require('../DB/Models/blogRate');
const jwt = require('jsonwebtoken');

function appendTokenToReq(req, res, next) {
    try {
        const headerToken = req.get('authorization');
        if (!headerToken) {
            return res.status(200).json({ success: false, ServerMsg: 'no token availabe' })
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

blogRateRouter.get('/getRating', appendTokenToReq, async (req, res) => {
    try {
        if (req.token === "null") {
            return res.json({ success: false, rating: null });
        }
        // console.log('what i recieved; ',req.query);
        const postid = req.query.postid;
        // console.log('-> ', postid);
        let userId = null;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, rating: null });
            }
            else {
                userId = authData.UserData._id;
            }
        });
        // console.log(userId, postid);
        const ratingObj = await BlogRate.findOne({ userId, blogId: postid });
        // console.log('fetched rating obj:', ratingObj);
        if (!ratingObj) {
            return res.json({ success: true, rating: null });
        }
        else {
            return res.json({ success: true, rating: ratingObj.rating });
        }
    }
    catch (err) {
        return res.json({ success: false, rating: null });
    }
})

async function getAuthorIdbyBlogId(blogId) {
    try {
        const res = await Blogs.findOne({ _id: blogId });
        return res.AuthorId;
    }
    catch (err) {
        return null;
    }
}

async function UpdateRatingofBlog(postId, authorId) {
    try {
        console.log(postId, authorId);
        const obj = await BlogRate.find({ blogId: postId, authorId });
        let averageRating = obj.reduce((acc, val) => {
            return (acc += val.rating);
        }, 0);
        averageRating = averageRating / obj.length;
        console.log(averageRating);
        const updateResult = await Blogs.updateOne({_id: postId, AuthorId: authorId}, { $set: {Rating: averageRating}});
        console.log(updateResult);
    }
    catch (err) {
        console.log('while updating rating: ', err);
        return false;
    }
}

blogRateRouter.post('/ratepost', appendTokenToReq, async (req, res) => {
    try {
        if (req.token === "null") {
            return res.json({ success: false, ServerMsg: 'Your token has expired. Please login again for rating' });
        }
        let userId = null;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, ServerMsg: 'Unauthorized access' });
            }
            else {
                userId = authData.UserData._id;
            }
        });

        const authorId = await getAuthorIdbyBlogId(req.body.postid);
        if (userId === authorId) {
            return res.json({ success: false, ServerMsg: 'You can not rate your own blogs...' });
        }
        const postId = req.body.postid;
        const ratingData = new BlogRate({ userId, blogId: postId, authorId: authorId, rating: req.body.ratingValue });
        await ratingData.save();
        const updateResponse = await UpdateRatingofBlog(postId, authorId);
        if (updateResponse === false) {
            return res.json({ success: true, ServerMsg: 'Unknown Error' });
        }
        else {
            return res.json({ success: true, ServerMsg: 'your rating saved successfully' });
        }
    }
    catch (err) {
        res.json({ success: false, ServerMsg: 'unable to rate the post' });
    }
});


module.exports = blogRateRouter;