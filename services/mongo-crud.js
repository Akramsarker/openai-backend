const { MongoClient } = require("mongodb");
const { generateMongoDbUri } = require("./mongo-uri");

const mongoDbUri = generateMongoDbUri();
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = {
  async documentCount(collection, query = {}) {
    const options = {};
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const count = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .countDocuments(query, options);
      return count;
    } catch (e) {
      console.error(e);
      return "error";
    } finally {
      await client.close();
    }
  },
  async fetchMany(
    collection,
    query = {},
    keys = {},
    sorting = {},
    limit = 0,
    pageNumber = 0
  ) {
    // Note limit = 0 is the equivalent of setting no limit

    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const list = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .find(query)
        .skip(pageNumber > 0 ? (pageNumber - 1) * limit : 0)
        .limit(limit)
        .sort(sorting)
        .project(keys)
        .toArray();
      return list;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async fetchOne(collection, query = {}, keys = {}, sorting = {}) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const list = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .find(query)
        .sort(sorting)
        .limit(1)
        .project(keys)
        .toArray();
      return list.length > 0 ? list[0] : false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async fetchUniqueValues(collection, field, query) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const vals = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .distinct(field, query);
      return vals || [];
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async isDataExist(collection, query) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      let result = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .find(query)
        .toArray();

      return !!result[0];
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async insertOne(collection, payload) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const response = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .insertOne(payload);
      return response.ops[0];
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async updateOne(collection, query, payload) {
    // this option instructs the method to create a document if no documents match the filter
    const options = { upsert: true };
    const updateDoc = {
      $set: payload,
    };
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .updateOne(query, updateDoc, options);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async updateOneArray(collection, query, payload) {
    const options = {};
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .updateOne(query, { $push: payload }, options);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async insertMany(collection, payload) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      const response = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .insertMany(payload);
      return response.ops;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async updateData(collection, query, newValue) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      let result = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .updateOne(query, newValue);
      return !!result.result.n; // for returning boolean value of if updated or not
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async deleteData(collection, query) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      let result = await client
        .db(process.env.MONGO_DB)
        .collection(collection)
        .findOneAndDelete(query);

      return !!result.lastErrorObject.n; // for returning boolean value of if deleted or not
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
  async documentExists(collection, query) {
    const client = new MongoClient(mongoDbUri, mongoOptions);
    try {
      await client.connect();
      let result =
        (await client
          .db(process.env.MONGO_DB)
          .collection(collection)
          .find(query)
          .count()) > 0;
      return result;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      await client.close();
    }
  },
};
