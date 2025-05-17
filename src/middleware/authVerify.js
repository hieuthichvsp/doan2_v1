// Kiểm tra quyền admin và đặt user vào locals
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        // Đặt user vào cả res.locals và req.user để các controller có thể truy cập
        res.locals.user = req.session.user;
        req.user = req.session.user;
        next();
    } else if (req.session && req.session.user) {
        // Chuyển hướng người dùng về trang chính của vai trò tương ứng
        const role = req.session.user.role;
        if (role === 'teacher') {
            res.redirect('/teacher/dashboard');
        } else if (role === 'student') {
            res.redirect('/student/dashboard');
        } else {
            res.redirect('/');
        }
    } else {
        // Người dùng chưa đăng nhập, chuyển về trang đăng nhập
        res.redirect('/');
    }
};

// Kiểm tra quyền giáo viên
const isTeacher = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.role === 'teacher' || req.session.user.role === 'admin')) {
        // Đặt user vào cả res.locals và req.user
        res.locals.user = req.session.user;
        req.user = req.session.user;
        next();
    } else if (req.session && req.session.user) {
        // Người dùng đã đăng nhập nhưng không phải là giáo viên
        res.redirect('/student/dashboard');
    } else {
        // Chưa đăng nhập
        res.redirect('/');
    }
};

// Kiểm tra quyền học sinh
const isStudent = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.role === 'student' || req.session.user.role === 'admin')) {
        // Đặt user vào cả res.locals và req.user
        res.locals.user = req.session.user;
        req.user = req.session.user;
        next();
    } else if (req.session && req.session.user) {
        // Người dùng đã đăng nhập nhưng không phải học sinh
        res.redirect('/teacher/dashboard');
    } else {
        // Chưa đăng nhập
        res.redirect('/');
    }
};

// Kiểm tra đã đăng nhập chưa
const checkAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        // Đặt user vào cả res.locals và req.user
        res.locals.user = req.session.user;
        req.user = req.session.user;
        next();
    } else {
        // Chưa đăng nhập, chuyển hướng về trang đăng nhập
        res.redirect('/');
    }
};

// Middleware kiểm tra nếu đã đăng nhập rồi thì không cho vào trang login
const isLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        // Nếu đã đăng nhập, điều hướng theo vai trò
        const role = req.session.user.role;
        if (role === 'admin') {
            res.redirect('/admin/dashboard');
        } else if (role === 'teacher') {
            res.redirect('/teacher/dashboard');
        } else {
            res.redirect('/student/dashboard');
        }
    } else {
        // Chưa đăng nhập, cho phép tiếp tục vào trang login
        next();
    }
};

// Render trang đăng nhập
const renderLogin = (req, res) => {
    res.render('authView/login', { title: 'Đăng nhập' });
};

module.exports = {
    isAdmin,
    isTeacher,
    isStudent,
    checkAuth,
    isLogin,
    renderLogin
};
