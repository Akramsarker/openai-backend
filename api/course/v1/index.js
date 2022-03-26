const router = require("express").Router();
const root = require("app-root-path");
const e = require("express");
const { valid } = require("joi");
const htmlCss = require(`${root}/courses/videos/html-css.json`)
const javascript = require(`${root}/courses/videos/html-css.json`)
const vue = require(`${root}/courses/videos/html-css.json`)
const git = require(`${root}/courses/videos/html-css.json`)
const mongo = require(`${root}/services/mongo-crud`)


const authRoute = require(`${root}/middleware/authenticate`)

const filterVideos = (object, hasPaid) => {
    const newObj = JSON.parse(JSON.stringify(object))
    return Object.values(newObj).map(element => {
        return element.videos.map(el => {
            if (!el.isFree && !hasPaid) delete el.videoId;
            return el;
        })
    });
}
const checkHasPaid = async (username, courseName) => {
    const person = await mongo.fetchOne('person', { username })
    const { recurring, courses } = person.subscriptions;
    if (recurring?.status === 'active') return true;
    if (courses[courseName].status === 'active') return true;
}

getCourse = async (req, res, next) => {
    try {
        let filteredVideo = null
        let hasPaid = false;
        const { courseName, username } = req.query;
        if (courseName === "html") {
            hasPaid = await checkHasPaid(username, 'html')
            console.log(hasPaid)
            filteredVideo = filterVideos(htmlCss, hasPaid)
        }
        else if (courseName === "css") {
            hasPaid = checkHasPaid(username, 'html')
            filteredVideo = filterVideos(htmlCss, hasPaid)
        }
        else if (courseName === "javascript") {
            filteredVideo = filterVideos(javascript, hasPaid)
        }
        else if (courseName === 'vue') {
            filteredVideo = filterVideos(vue, hasPaid)
        }
        else if (courseName === "git") {
            filteredVideo = filterVideos(git, hasPaid)
        }
        else {
            const status = 'NOT FOUND'
            return res.status(404).json({ success: true, status });
        }
        return res.status(200).json({ success: true, videos: filteredVideo });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

router.get('/courses', getCourse)

module.exports = router;