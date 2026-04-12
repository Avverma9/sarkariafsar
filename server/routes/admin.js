const router    = require('express').Router();
const ctrl      = require('../controllers/admin');
const authAdmin = require('../middleware/authAdmin');

// Public
router.post('/login', ctrl.login);

// Protected — require valid admin JWT
router.get('/me',              authAdmin, ctrl.getMe);
router.post('/change-password', authAdmin, ctrl.changePassword);

module.exports = router;
