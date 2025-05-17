const model = require('../../models');

/**
 * Lấy danh sách tất cả vai trò
 */
const getAllRoles = async () => {
    try {
        const roles = await model.Role.findAll({
            order: [['id', 'ASC']]
        });
        return roles;
    } catch (error) {
        console.error('Service error - getAllRoles:', error);
        throw error;
    }
};

/**
 * Lấy vai trò theo ID
 * @param {number} roleId - ID của vai trò cần lấy
 */
const getRoleById = async (roleId) => {
    try {
        const role = await model.Role.findByPk(roleId);
        return role;
    } catch (error) {
        console.error(`Service error - getRoleById(${roleId}):`, error);
        throw error;
    }
};

/**
 * Lấy vai trò theo tên
 * @param {string} roleName - Tên của vai trò cần lấy
 */
const getRoleByName = async (roleName) => {
    try {
        const role = await model.Role.findOne({
            where: {
                name: roleName
            }
        });
        return role;
    } catch (error) {
        console.error(`Service error - getRoleByName(${roleName}):`, error);
        throw error;
    }
};

/**
 * Tạo vai trò mới
 * @param {Object} roleData - Dữ liệu vai trò mới (name, description)
 */
const createRole = async (roleData) => {
    try {
        // Kiểm tra vai trò đã tồn tại chưa
        const existingRole = await getRoleByName(roleData.name);
        if (existingRole) {
            throw new Error('Vai trò này đã tồn tại');
        }

        const newRole = await model.Role.create(roleData);
        return newRole;
    } catch (error) {
        console.error('Service error - createRole:', error);
        throw error;
    }
};

/**
 * Cập nhật vai trò
 * @param {number} roleId - ID của vai trò cần cập nhật
 * @param {Object} roleData - Dữ liệu cập nhật (name, description)
 */
const updateRole = async (roleId, roleData) => {
    try {
        const role = await model.Role.findByPk(roleId);

        if (!role) {
            throw new Error('Không tìm thấy vai trò');
        }

        // Kiểm tra tên vai trò mới đã tồn tại chưa (nếu có thay đổi)
        if (roleData.name && roleData.name !== role.name) {
            const existingRole = await getRoleByName(roleData.name);
            if (existingRole) {
                throw new Error('Tên vai trò này đã tồn tại');
            }
        }

        await role.update(roleData);
        return await getRoleById(roleId);
    } catch (error) {
        console.error(`Service error - updateRole(${roleId}):`, error);
        throw error;
    }
};

/**
 * Xóa vai trò
 * @param {number} roleId - ID của vai trò cần xóa
 */
const deleteRole = async (roleId) => {
    try {
        const role = await model.Role.findByPk(roleId);

        if (!role) {
            throw new Error('Không tìm thấy vai trò');
        }

        // Kiểm tra xem có người dùng nào đang dùng vai trò này không
        const usersCount = await model.User.count({
            where: { role_id: roleId }
        });

        if (usersCount > 0) {
            throw new Error(`Không thể xóa vai trò này vì có ${usersCount} người dùng đang sử dụng`);
        }

        await role.destroy();
        return true;
    } catch (error) {
        console.error(`Service error - deleteRole(${roleId}):`, error);
        throw error;
    }
};

/**
 * Lấy số lượng người dùng theo vai trò
 * @param {number} roleId - ID của vai trò
 */
const getUserCountByRole = async (roleId) => {
    try {
        return await model.User.count({
            where: { role_id: roleId }
        });
    } catch (error) {
        console.error(`Service error - getUserCountByRole(${roleId}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách vai trò có thể phân quyền
 * Ngoại trừ vai trò admin và một số vai trò hệ thống
 */
const getAssignableRoles = async () => {
    try {
        // Danh sách ID vai trò không được phân quyền (admin và các vai trò hệ thống)
        const excludeRoleIds = [1]; // Giả sử id=1 là admin

        return await model.Role.findAll({
            where: {
                id: {
                    [model.Sequelize.Op.notIn]: excludeRoleIds
                }
            },
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error('Service error - getAssignableRoles:', error);
        throw error;
    }
};

/**
 * Lấy danh sách vai trò và số lượng người dùng của từng vai trò
 */
const getRolesWithUserCount = async () => {
    try {
        const roles = await getAllRoles();

        // Lấy số lượng người dùng cho mỗi vai trò
        const rolesWithCount = await Promise.all(
            roles.map(async role => {
                const userCount = await getUserCountByRole(role.id);
                return {
                    ...role.toJSON(),
                    userCount
                };
            })
        );

        return rolesWithCount;
    } catch (error) {
        console.error('Service error - getRolesWithUserCount:', error);
        throw error;
    }
};

module.exports = {
    getAllRoles,
    getRoleById,
    getRoleByName,
    createRole,
    updateRole,
    deleteRole,
    getUserCountByRole,
    getAssignableRoles,
    getRolesWithUserCount
};