const model = require('../../models');

/**
 * Lấy danh sách tất cả phòng ban
 */
const getAllDepartments = async () => {
    try {
        const departments = await model.Department.findAll({
            order: [['name', 'ASC']]
        });
        return departments;
    } catch (error) {
        console.error('Service error - getAllDepartments:', error);
        throw error;
    }
};

/**
 * Lấy thông tin phòng ban theo ID
 * @param {number} departmentId - ID của phòng ban
 */
const getDepartmentById = async (departmentId) => {
    try {
        const department = await model.Department.findByPk(departmentId);
        return department;
    } catch (error) {
        console.error(`Service error - getDepartmentById(${departmentId}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin phòng ban theo tên
 * @param {string} departmentName - Tên của phòng ban
 */
const getDepartmentByName = async (departmentName) => {
    try {
        const department = await model.Department.findOne({
            where: {
                name: departmentName
            }
        });
        return department;
    } catch (error) {
        console.error(`Service error - getDepartmentByName(${departmentName}):`, error);
        throw error;
    }
};

/**
 * Lấy thông tin phòng ban theo mã phòng ban
 * @param {string} departmentCode - Mã phòng ban
 */
const getDepartmentByCode = async (departmentCode) => {
    try {
        const department = await model.Department.findOne({
            where: {
                code: departmentCode
            }
        });
        return department;
    } catch (error) {
        console.error(`Service error - getDepartmentByCode(${departmentCode}):`, error);
        throw error;
    }
};

/**
 * Tạo phòng ban mới
 * @param {Object} departmentData - Dữ liệu phòng ban mới
 */
const createDepartment = async (departmentData) => {
    try {
        // Kiểm tra tên phòng ban đã tồn tại chưa
        if (departmentData.name) {
            const existingName = await getDepartmentByName(departmentData.name);
            if (existingName) {
                throw new Error('Tên phòng ban đã tồn tại');
            }
        }

        // Kiểm tra mã phòng ban đã tồn tại chưa
        if (departmentData.code) {
            const existingCode = await getDepartmentByCode(departmentData.code);
            if (existingCode) {
                throw new Error('Mã phòng ban đã tồn tại');
            }
        }

        const newDepartment = await model.Department.create(departmentData);
        return newDepartment;
    } catch (error) {
        console.error('Service error - createDepartment:', error);
        throw error;
    }
};

/**
 * Cập nhật thông tin phòng ban
 * @param {number} departmentId - ID của phòng ban cần cập nhật
 * @param {Object} departmentData - Dữ liệu cập nhật
 */
const updateDepartment = async (departmentId, departmentData) => {
    try {
        const department = await model.Department.findByPk(departmentId);

        if (!department) {
            throw new Error('Không tìm thấy phòng ban');
        }

        // Kiểm tra tên phòng ban mới đã tồn tại chưa (nếu có thay đổi)
        if (departmentData.name && departmentData.name !== department.name) {
            const existingName = await getDepartmentByName(departmentData.name);
            if (existingName && existingName.id !== departmentId) {
                throw new Error('Tên phòng ban đã tồn tại');
            }
        }

        // Kiểm tra mã phòng ban mới đã tồn tại chưa (nếu có thay đổi)
        if (departmentData.code && departmentData.code !== department.code) {
            const existingCode = await getDepartmentByCode(departmentData.code);
            if (existingCode && existingCode.id !== departmentId) {
                throw new Error('Mã phòng ban đã tồn tại');
            }
        }

        await department.update(departmentData);
        return await getDepartmentById(departmentId);
    } catch (error) {
        console.error(`Service error - updateDepartment(${departmentId}):`, error);
        throw error;
    }
};

/**
 * Xóa phòng ban
 * @param {number} departmentId - ID của phòng ban cần xóa
 */
const deleteDepartment = async (departmentId) => {
    try {
        const department = await model.Department.findByPk(departmentId);

        if (!department) {
            throw new Error('Không tìm thấy phòng ban');
        }

        // Kiểm tra xem có người dùng nào thuộc phòng ban này không
        const usersCount = await model.User.count({
            where: { department_id: departmentId }
        });

        if (usersCount > 0) {
            throw new Error(`Không thể xóa phòng ban này vì có ${usersCount} người dùng đang thuộc phòng ban`);
        }

        // Kiểm tra xem có lớp học nào thuộc phòng ban này không
        if (model.ClassSession) {
            const classSessionsCount = await model.ClassSession.count({
                where: { department_id: departmentId }
            });

            if (classSessionsCount > 0) {
                throw new Error(`Không thể xóa phòng ban này vì có ${classSessionsCount} lớp học phần đang thuộc phòng ban`);
            }
        }

        await department.destroy();
        return true;
    } catch (error) {
        console.error(`Service error - deleteDepartment(${departmentId}):`, error);
        throw error;
    }
};

/**
 * Lấy số lượng người dùng theo phòng ban
 * @param {number} departmentId - ID của phòng ban
 */
const getUserCountByDepartment = async (departmentId) => {
    try {
        return await model.User.count({
            where: { department_id: departmentId }
        });
    } catch (error) {
        console.error(`Service error - getUserCountByDepartment(${departmentId}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách người dùng theo phòng ban
 * @param {number} departmentId - ID của phòng ban
 */
const getUsersByDepartment = async (departmentId) => {
    try {
        return await model.User.findAll({
            where: { department_id: departmentId },
            include: [{ model: model.Role, as: 'role' }],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error(`Service error - getUsersByDepartment(${departmentId}):`, error);
        throw error;
    }
};

/**
 * Lấy danh sách phòng ban kèm theo số lượng người dùng của mỗi phòng ban
 */
const getDepartmentsWithUserCount = async () => {
    try {
        const departments = await getAllDepartments();

        // Lấy số lượng người dùng cho mỗi phòng ban
        const departmentsWithCount = await Promise.all(
            departments.map(async department => {
                const userCount = await getUserCountByDepartment(department.id);
                return {
                    ...department.toJSON(),
                    userCount
                };
            })
        );

        return departmentsWithCount;
    } catch (error) {
        console.error('Service error - getDepartmentsWithUserCount:', error);
        throw error;
    }
};

/**
 * Tìm kiếm phòng ban theo tên hoặc mã phòng ban
 * @param {string} searchTerm - Từ khóa tìm kiếm
 */
const searchDepartments = async (searchTerm) => {
    try {
        return await model.Department.findAll({
            where: {
                [model.Sequelize.Op.or]: [
                    {
                        name: {
                            [model.Sequelize.Op.like]: `%${searchTerm}%`
                        }
                    },
                    {
                        code: {
                            [model.Sequelize.Op.like]: `%${searchTerm}%`
                        }
                    }
                ]
            },
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error(`Service error - searchDepartments(${searchTerm}):`, error);
        throw error;
    }
};

module.exports = {
    getAllDepartments,
    getDepartmentById,
    getDepartmentByName,
    getDepartmentByCode,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getUserCountByDepartment,
    getUsersByDepartment,
    getDepartmentsWithUserCount,
    searchDepartments
};