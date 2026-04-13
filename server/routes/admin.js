const router          = require('express').Router();
const ctrl            = require('../controllers/admin');
const authSettingsCtrl = require('../controllers/authSettings');
const authAdmin       = require('../middleware/authAdmin');

// Public
router.post('/login', ctrl.login);

// Protected — require valid admin JWT
router.get('/me',               authAdmin, ctrl.getMe);
router.post('/change-password', authAdmin, ctrl.changePassword);

// Auth settings
router.get('/auth-settings', authAdmin, authSettingsCtrl.getSettings);
router.put('/auth-settings', authAdmin, authSettingsCtrl.updateSettings);

module.exports = router;
