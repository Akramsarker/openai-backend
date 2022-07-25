const router = require("express").Router();
const root = require("app-root-path");
const mongo = require(`${root}/services/mongo-crud`);
const getMongoConnection = require(`${root}/services/mongo-connect`)

const authRoute = require(`${root}/middleware/authenticate`);


postSubscription = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { price, interval, coupon, userId, username, finalPrice, discountedPrice, percentage } = req.body;
    const validFrom = new Date().getTime();
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    let validTill;
    if (interval === "monthly") validTill = validFrom + 2592000000; // 1 month
    else if (interval === "yearly") validTill = validFrom + 31536000000; // 12 month
    let { subscriptions } = await mongo.fetchOne(db, "person", query);
    const subscriptionObj = {
      price: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
      validFrom,
      validTill,
      status: "pending",
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
    const validFrom = new Date().getTime();
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    const validTill = validFrom + 31536000000; // 12 month
    let { subscriptions } = await mongo.fetchOne(db, "person", query);
    const subscriptionObj = {
      price: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
      validFrom,
      validTill,
      status: "pending",
    };
    subscriptions.courses[`${course}`] = { ...subscriptionObj };
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
    const { coupon, price } = req.body;
    const now = new Date().getTime();
    if (!coupon) return { finalPrice: price, discountedPrice: 0, percentage: 0 };
    const couponDetails = await mongo.fetchOne(db, "coupons", { coupon });
    console.log(couponDetails);
    if (!couponDetails) throw new Error("invalid coupon code!");
    else if (couponDetails.validTill < now) throw new Error("Coupon code expired!");
    const discountedPrice = (couponDetails.percentage / 100) * price;
    const finalPrice = price - discountedPrice;
    res.status(200).json({ success: true, discount: { finalPrice, discountedPrice, percentage: couponDetails.percentage } });
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
    const { username, course_name, is_recurring, payment_success } = req.query;
    const person = await mongo.fetchOne(db, "person", { username });
    if (payment_success) {
      if (is_recurring) {
        person.subscriptions.recurring.status = "active";
      } else {
        person.subscriptions.courses[`${course_name}`].status = "active";
      }
    } else {
      if (is_recurring) {
        person.subscriptions.recurring.status = "failed";
      } else {
        person.subscriptions.courses[`${course_name}`].status = "failed";
      }
    }
    const hasPaid = await mongo.updateOne(db, "person", { username }, person);
    res.status(200).json({ success: hasPaid });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await client.close();
  }

}


router.post("/subscription", authRoute, postSubscription);
router.post('/discount', authRoute, getDiscount);
router.post('/course-subscription', authRoute, postCourseSubscription);
router.put("/has-paid", authRoute, hasPaid);
module.exports = router;
