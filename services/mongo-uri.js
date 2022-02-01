const ssl_setting = process.env.NODE_ENV === "development" ? false : true;
const args = `?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&ssl=${ssl_setting}`;
module.exports = {
  generateMongoDbUri(user, password) {
    if (process.env.CLOUD_ENV === "local") {
      return `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}${args}`;
    }
    return process.env.MONGO_DB_URI;
  },
};
