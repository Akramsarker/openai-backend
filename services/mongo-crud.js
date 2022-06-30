
module.exports = {
  async documentCount(db, collection, query = {}) {
    const options = {};
    try {
      const count = await db.collection(collection)
        .countDocuments(query, options);
      return count;
    } catch (e) {
      console.error(e);
      return "error";
    }
  },
  async fetchMany(
    db,
    collection,
    query = {},
    keys = {},
    sorting = {},
    limit = 0,
    pageNumber = 0
  ) {
    // Note limit = 0 is the equivalent of setting no limit
    try {
      const list = await db.collection(collection)
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
    }
  },
  async fetchOne(db, collection, query = {}, keys = {}, sorting = {}) {
    try {
      const list = await db.collection(collection)
        .find(query)
        .sort(sorting)
        .limit(1)
        .project(keys)
        .toArray();
      return list.length > 0 ? list[0] : false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async fetchUniqueValues(db, collection, field, query) {
    try {
      const vals = await db.collection(collection)
        .distinct(field, query);
      return vals || [];
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async isDataExist(db, collection, query) {
    try {
      let result = await db.collection(collection)
        .find(query)
        .toArray();

      return !!result[0];
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async insertOne(db, collection, payload) {
    try {
      const response = await db.collection(collection)
        .insertOne(payload);
      return response.ops[0];
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async updateOne(db, collection, query, payload) {
    // this option instructs the method to create a document if no documents match the filter
    const options = { upsert: true };
    const updateDoc = {
      $set: payload,
    };
    try {
      await db.collection(collection)
        .updateOne(query, updateDoc, options);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async updateOneArray(db, collection, query, payload) {
    const options = {};
    try {
      await db.collection(collection)
        .updateOne(query, { $push: payload }, options);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async insertMany(db, collection, payload) {
    try {
      const response = await db.collection(collection)
        .insertMany(payload);
      return response.ops;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async updateData(db, collection, query, newValue) {
    try {
      let result = await db.collection(collection)
        .updateOne(query, newValue);
      return !!result.result.n; // for returning boolean value of if updated or not
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async deleteData(db, collection, query) {
    try {
      let result = await db.collection(collection)
        .findOneAndDelete(query);

      return !!result.lastErrorObject.n; // for returning boolean value of if deleted or not
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  async documentExists(db, collection, query) {
    try {
      let result =
        (await db.collection(collection)
          .find(query)
          .count()) > 0;
      return result;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};
