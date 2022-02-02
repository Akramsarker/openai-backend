const router = require("express").Router();
const root = require("app-root-path");
const htmlCss = require(`${root}/courses/videos/html-css.json`)
const javascript = require(`${root}/courses/videos/html-css.json`)
const vue = require(`${root}/courses/videos/html-css.json`)
const git = require(`${root}/courses/videos/html-css.json`)


const authRoute = require(`${root}/middleware/authenticate`)


getCourse = async (req, res, next) => {
    try {
        const name = req.params.name
        console.log(name)
        if (name === "html-css") {
            return res.status(200).json({ success: true, htmlCss });
        }
        else if (name === "javascript") {
            return res.status(200).json({ success: true, javascript });
        }
        else if (name === 'vue') {
            return res.status(200).json({ success: true, vue });
        }
        else if (name === "git") {
            return res.status(200).json({ success: true, git });
        }
        else {
            const status = 'NOT FOUND'
            return res.status(404).json({ success: true, status });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

router.get('/courses/:name', getCourse)

module.exports = router;