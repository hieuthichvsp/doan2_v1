const model = require('../../models');
const bcrypt = require('bcrypt');

const verifyUser = async (gmail, password) => {
    try {
        const user = await model.User.findOne({
            where: { email: gmail },
            include: [
                {
                    model: model.Role,
                    as: 'role',
                    attributes: ['name']
                }
            ]
        });

        if (!user) {
            return {
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            };
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return {
                success: false,
                message: 'Mật khẩu không hợp lệ'
            };
        }

        // Đảm bảo role được truyền đi một cách rõ ràng
        return {
            success: true,
            user: user,
            role: user.role ? user.role.name : null
        };
    } catch (error) {
        console.error('Service error - verifyUser:', error.message);
        throw error;
    }
};

module.exports = {
    verifyUser
};
