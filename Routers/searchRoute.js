const express = require('express');
const searchRoute = express.Router();
const Blogs = require('../DB/Models/blogs');
const UserCollection = require('../DB/Models/user');

async function getAuthorNamebyId(authorId) {
    try {
        const obj = await UserCollection.findOne({ _id: authorId });
        return obj.name;
    }
    catch (err) {
        return null;
    }
}

async function isTextExist(text, obj, author) {
    console.log(text, obj.Title);
    try {
        if (obj.Title.toLowerCase().includes(text.toLowerCase())) {
            // console.log(obj.Title, text);
            return true;
        }
        for (let val of obj.Categories) {
            if (val.cat_active === false) {
                continue;
            }
            if (val.cat_name.toLowerCase().includes(text.toLowerCase())) {
                // console.log(val, text);
                return true;
            }
        }
        if (obj.Rating == text || obj.ReadTime == text) {
            // console.log(obj.Rating, obj.ReadTime, text);
            return true;
        }
        if (author.toLowerCase().includes(text.toLowerCase())) {
            // console.log(author, text);
            return true;
        }
        return false;
    }
    catch (err) {
        console.log('isTextExist error: ', err);
        return false;
    }
}

searchRoute.get('/search/:text', async (req, res) => {
    try {
        const text = req.params['text'];
        const blogArr = await Blogs.find();
        const resultArr = [];

        for (let obj of blogArr) {
            const author = await getAuthorNamebyId(obj.AuthorId);
            const status = await isTextExist(text, obj, author);
            if (status) {
                resultArr.push({ _id: obj._id, Title: obj.Title, BlogImage: obj.BlogImage, Rating: obj.Rating, Views: obj.Views, date: obj.createdAt, Content: obj.Content });
            }
        }
        return res.json({ success: true, data: resultArr });
    }
    catch (err) {
        // console.log(err);
        return res.json({ success: false });
    }
});


function generateShingles(doc) {
    let arr = doc.split(' ');
    let shingleSets = new Set();
    for (let obj of arr) {
        shingleSets.add(obj);
    }
    return shingleSets;
}

function getJacardSimilarity(shingleofBlog, shingleofOrgBlog) {
    let intersection = 0, union = 0;
    for (const shingle of shingleofBlog) {
        if (shingleofOrgBlog.has(shingle)) {
            intersection++;
        }
    }
    for (const shingle of shingleofOrgBlog) {
        shingleofBlog.add(shingle);
    }
    union = shingleofBlog.size;

    const score = (intersection / union * 20);
    return score; 
}

function getSimilarityScore(orgBlog, Blog) {
    let score = 0;
    if (orgBlog.AuthorId === Blog.AuthorId) {
        score += (score * 10);
    }
    score += (Blog.Rating * 3);
    let noOfCat = orgBlog.Categories.length;
    let catscore = 0;
    for (let i = 0; i < noOfCat; i++) {
        if (orgBlog.Categories[i].cat_active && Blog.Categories[i].cat_active) {
            catscore += 1;
        }
    }
    score += (catscore / noOfCat * 15);

    let shingleofOrgBlog = generateShingles(orgBlog.Title);
    let shingleofBlog = generateShingles(Blog.Title);
    let jacardSimilarity = getJacardSimilarity(shingleofBlog, shingleofOrgBlog);
    score += (jacardSimilarity * 20);

    score += (Blog.Views * 0.2);

    return score;
}

searchRoute.get('/recommend/:postid', async (req, res) => {
    try {
        const orgpostid = req.params['postid'];
        const orgBlog = await Blogs.findOne({ _id: orgpostid });
        const BlogsArr = await Blogs.find({ _id: { $ne: orgpostid } });
        const TransformedArr = BlogsArr.map((obj) => {
            let similarScore = getSimilarityScore(orgBlog, obj);
            return {similarScore, _id: obj._id, Title: obj.Title, BlogImage: obj.BlogImage, Rating: obj.Rating, Views: obj.Views, createdAt: obj.createdAt} 
        });

        TransformedArr.sort((a, b) => {
            return (b.similarScore - a.similarScore);
        });
        return res.json({ success: true, data: TransformedArr.slice(0, 8) });
    }
    catch (err) {
        // console.log(err);
        return res.json({ success: false });
    }
});

module.exports = searchRoute;