const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment');
const authUser = require('../middleware/authUser');

// ── Create Cashfree order (user must be logged in) ────────────────────────────
router.post('/create-order', authUser, ctrl.createOrder);

// ── Get payment redirect URL (user must be logged in) ─────────────────────────
router.post('/get-payment-link', authUser, ctrl.getPaymentLink);

// ── Cashfree webhook — NO auth, signature verified inside controller ──────────
router.post('/webhook', ctrl.webhook);

// ── Frontend calls this after payment redirect ────────────────────────────────
router.get('/verify/:cfOrderId', authUser, ctrl.verifyOrder);

// ── Public order status check for return page (no auth required) ────────────────
router.get('/status/:cfOrderId', ctrl.getOrderStatus);

// ── Get logged-in user's order history ───────────────────────────────────────
router.get('/my-orders', authUser, ctrl.getMyOrders);

// ── Check if user has access to an item ──────────────────────────────────────
router.get('/check-access', authUser, ctrl.checkAccess);

module.exports = router;
