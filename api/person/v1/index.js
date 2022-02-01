const router = require("express").Router();
const root = require("app-root-path");

const mongo = require(`${root}/services/mongo-crud`);
getPersonData = async (req, res, next) => {
  try {
    const username = req.query.username;
    const email = req.query.email;
    const userId = req.query.user_id;
    const query = {};
    if (username) query.username = username;
    if (email) query.email = email;
    if (userId) query.userId = userId;

    const person = await mongo.fetchOne("person", query);
    return res.status(200).json({ success: true, person });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

setPersonData = async (req, res, next) => {
  try {
    const person = await mongo.insertOne("person", req.body);
    return res.status(200).json({ success: true, person });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
updatePersonData = async (req, res, next) => {
  try {
    const person = await mongo.updateData(
      "person",
      {
        username: req.params.username,
      },
      {
        $set: {
          ...req.body,
          ...{ updated_at: Date.now() },
        },
      }
    );
    return res.status(200).json({ success: true, person });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
router.get("/person", getPersonData);
router.put("/person/:username", updatePersonData);

router.post("/person", setPersonData);

module.exports = router;
