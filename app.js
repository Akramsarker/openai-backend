const express = require("express");
const cors = require("cors");
if (process.env.NODE_ENV === "development") {
  const dotenv = require("dotenv");
  dotenv.config();
}

const app = express();
global.app = app;

app.set("superSecret", "djkzandjkawsuodxsmsakjuhkj");

app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(origin);
      if (!allowedOrigins.includes(origin)) {
        const msg = `The CORS policy for ${origin} does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);


app.use("/api", require("./api/status"));
app.use("/api", require("./api/person"));
app.use("/api", require("./api/course"));
app.use("/api", require("./api/subscriptions"));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Server started at port : ", port);
});
