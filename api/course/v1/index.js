const router = require("express").Router();
const root = require("app-root-path");
const authRoute = require(`${root}/middleware/authenticate`);
const html = require(`${root}/courses/videos/html.json`);
const mongo = require(`${root}/services/mongo-crud`);
const getMongoConnection = require(`${root}/services/mongo-connect`);

const filterVideos = (object, hasPaid) => {
  const newObj = JSON.parse(JSON.stringify(object));
  Object.values(newObj).map((element) => {
    element.videos.map((el) => {
      if (!el.isFree && !hasPaid) delete el.videoId;
      return el;
    });
    return element;
  });
  return newObj;
};
const checkHasPaid = async (db, username, course_name) => {
  if (!username) return false;
  const validity = new Date().getTime();
  const person = await mongo.fetchOne(db, "person", { username });
  if (!person) return false;
  const { recurring, courses } = person.subscriptions;
  if (recurring?.status === "active" && recurring?.validTill > validity) return true;
  if (courses[course_name].status === "active") return true;
};

getCourse = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    let filteredVideo = null;
    const { course_name, username } = req.query;
    const hasPaid = await checkHasPaid(db, username, course_name);
    if (course_name === "html") {
      filteredVideo = filterVideos(html, hasPaid);
      // } else if (course_name === "css") {
      //   filteredVideo = filterVideos(css, hasPaid);
      // } else if (course_name === "javascript") {
      //   filteredVideo = filterVideos(javascript, hasPaid);
      // } else if (course_name === "vue") {
      //   filteredVideo = filterVideos(vue, hasPaid);
      // } else if (course_name === "git") {
      //   filteredVideo = filterVideos(git, hasPaid);
    } else {
      const status = "NOT FOUND";
      res.status(404).json({ success: false, status });
    }
    res.status(200).json({ success: !!hasPaid, videos: filteredVideo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

router.get("/courses", getCourse);

module.exports = router;
