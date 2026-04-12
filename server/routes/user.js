const router = require('express').Router();
const ctrl   = require('../controllers/user');
const authUser = require('../middleware/authUser');

router.get('/profile',      authUser, ctrl.getProfile);
router.get('/saved',        authUser, ctrl.getSavedJobs);
router.post('/save/:postId', authUser, ctrl.toggleSaveJob);
router.get('/mock-history',  authUser, ctrl.getMockHistory);
router.post('/mock-history', authUser, ctrl.addMockHistory);
router.get('/all',           authUser, ctrl.getAllUsers); // admin use

module.exports = router;
