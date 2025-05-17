const express = require('express');
const middleware = require('../middleware/authVerify');
const auth = require('../controllers/authController/login');
const logoutController = require('../controllers/authController/logout');

const router = express.Router();

// Trang đăng nhập - Kiểm tra đã đăng nhập chưa rồi mới render trang login
router.get('/', middleware.isLogin, middleware.renderLogin);

// Xử lý đăng nhập
router.post('/login', auth.verifyLoginController);
// Route đăng xuất
router.get('/logout', logoutController.handleLogout);

// Route đăng xuất API
router.post('/api/logout', logoutController.handleLogoutApi);

module.exports = router;
