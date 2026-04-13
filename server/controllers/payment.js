const mongoose = require('mongoose');
const { Cashfree } = require('cashfree-pg');
const Order = require('../models/order');
const User = require('../models/user');
const Resource = require('../models/resource');
const MockTest = require('../models/mockTest');

// ── Cashfree init ─────────────────────────────────────────────────────────────
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment =
  process.env.CASHFREE_ENV === 'production'
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

const CF_API_VERSION = '2023-08-01';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sarkariafsar.com';
const SERVER_URL   = process.env.SERVER_URL   || 'https://sarkariafsar.com';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const hasPurchased = (user, itemType, itemId) =>
  (user.purchases || []).some(
    (p) => p.itemType === itemType && String(p.itemId) === String(itemId)
  );

const grantAccess = async (order) => {
  await User.findByIdAndUpdate(order.userId, {
    $addToSet: {
      purchases: {
        itemId:      order.itemId,
        itemType:    order.itemType,
        orderId:     order._id,
        purchasedAt: new Date(),
      },
    },
  });
};

// ── POST /payment/create-order ────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'itemType and itemId are required' });
    }
    if (!['resource', 'mock_test'].includes(itemType)) {
      return res.status(400).json({ success: false, message: "itemType must be 'resource' or 'mock_test'" });
    }
    if (!isValidObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid itemId' });
    }

    const Model = itemType === 'resource' ? Resource : MockTest;
    const item = await Model.findById(itemId).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.isFree) {
      return res.status(400).json({ success: false, message: 'This item is free — no payment needed' });
    }

    if (hasPurchased(user, itemType, itemId)) {
      return res.status(409).json({ success: false, message: 'Already purchased', alreadyPurchased: true });
    }

    const amount = item.discountedPrice ?? item.price;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid price configured for this item' });
    }

    const cfOrderId = `SA_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const cfRequest = {
      order_id:       cfOrderId,
      order_amount:   amount,
      order_currency: 'INR',
      customer_details: {
        customer_id:    String(user._id),
        customer_email: user.email,
        customer_name:  user.name || 'User',
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${FRONTEND_URL}/payment/status?order_id=${cfOrderId}`,
        notify_url: `${SERVER_URL}/api/payment/webhook`,
      },
      order_note: `${itemType} — ${item.title}`,
    };

    const cfResp = await Cashfree.PGCreateOrder(CF_API_VERSION, cfRequest);
    const { payment_session_id } = cfResp.data;

    const order = await Order.create({
      userId:           user._id,
      userEmail:        user.email,
      userName:         user.name,
      itemType,
      itemId,
      itemTitle:        item.title,
      amount,
      cfOrderId,
      paymentSessionId: payment_session_id,
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId:          order._id,
        cfOrderId,
        paymentSessionId: payment_session_id,
        amount,
        itemTitle:        item.title,
      },
    });
  } catch (err) {
    console.error('createOrder:', err?.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err?.response?.data?.message || err.message,
    });
  }
};

// ── POST /payment/webhook (Cashfree signature-verified) ───────────────────────
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp  = req.headers['x-webhook-timestamp'];
    const rawBody    = req.rawBody; // captured by express.json verify option

    if (!signature || !timestamp || !rawBody) {
      return res.status(400).json({ success: false, message: 'Missing webhook headers or body' });
    }

    let isValid = false;
    try {
      isValid = Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch {
      isValid = false;
    }
    if (!isValid) {
      console.warn('Cashfree webhook: invalid signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    if (type !== 'PAYMENT_SUCCESS') {
      return res.status(200).json({ success: true, message: `Event '${type}' ignored` });
    }

    const cfOrderId  = data?.order?.order_id;
    const cfPaymentId = data?.payment?.cf_payment_id;
    if (!cfOrderId) return res.status(400).json({ success: false, message: 'Missing order_id' });

    const order = await Order.findOne({ cfOrderId });
    if (!order) {
      console.warn(`Webhook: no order found for cfOrderId ${cfOrderId}`);
      return res.status(200).json({ success: true, message: 'Order not found, ignoring' });
    }

    if (order.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    order.status        = 'paid';
    order.cfPaymentId   = cfPaymentId ? String(cfPaymentId) : null;
    order.webhookPayload = payload;
    order.paidAt        = new Date();
    await order.save();

    await grantAccess(order);
    console.log(`Payment success: user ${order.userId} → ${order.itemType} ${order.itemId}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('webhook:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /payment/verify/:cfOrderId (frontend calls after redirect) ────────────
exports.verifyOrder = async (req, res) => {
  try {
    const user = req.user;
    const { cfOrderId } = req.params;

    const order = await Order.findOne({ cfOrderId, userId: user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'paid') {
      return res.status(200).json({ success: true, status: 'paid', data: order });
    }

    const cfResp = await Cashfree.PGFetchOrder(CF_API_VERSION, cfOrderId);
    const cfStatus = cfResp.data?.order_status;

    if (cfStatus === 'PAID') {
      const paymentsResp = await Cashfree.PGOrderFetchPayments(CF_API_VERSION, cfOrderId);
      const successPayment = (paymentsResp.data || []).find((p) => p.payment_status === 'SUCCESS');

      order.status      = 'paid';
      order.cfPaymentId = successPayment?.cf_payment_id ? String(successPayment.cf_payment_id) : null;
      order.paidAt      = new Date();
      await order.save();
      await grantAccess(order);

      return res.status(200).json({ success: true, status: 'paid', data: order });
    }

    const statusMap = { ACTIVE: 'pending', EXPIRED: 'expired', TERMINATED: 'failed' };
    return res.status(200).json({
      success: true,
      status: statusMap[cfStatus] || cfStatus?.toLowerCase() || 'pending',
      data: order,
    });
  } catch (err) {
    console.error('verifyOrder:', err?.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err?.response?.data?.message || err.message,
    });
  }
};

// ── GET /payment/my-orders ────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /payment/check-access?itemType=resource&itemId=xxx ───────────────────
exports.checkAccess = async (req, res) => {
  try {
    const user = req.user;
    const { itemType, itemId } = req.query;

    if (!itemType || !itemId || !isValidObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'itemType and valid itemId required' });
    }

    const Model = itemType === 'resource' ? Resource : MockTest;
    const item = await Model.findById(itemId).select('isFree title price discountedPrice').lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.isFree) {
      return res.status(200).json({ success: true, hasAccess: true, reason: 'free' });
    }

    const purchased = hasPurchased(user, itemType, itemId);
    return res.status(200).json({
      success: true,
      hasAccess: purchased,
      reason: purchased ? 'purchased' : 'not_purchased',
      price: item.discountedPrice ?? item.price,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
