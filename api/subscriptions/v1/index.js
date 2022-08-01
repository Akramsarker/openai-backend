const router = require("express").Router();
const root = require("app-root-path");
const mongo = require(`${root}/services/mongo-crud`);
const getMongoConnection = require(`${root}/services/mongo-connect`);
const objectId = require("mongodb").ObjectID;

const authRoute = require(`${root}/middleware/authenticate`);


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

createPayment = async (req, res, next) => {
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
      isRecurring,
    } = req.body;
    let query = {};
    if (userId) query = { userId };
    else if (username) query = { username };
    const { subscriptions } = await mongo.fetchOne(db, "person", query);

    const paymentObj = createPaymentObj({
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
      isRecurring,
    });
    const subscriptionObj = createSubscriptionObj({
      price,
      coupon,
      course,
      finalPrice,
      discountedPrice,
      percentage,
      subscriptions,
      isRecurring,
    });
    const payment = await mongo.insertOne(db, "payment", paymentObj);
    await mongo.updateOne(db, "person", query, { subscriptions: subscriptionObj });
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

    const { updatedPerson, updatedPayment } = updateStatus({ isRecurring, success, person, course, payment });

    await mongo.updateOne(db, "payment", { _id: objectId(id) }, updatedPayment);
    const hasPaid = await mongo.updateOne(db, "person", { username }, updatedPerson);

    res.status(200).json({ success: hasPaid });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }
};

const updateStatus = ({ isRecurring, success, person, course, payment }) => {
  const paymentStatus = success ? "success" : "error";
  const subscriptionStatus = success ? "active" : "error";
  payment.status = paymentStatus;

  if (isRecurring) {
    person.subscriptions.recurring.status = subscriptionStatus;
  } else {
    person.subscriptions[`${course}`].status = subscriptionStatus;
  }
  return { updatedPerson: person, updatedPayment: payment };
};

const createPaymentObj = ({
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
  isRecurring,
}) => {
  const validTill = new Date().getTime() + 600000; // 10 minutes
  return {
    username,
    userId,
    price: { regularPrice: price, discount: { amount: discountedPrice, percentage, coupon }, finalPrice },
    status: "processing",
    validTill,
    course,
    courseTitle,
    fullName,
    email,
    isRecurring,
  };
};

const createSubscriptionObj = ({
  price,
  coupon,
  course,
  finalPrice,
  discountedPrice,
  percentage,
  isRecurring = false,
  subscriptions,
}) => {
  const boughtAt = Date.now();

  if (isRecurring) {
    let validTill = 0;
    if (interval === "monthly") {
      validTill = boughtAt + 2592000000; // 30 days
    } else if (interval === "yearly") {
      validTill = boughtAt + 31536000000; // 365 days
    }
    const recurring = {
      price: {
        price,
        finalPrice,
        discount: {
          amount: discountedPrice,
          percentage,
          coupon,
        },
      },
      validFrom: boughtAt,
      validTill,
      status: "pending",
      interval,
    };
    subscriptions.recurring = recurring;
  } else {
    const subscriptionObj = {
      payment: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
      status: "processing",
      boughtAt,
    };
    subscriptions[`${course}`] = { ...subscriptionObj };
  }

  return subscriptions;
};

router.get("/discount", getDiscount);
router.post("/payment", authRoute, createPayment);
router.get("/payment/:paymentId", getPaymentStatus);
router.put("/has-paid", hasPaid);
module.exports = router;
