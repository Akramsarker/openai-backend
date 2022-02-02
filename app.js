const express = require("express");
const cors = require("cors");
if (process.env.NODE_ENV === 'development') {
  const dotenv = require("dotenv");
  dotenv.config();
}

const app = express();
global.app = app;

app.set("superSecret", "djkzandjkawsuodxsmsakjuhkj");

app.use(express.json());
app.use(cors());

// require("./middleware")(app);

app.use("/api", require("./api/status"));
app.use("/api", require("./api/person"));
app.use("/api", require("./api/course"));
// app.use("/api", require("./api/following"));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Server started at port : ", port);
});
