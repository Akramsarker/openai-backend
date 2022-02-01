const router = require("express").Router();

apiStatus = (req, res, next) => {
  return res.status(200).send("ok");
};

router.get("/status", apiStatus);

module.exports = router;
