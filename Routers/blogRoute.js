const express = require('express');
const blogRoute = express.Router();
const Blogs = require('../DB/Models/blogs');
const BlogRate = require('../DB/Models/blogRate');
const UserCollection = require('../DB/Models/user');
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


blogRoute.post('/postblog', appendTokenToReq, async (req, res) => {
    try {
        if (req.token === "null") {
            return res.status(200).json({ success: false, serverMsg: 'Unauthorized access' });
        }
        jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
            try {
                if (err) {
                    return res.status(400).json({ success: false, serverMsg: 'Token expired' });
                }
                else {
                    const AuthorId = authData.UserData._id
                    const Title = req.body.blogHeading.trim();
                    const Categories = req.body.blogCategories;
                    const BlogImage = req.body.uploadImg;
                    const Content = req.body.blogContent.trim();
                    var obj = new Blogs({ AuthorId, Title, Categories, BlogImage, Content });
                    // console.log(Categories);
                    const result = await obj.save();
                    return res.status(200).json({ success: true, serverMsg: 'Blog published successfully', blogLink: result._id });
                }
            }
            catch (err) {
                return res.status(200).json({ success: false, serverMsg: 'Unknown error' });
            }
        })
    }
    catch (err) {
        // console.log(err);
        return res.status(200).json({ success: false, serverMsg: 'Unknow error' });
    }
});


blogRoute.get('/getblogs/:offset', async (req, res) => {
    try {
        const slotSize = 4;
        const offset = req.params['offset'];
        console.log(offset);
        const blogs = await Blogs.find().skip(slotSize * offset).limit(slotSize).sort({ createdAt: -1 });
        let blogArr = [];
        for (let obj of blogs) {
            blogArr.push({ _id: obj._id, Title: obj.Title, BlogImage: obj.BlogImage, Rating: obj.Rating, Views: obj.Views, date: obj.createdAt, Content: obj.Content });
        }
        // console.log(blogArr);
        return res.json({ success: true, blogArr, EOF: (blogArr.length < slotSize ? true : false) });
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, serverMsg: 'Unknown error' });
    }
});

async function getAuthorNamebyId(authorId) {
    try {
        const obj = await UserCollection.findOne({ _id: authorId });
        return obj.name;
    }
    catch (err) {
        return null;
    }
}

async function getAuthorIdbyBlogId(blogId) {
    try {
        const res = await Blogs.findOne({ _id: blogId });
        return res.AuthorId;
    }
    catch (err) {
        return null;
    }
}

blogRoute.get('/getpost/:postid', appendTokenToReq, async (req, res) => {
    try {
        const postid = req.params.postid;
        let userId = null;
        let AuthorName = null;
        if (req.token !== "null") {
            jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
                if (!err) {
                    userId = authData.UserData._id;
                }
            });
        }
        const postObj = await Blogs.findOne({ _id: postid });
        AuthorName = await getAuthorNamebyId(postObj.AuthorId);
        const isUseraAuthor = (postObj.AuthorId === userId);
        const isUserActive = (userId !== null);
        const finalObj = {
            Title: postObj.Title,
            BlogImage: postObj.BlogImage,
            Rating: postObj.Rating,
            Views: postObj.Views,
            AuthorName,
            Date: postObj.createdAt,
            Content: postObj.Content,
            ReadTime: postObj.ReadTime,
            Categories: postObj.Categories,
            isUserActive,
            isUseraAuthor
        }
        return res.json({ success: true, BlogObj: finalObj });
    }
    catch (err) {
        return res.json({ success: false, serverMsg: 'Unable to fetch the post' });
    }
})


blogRoute.patch('/updateviews', async (req, res) => {
    try {
        const { postid } = req.body;
        // console.log(postid);
        const { acknowledged } = await Blogs.updateOne({ _id: postid }, { $inc: { Views: 1 } });
        return res.json({ viewstatus: acknowledged });
    }
    catch (err) {
        console.log('Updating Views error :', err);
        return res.json({ viewstatus: false });
    }
})

blogRoute.delete('/deletepost', appendTokenToReq, async (req, res) => {
    // console.log('aya ki nhi');
    try {
        const { _id } = req.body;
        // console.log(_id);
        if (req.token === "null") {
            return res.json({ success: false, serverMsg: 'You are not authorized to delete the blog' });
        }
        let activeUserId = null;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, serverMsg: 'You are not authorized to delete the blog' });
            }
            else {
                activeUserId = authData.UserData._id;
            }
        });

        const authorId = await getAuthorIdbyBlogId(_id);
        // console.log(activeUserId, authorId);
        if (authorId !== activeUserId) {
            return res.json({ success: false, serverMsg: 'You dont have access to delete the blog' });
        }

        const deleteResult = await Blogs.deleteOne({ _id });

        if (deleteResult.acknowledged === false) {
            return res.json({ success: false, serverMsg: 'Unable to delete the blog' });
        }

        const deleteRatings = await BlogRate.deleteMany({ blogId: _id, authorId: authorId });
        // console.log('after delete: ', deleteRatings);
        return res.json({ success: true, serverMsg: 'Blog is deleted successfully' });
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, serverMsg: 'Unable to delete the Blog' });
    }
});


blogRoute.get('/updatepost/:postid', appendTokenToReq, async (req, res) => {
    try {
        if (req.token === "null") {
            return res.json({ success: false, serverMsg: 'Unable to update as your token expired' });
        }
        let activeUserId;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, serverMsg: 'Unable to update as your token expired' });
            }
            else {
                activeUserId = authData.UserData._id;
            }
        })
        const postid = req.params.postid;
        const postObj = await Blogs.findOne({ _id: postid });
        if (postObj.AuthorId !== activeUserId) {
            return res.json({ success: false, serverMsg: "You don't have an access to update a blog" });
        }

        let resObj = { success: true };
        resObj._id = postObj._id;
        resObj.Title = postObj.Title;
        resObj.Categories = postObj.Categories;
        resObj.BlogImage = postObj.BlogImage;
        resObj.Content = postObj.Content;
        resObj.AuthorId = postObj.AuthorId;
        return res.json({ success: true, ...resObj });
    }
    catch (err) {
        return res.json({ success: false, serverMsg: 'Unable to fetch blog details' });
    }
});

blogRoute.patch('/updateblog', appendTokenToReq, async (req, res) => {
    try {
        const updatedRes = await Blogs.updateOne({ _id: req.body._id }, { $set: { Title: req.body.Title, Categories: req.body.Categories, BlogImage: req.body.BlogImage, Content: req.body.Content } }, { validateBeforeSave: true });
        console.log(updatedRes);
        return res.json({ success: true, serverMsg: 'Update Successfully' });
    }
    catch (err) {
        console.log('from update blog: ', err);
        return res.json({ success: false, serverMsg: 'Unable to Update' });
    }
});


blogRoute.get('/getblogstats', appendTokenToReq, async (req, res) => {
    try {
        let activeuser = null;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, serverMsg: 'Token epired. Please login again' });
            }
            else {
                activeuser = authData.UserData._id;
            }
        });
        if (!activeuser) {
            return res.json({ success: false, serverMsg: 'Unable to fetch stats' });
        }
        const blogArr = await Blogs.find({ AuthorId: activeuser });
        let rating = 0, views = 0, posts = blogArr.length, readTime = 0;
        for (let blog of blogArr) {
            rating += blog.Rating;
            views += blog.Views;
            readTime += blog.ReadTime;
        }
        rating = (posts === 0 ? 0 : rating / posts);
        return res.json({ success: true, data: { rating, views, posts, readTime } });
    }
    catch (err) {
        return res.json({ success: false, serverMsg: 'Unknown error' });
    }
});

blogRoute.get('/getauthorsblogs/:offset', appendTokenToReq, async (req, res) => {
    try {
        let activeuser = null;
        jwt.verify(req.token, process.env.SECRET_KEY, (err, authData) => {
            if (err) {
                return res.json({ success: false, serverMsg: 'Token epired. Please login again' });
            }
            else {
                activeuser = authData.UserData._id;
            }
        });
        if (!activeuser) {
            return res.json({ success: false, serverMsg: 'Unable to fetch stats' });
        }
        const slotSize = 4;
        const offset = req.params['offset'];
        console.log(offset);
        const blogs = await Blogs.find({ AuthorId: activeuser }).skip(slotSize * offset).limit(slotSize).sort({ createdAt: -1 });
        let blogArr = [];
        for (let obj of blogs) {
            blogArr.push({ _id: obj._id, Title: obj.Title, BlogImage: obj.BlogImage, Rating: obj.Rating, Views: obj.Views, date: obj.createdAt, Content: obj.Content });
        }
        // console.log(blogArr);
        return res.json({ success: true, blogArr, EOF: (blogArr.length < slotSize ? true : false) });
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, serverMsg: 'Unknown error' });
    }
});

blogRoute.patch('/updateReadTime', async (req, res) => {
    try {
        const { postid } = req.body;
        const { acknowledged } = await Blogs.updateOne({ _id: postid }, { $inc: { ReadTime: 1 } });
        return res.json({ readTimeStatus: acknowledged });
    }
    catch (err) {
        return res.json({ readTimeStatus: false });
    }
})

module.exports = blogRoute;