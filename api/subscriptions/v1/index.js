const router = require("express").Router();
const root = require("app-root-path");
const mongo = require(`${root}/services/mongo-crud`)

const authRoute = require(`${root}/middleware/authenticate`)

const addSubscription = async ({ subscriptions, isRecurring, interval, course, finalPrice, discountedPrice, percentage, price, coupon, validFrom }) => {
    let validTill;
    if (interval === "monthly") validTill = validFrom + 2592000000 // 1 month
    else if (interval === 'yearly') validTill = validFrom + 31536000000 // 12 month
    else validTill = validFrom + 31536000000 // 12 month
    let subscriptionObj = { price: { price, finalPrice, discount: { amount: discountedPrice, percentage, coupon } }, validFrom, validTill, status: "pending" }
    if (isRecurring) {
        return subscriptions.recurring = { ...subscriptionObj, interval }
    } else {
        return subscriptions.courses[`${course}`] = { ...subscriptionObj }
    }
}

const getDiscount = async (coupon, price, validFrom) => {
    const couponDetails = await mongo.fetchOne('coupons', { coupon })
    if (!couponDetails) throw new Error('invalid coupon code!')
    else if (couponDetails.validTill < validFrom) throw new Error('Coupon code expired!')
    const discountedPrice = (couponDetails.percentage / 100) * price;
    const finalPrice = price - discountedPrice;
    return { finalPrice, discountedPrice, percentage: couponDetails.percentage }
}

postSubscription = async (req, res, next) => {
    try {
        const { isRecurring, price, interval, coupon, course, userId, username } = req.body;
        const validFrom = new Date().getTime()
        let query = {}
        if (userId) query = { userId }
        if (username) query = { username }
        let { subscriptions } = await mongo.fetchOne("person", query);
        const { error, finalPrice, discountedPrice, percentage } = await getDiscount(coupon, price, validFrom)
        if (error) res.status(400).send({ message: error.message })
        subscriptions = await addSubscription({ subscriptions, isRecurring, interval, course, finalPrice, discountedPrice, percentage, price, coupon, validFrom })
        const isSubscriptionAdded = await mongo.updateOne('person', query, { subscriptions })
        return res.status(200).json({ success: isSubscriptionAdded });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

router.put('/subscription', postSubscription)
module.exports = router;