const router = require("express").Router();
const root = require("app-root-path");
const mongo = require(`${root}/services/mongo-crud`);
const getMongoConnection = require(`${root}/services/mongo-connect`);
const objectId = require("mongodb").ObjectID;

const authRoute = require(`${root}/middleware/authenticate`);

postSubscription = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { price, interval, coupon, userId, username, finalPrice, discountedPrice, percentage } = req.body;
    const subscribedAt = new Date().getTime();
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    let validTill;
    if (interval === "monthly") validTill = subscribedAt + 2592000000; // 1 month
    else if (interval === "yearly") validTill = subscribedAt + 31536000000; // 12 month
    let { subscriptions } = await mongo.fetchOne(db, "person", query);
    const subscriptionObj = {
      price: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
      subscribedAt,
      validTill,
      status: "processing",
    };
    subscriptions.recurring = { ...subscriptionObj, interval };
    const isSubscriptionAdded = await mongo.updateOne(db, "person", query, { subscriptions });
    res.status(200).json({ success: isSubscriptionAdded });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

postCourseSubscription = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { price, coupon, course, userId, username, finalPrice, discountedPrice, percentage } = req.body;
    const boughtAt = Date.now();
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    let { subscriptions } = await mongo.fetchOne(db, "person", query);
    const subscriptionObj = {
      payment: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
      status: "processing",
      boughtAt,
    };
    subscriptions[`${course}`] = { ...subscriptionObj };
    const isSubscriptionAdded = await mongo.updateOne(db, "person", query, { subscriptions });
    res.status(200).json({ success: isSubscriptionAdded });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

getDiscount = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { coupon, price, course_name } = req.query;
    const now = new Date().getTime();
    if (!coupon) return { finalPrice: price, discountedPrice: 0, percentage: 0 };
    const couponDetails = await mongo.fetchOne(db, "coupons", { coupon, course: course_name });
    if (!couponDetails) throw new Error("invalid coupon code!");
    else if (couponDetails.validTill < now) throw new Error("Coupon code expired!");
    const discountedPrice = (couponDetails.percentage / 100) * price;
    const finalPrice = price - discountedPrice;
    res
      .status(200)
      .json({ success: true, discount: { finalPrice, discountedPrice, percentage: couponDetails.percentage } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

payment = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const {
      userId,
      username,
      fullName,
      email,
      course,
      courseTitle,
      price,
      finalPrice,
      discountedPrice,
      percentage,
      coupon,
    } = req.body;
    const validTill = new Date().getTime() + 600000; // 10 minutes
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    const paymentObj = {
      username,
      userId,
      price: { regularPrice: price, discount: { amount: discountedPrice, percentage, coupon }, finalPrice },
      status: "processing",
      validTill,
      course,
      courseTitle,
      fullName,
      email,
    };
    const payment = await mongo.insertOne(db, "payment", paymentObj);
    res.status(200).json({ success: !!payment, sessionId: payment._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

getPaymentStatus = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { paymentId } = req.params;
    const payment = await mongo.fetchOne(db, "payment", { _id: objectId(paymentId) });
    res.status(200).json({ success: !!payment, payment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

hasPaid = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { username, id, course, isRecurring, success } = req.body;
    const person = await mongo.fetchOne(db, "person", { username });
    const payment = await mongo.fetchOne(db, "payment", { _id: objectId(id) });
    if (success) {
      if (is_recurring) {
        person.subscriptions.recurring.status = "active";
        payment.status = "success";
      } else {
        person.subscriptions[`${course}`].status = "active";
        payment.status = "success";
      }
    } else {
      if (is_recurring) {
        person.subscriptions.recurring.status = "error";
        payment.status = "error";
      } else {
        person.subscriptions[`${course}`].status = "error";
        payment.status = "error";
      }
    }
    await mongo.updateOne(db, "payment", { _id: objectId(id) }, payment);
    const hasPaid = await mongo.updateOne(db, "person", { username }, person);
    res.status(200).json({ success: hasPaid });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

router.post("/subscription", authRoute, postSubscription);
router.get("/discount", getDiscount);
router.post("/course-subscription", authRoute, postCourseSubscription);
router.post("/payment", authRoute, payment);
router.get("/payment/:paymentId", getPaymentStatus);
router.put("/has-paid", hasPaid);
module.exports = router;
