const router = require("express").Router();
const root = require("app-root-path");
const getMongoConnection = require(`${root}/services/mongo-connect`)

const authRoute = require(`${root}/middleware/authenticate`);

const mongo = require(`${root}/services/mongo-crud`);
getPersonData = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const username = req.query.username;
    const email = req.query.email;
    const userId = req.query.user_id;
    const query = {};
    if (username) query.username = username;
    if (email) query.email = email;
    if (userId) query.userId = userId;
    const person = await mongo.fetchOne(db, "person", query);
    res.status(200).json({ success: !!person, person });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};
setPersonData = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const person = await mongo.insertOne(db, "person", req.body);
    res.status(200).json({ success: !!person, person });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close()
  }
};
updatePersonData = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const person = await mongo.updateData(
      db,
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
    res.status(200).json({ success: !!person, person });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};
isUsernameUnique = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { username } = req.query;
    const documentExists = await mongo.documentExists(db, "person", { username });
    res.status(200).json({ success: !!documentExists, isUsernameUnique: !documentExists });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

router.get("/person", authRoute, getPersonData);
router.put("/person/:username", authRoute, updatePersonData);
router.post("/person", authRoute, setPersonData);
router.get("/is-username-unique", authRoute, isUsernameUnique);

module.exports = router;
