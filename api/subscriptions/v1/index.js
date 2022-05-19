const router = require("express").Router();
const root = require("app-root-path");
const mongo = require(`${root}/services/mongo-crud`);
const getMongoConnection = require(`${root}/services/mongo-connect`)

const authRoute = require(`${root}/middleware/authenticate`);

const addSubscription = async ({
  subscriptions,
  isRecurring,
  interval,
  course,
  finalPrice,
  discountedPrice,
  percentage,
  price,
  coupon,
  validFrom,
}) => {
  let validTill;
  if (interval === "monthly") validTill = validFrom + 2592000000; // 1 month
  else if (interval === "yearly") validTill = validFrom + 31536000000; // 12 month
  else validTill = validFrom + 31536000000; // 12 month
  let subscriptionObj = {
    price: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } },
    validFrom,
    validTill,
    status: "pending",
  };
  if (isRecurring) {
    return (subscriptions.recurring = { ...subscriptionObj, interval });
  } else {
    return (subscriptions.courses[`${course}`] = { ...subscriptionObj });
  }
};

const getDiscount = async (db, coupon, price, validFrom) => {
  if (!coupon) return { finalPrice: price, discountedPrice: 0, percentage: 0 };
  const couponDetails = await mongo.fetchOne(db, "coupons", { coupon });
  if (!couponDetails) throw new Error("invalid coupon code!");
  else if (couponDetails.validTill < validFrom) throw new Error("Coupon code expired!");
  const discountedPrice = (couponDetails.percentage / 100) * price;
  const finalPrice = price - discountedPrice;
  return { finalPrice, discountedPrice, percentage: couponDetails.percentage };
};

postSubscription = async (req, res, next) => {
  const { client, db } = await getMongoConnection();
  try {
    const { isRecurring, price, interval, coupon, course, userId, username } = req.body;
    const validFrom = new Date().getTime();
    let query = {};
    if (userId) query = { userId };
    if (username) query = { username };
    let { subscriptions } = await mongo.fetchOne(db, "person", query);
    const { error, finalPrice, discountedPrice, percentage } = await getDiscount(db, coupon, price, validFrom);
    if (error) res.status(400).send({ message: error.message });
    subscriptions = await addSubscription({
      subscriptions,
      isRecurring,
      interval,
      course,
      finalPrice,
      discountedPrice,
      percentage,
      price,
      coupon,
      validFrom,
    });
    const isSubscriptionAdded = await mongo.updateOne(db, "person", query, { subscriptions });
    res.status(200).json({ success: isSubscriptionAdded });
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
router.put("/has-paid", authRoute, hasPaid);
module.exports = router;
