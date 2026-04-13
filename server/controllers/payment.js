const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/order');
const User = require('../models/user');
const Resource = require('../models/resource');
const MockTest = require('../models/mockTest');

// ── Cashfree REST API (2025-01-01 - Latest) ───────────────────────────────────────────────
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = (process.env.CASHFREE_ENV || '').toLowerCase() === 'production' ? 'production' : 'sandbox';

const CASHFREE_BASE_URL = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2025-01-01';

const normalizeUrl = (value, fallback) => {
  const url = (value || fallback || '').trim().replace(/\/$/, '');
  return url || fallback;
};

// Detect environment for proper URL handling
const isDevelopment = process.env.NODE_ENV === 'development' || CASHFREE_ENV === 'sandbox';

// For localhost development, use ngrok or production domain for Cashfree whitelisting
const FRONTEND_URL = isDevelopment
  ? 'https://sarkariafsar.com'  // Use production domain for Cashfree (whitelisted)
  : normalizeUrl(process.env.FRONTEND_URL, 'https://sarkariafsar.com');

const SERVER_URL = normalizeUrl(process.env.SERVER_URL, 'https://sarkariafsar.com');

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

const syncOrderWithCashfree = async (order) => {
  if (!order) return { status: 'not_found', order: null };

  if (order.status === 'paid') {
    return { status: 'paid', order };
  }

  try {
    const cfResp = await axios.get(`${CASHFREE_BASE_URL}/orders/${order.cfOrderId}`, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    const cfStatus = cfResp.data?.order_status;

    if (cfStatus === 'PAID') {
      order.status = 'paid';
      order.cfPaymentId = cfResp.data?.order_id || null;
      order.paidAt = order.paidAt || new Date();
      await order.save();
      await grantAccess(order);

      return { status: 'paid', order };
    }

    const statusMap = { ACTIVE: 'pending', EXPIRED: 'expired', TERMINATED: 'failed' };
    return {
      status: statusMap[cfStatus] || cfStatus?.toLowerCase() || 'pending',
      order,
    };
  } catch (err) {
    console.error('syncOrderWithCashfree:', err?.response?.data || err.message);
    return { status: 'error', order };
  }
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
      order_id: cfOrderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(user._id),
        customer_email: user.email,
        customer_name: user.name || 'User',
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${FRONTEND_URL}/payment/status?order_id=${cfOrderId}`,
        notify_url: `${SERVER_URL}/api/payment/webhook`,
      },
      order_note: `${itemType} — ${item.title}`,
    };

    console.log('DEBUG FRONTEND_URL:', FRONTEND_URL);
    console.log('DEBUG return_url:', `${FRONTEND_URL}/payment/status?order_id=${cfOrderId}`);

    const cfResp = await axios.post(`${CASHFREE_BASE_URL}/orders`, cfRequest, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
      },
    });

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

// ── POST /payment/get-payment-link (Get payment redirect URL) ───────────────────
exports.getPaymentLink = async (req, res) => {
  try {
    const { paymentSessionId } = req.body;

    if (!paymentSessionId) {
      return res.status(400).json({ success: false, message: 'paymentSessionId is required' });
    }

    const cfResp = await axios.post(`${CASHFREE_BASE_URL}/orders/sessions`, {
      payment_session_id: paymentSessionId,
    }, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
      },
    });

    const paymentData = cfResp.data;
    const redirectUrl = paymentData?.data?.url;

    if (!redirectUrl) {
      return res.status(500).json({ success: false, message: 'Failed to get payment redirect URL' });
    }

    return res.status(200).json({
      success: true,
      data: {
        redirectUrl,
        paymentMethod: paymentData?.payment_method,
        cfPaymentId: paymentData?.cf_payment_id,
      },
    });
  } catch (err) {
    console.error('getPaymentLink:', err?.response?.data || err.message);
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
      isValid = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
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

    const result = await syncOrderWithCashfree(order);
    return res.status(200).json({ success: true, status: result.status, data: result.order });
  } catch (err) {
    console.error('verifyOrder:', err?.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err?.response?.data?.message || err.message,
    });
  }
};

// ── GET /payment/status/:cfOrderId (public status check for return page) ──────
exports.getOrderStatus = async (req, res) => {
  try {
    const { cfOrderId } = req.params;
    const order = await Order.findOne({ cfOrderId }).lean(false);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const result = await syncOrderWithCashfree(order);
    return res.status(200).json({
      success: true,
      status: result.status,
      data: {
        orderId: result.order?._id,
        cfOrderId: result.order?.cfOrderId,
        itemType: result.order?.itemType,
        itemId: result.order?.itemId,
        itemTitle: result.order?.itemTitle,
        amount: result.order?.amount,
      },
    });
  } catch (err) {
    console.error('getOrderStatus:', err?.response?.data || err.message);
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
