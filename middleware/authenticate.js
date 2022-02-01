const jwt = require("jsonwebtoken");
const root = require("app-root-path");
var admin = require("firebase-admin");


admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID, // I get no error here
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // I get no error here
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // NOW THIS WORKS!!!
  })
})


const authRoute = async (req, res, next) => {
  if (req.headers?.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    // verify user token
    const decodedUser = await admin.auth().verifyIdToken(token)
    console.log(decodedUser)
    if (!decodedUser.email) {
      return res.status(403).json({ error: "Not authorized " });
    }
    try {
      req.fb_user_id = decodedUser.uid;
      req.auth_user_id = req.session.current_user_id;
      req.auth_org_id = req.session.current_org_id;
      req.auth_role = req.session.current_user_role;
      req.auth_session_id = req.session.current_session_id;
      next();
    } catch (err) {
      console.log(err);
      return res.status(403).send("Unauthorized");
    }
  } else {
    return res.status(403).send("Unauthorized");
  }
}


module.exports = authRoute;
