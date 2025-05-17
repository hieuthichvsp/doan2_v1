/**
 * Controller xử lý đăng xuất người dùng
 * - Hủy session
 * - Xóa cookie nếu có
 * - Chuyển hướng về trang đăng nhập
 */

/**
 * Xử lý đăng xuất
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleLogout = (req, res) => {
    try {
        // Lưu lại role để xác định trang chuyển hướng sau khi đăng xuất
        const userRole = req.session?.user?.role;

        // Xóa phiên đăng nhập
        req.session.destroy((err) => {
            if (err) {
                console.error('Lỗi khi đăng xuất:', err);
                return res.status(500).send('Đã xảy ra lỗi khi đăng xuất');
            }

            // Xóa cookie phiên nếu có
            res.clearCookie('connect.sid');
            
            // Chuyển hướng về trang đăng nhập
            res.redirect('/');
        });
    } catch (error) {
        console.error('Lỗi không xác định khi đăng xuất:', error);
        res.status(500).send('Đã xảy ra lỗi khi đăng xuất');
    }
};

/**
 * Xử lý đăng xuất bằng API (cho các yêu cầu AJAX)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleLogoutApi = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Lỗi khi đăng xuất:', err);
                return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng xuất' });
            }

            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Đăng xuất thành công' });
        });
    } catch (error) {
        console.error('Lỗi không xác định khi đăng xuất:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng xuất' });
    }
};

/**
 * Xử lý chuyển hướng sau khi đăng xuất
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const afterLogout = (req, res) => {
    // Chuyển hướng về trang đăng nhập với thông báo đăng xuất thành công
    res.redirect('/?message=logged_out');
};

module.exports = {
    handleLogout,
    handleLogoutApi,
    afterLogout
};