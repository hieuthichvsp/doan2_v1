const auth = require('../../services/authService/loginService');

const verifyLoginController = async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        const result = await auth.verifyUser(username, password);

        if (result.success) {
            // Tạo session cho người dùng đã đăng nhập
            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.role
            };

            // Nếu người dùng chọn "remember me"
            if (remember) {
                // Thiết lập thời gian cookie lâu hơn (ví dụ: 30 ngày)
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
            }

            // Trả về response theo đúng định dạng client cần
            return res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                role: result.role
            });
        }

        // Nếu đăng nhập thất bại
        return res.status(401).json({
            success: false,
            message: result.message || 'Thông tin đăng nhập không chính xác'
        });
    } catch (error) {
        console.error('Login controller error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ',
            error: error.message
        });
    }
}

module.exports = {
    verifyLoginController,
};
