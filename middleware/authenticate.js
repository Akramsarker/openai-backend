var admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
  }),
});

const authRoute = async (req, res, next) => {
  if (req.headers?.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    // verify user token
    const decodedUser = await admin.auth().verifyIdToken(token);
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
};

module.exports = authRoute;
