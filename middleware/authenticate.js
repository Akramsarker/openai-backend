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
    try {
      const token = req.headers.authorization.split(" ")[1];
      // verify user token
      const decodedUser = await admin.auth().verifyIdToken(token);
      if (!decodedUser.email) {
        throw new Error("No email found in decoded user");
      }
      next();
    } catch (err) {
      return res.status(403).send({ error: "Not Authorized", message: err.message });
    }
  } else {
    return res.status(403).send({ error: "Not Authorized", message: "No auth header found" });
  }
};
module.exports = authRoute;
