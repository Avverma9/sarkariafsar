const router   = require('express').Router();
const ctrl     = require('../controllers/notification');
const authUser = require('../middleware/authUser');

router.get('/my',                  authUser, ctrl.mySubscriptions);
router.get('/status/:postId',      authUser, ctrl.checkStatus);
router.post('/subscribe/:postId',  authUser, ctrl.subscribe);
router.delete('/unsubscribe/:postId', authUser, ctrl.unsubscribe);
router.post('/manual/:postId',     ctrl.sendManual); // admin, no user auth needed (add admin check if needed)

module.exports = router;
