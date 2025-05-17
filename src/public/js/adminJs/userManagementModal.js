document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewUserModal = document.getElementById('viewUserModal');
    const editUserModal = document.getElementById('editUserModal');
    const addUserModal = document.getElementById('addUserModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewUserModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editUserModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addUserModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewUserModal) viewUserModal.style.display = 'none';
        if (e.target === editUserModal) editUserModal.style.display = 'none';
        if (e.target === addUserModal) addUserModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Load vai trò và phòng ban
    loadRolesAndDepartments();

    // Xử lý nút xem chi tiết người dùng
    document.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            fetchUserAndPopulateViewModal(userId);
        });
    });

    // Xử lý nút chỉnh sửa người dùng
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            fetchUserAndPopulateEditModal(userId);
        });
    });

    // Sửa đổi phần xử lý nút xóa người dùng
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const currentUserId = document.querySelector('meta[name="current-user-id"]').getAttribute('content');

            // Kiểm tra xem có đang xóa tài khoản đang đăng nhập không
            if (userId === currentUserId) {
                showNotification('Không thể xóa tài khoản đang đăng nhập', 'error');
                return;
            }

            showDeleteConfirmation(userId);
        });
    });

    // Xử lý nút thêm người dùng
    document.getElementById('addUserBtn').addEventListener('click', () => {
        addUserModal.style.display = 'block';
    });

    // Xử lý xác nhận xóa
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const userId = document.getElementById('confirmDeleteBtn').getAttribute('data-id');
        deleteUser(userId);
    });

    // Xử lý form thêm người dùng
    document.getElementById('addUserForm').addEventListener('submit', function (e) {
        e.preventDefault();
        addUser(this);
    });

    // Xử lý form sửa người dùng
    document.getElementById('editUserForm').addEventListener('submit', function (e) {
        e.preventDefault();
        updateUser(this);
    });

    // Hàm load vai trò và phòng ban
    function loadRolesAndDepartments() {
        // Load vai trò
        fetch('/admin/api/roles')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const roles = data.roles;
                    const addRoleSelect = document.getElementById('addRole');
                    const editRoleSelect = document.getElementById('editRole');

                    // Clear old options
                    addRoleSelect.innerHTML = '<option value="">-- Chọn vai trò --</option>';
                    editRoleSelect.innerHTML = '<option value="">-- Chọn vai trò --</option>';

                    // Add new options
                    roles.forEach(role => {
                        addRoleSelect.innerHTML += `<option value="${role.id}">${role.name}</option>`;
                        editRoleSelect.innerHTML += `<option value="${role.id}">${role.name}</option>`;
                    });
                }
            })
            .catch(error => console.error('Error loading roles:', error));

        // Load phòng ban
        fetch('/admin/api/departments')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const departments = data.departments;
                    const addDepartmentSelect = document.getElementById('addDepartment');
                    const editDepartmentSelect = document.getElementById('editDepartment');

                    // Clear old options
                    addDepartmentSelect.innerHTML = '<option value="">Không có phòng ban</option>';
                    editDepartmentSelect.innerHTML = '<option value="">Không có phòng ban</option>';

                    // Add new options
                    departments.forEach(dept => {
                        addDepartmentSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
                        editDepartmentSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
                    });
                }
            })
            .catch(error => console.error('Error loading departments:', error));
    }

    // Hàm lấy thông tin người dùng và hiển thị trong modal xem chi tiết
    function fetchUserAndPopulateViewModal(userId) {
        fetch(`/admin/api/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;

                    document.getElementById('viewUserCode').textContent = user.user_code;
                    document.getElementById('viewName').textContent = user.name;
                    document.getElementById('viewEmail').textContent = user.email;
                    document.getElementById('viewBirthday').textContent = user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'N/A';
                    document.getElementById('viewAddress').textContent = user.address || 'N/A';
                    document.getElementById('viewRole').textContent = user.role ? user.role.name : 'N/A';
                    document.getElementById('viewDepartment').textContent = user.department ? user.department.name : 'N/A';

                    viewUserModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin người dùng', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                showNotification('Đã có lỗi xảy ra khi tải thông tin người dùng', 'error');
            });
    }

    // Hàm lấy thông tin người dùng và hiển thị trong modal chỉnh sửa
    function fetchUserAndPopulateEditModal(userId) {
        fetch(`/admin/api/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;

                    document.getElementById('editUserId').value = user.id;
                    document.getElementById('editUserCode').value = user.user_code;
                    document.getElementById('editName').value = user.name;
                    document.getElementById('editEmail').value = user.email;

                    if (user.birthday) {
                        const birthDate = new Date(user.birthday);
                        const formattedDate = birthDate.toISOString().split('T')[0];
                        document.getElementById('editBirthday').value = formattedDate;
                    } else {
                        document.getElementById('editBirthday').value = '';
                    }

                    document.getElementById('editAddress').value = user.address || '';
                    document.getElementById('editRole').value = user.role_id || '';
                    document.getElementById('editDepartment').value = user.department_id || '';
                    document.getElementById('editPassword').value = '';

                    editUserModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin người dùng', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                showNotification('Đã có lỗi xảy ra khi tải thông tin người dùng', 'error');
            });
    }

    // Hàm hiển thị xác nhận xóa
    function showDeleteConfirmation(userId) {
        fetch(`/admin/api/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;
                    document.getElementById('deleteUserInfo').textContent = `${user.user_code} - ${user.name}`;
                    document.getElementById('confirmDeleteBtn').setAttribute('data-id', user.id);
                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin người dùng', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                showNotification('Đã có lỗi xảy ra khi tải thông tin người dùng', 'error');
            });
    }

    // Hàm thêm người dùng mới
    function addUser(form) {
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());

        fetch('/admin/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Thêm người dùng thành công', 'success');
                    setTimeout(() => {
                        // Giữ lại tham số phân trang khi reload
                        const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                        const searchParams = new URLSearchParams(window.location.search);

                        // Đặt lại trang về 1 nếu thêm người dùng mới
                        searchParams.set('page', '1');

                        window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                    }, 1500);
                } else {
                    showNotification(data.message || 'Thêm người dùng thất bại', 'error');
                }
            })
            .catch(error => {
                console.error('Error adding user:', error);
                showNotification('Đã có lỗi xảy ra khi thêm người dùng', 'error');
            });
    }

    // Hàm cập nhật thông tin người dùng
    function updateUser(form) {
        const userId = document.getElementById('editUserId').value;
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());

        // Nếu mật khẩu trống, loại bỏ trường mật khẩu
        if (!userData.password) {
            delete userData.password;
        }

        fetch(`/admin/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Cập nhật người dùng thành công', 'success');
                    setTimeout(() => {
                        // Giữ lại tham số phân trang khi reload
                        const currentUrl = new URL(window.location.href);
                        window.location.href = currentUrl.href;
                    }, 1500);
                } else {
                    showNotification(data.message || 'Cập nhật người dùng thất bại', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating user:', error);
                showNotification('Đã có lỗi xảy ra khi cập nhật người dùng', 'error');
            });
    }

    // Hàm xóa người dùng
    function deleteUser(userId) {
        fetch(`/admin/api/users/${userId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    deleteConfirmModal.style.display = 'none';
                    showNotification('Xóa người dùng thành công', 'success');
                    setTimeout(() => {
                        // Giữ lại tham số phân trang khi reload
                        const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                        const searchParams = new URLSearchParams(window.location.search);

                        // Kiểm tra nếu người dùng cuối cùng trên trang hiện tại bị xóa
                        const totalUsers = parseInt(document.querySelector('.pagination-info').textContent.match(/của (\d+)/)[1]);
                        const usersOnCurrentPage = document.querySelectorAll('tbody tr').length;
                        const isLastUserOnPage = usersOnCurrentPage === 1;

                        // Nếu là người dùng cuối cùng và không phải trang đầu tiên thì giảm số trang
                        if (isLastUserOnPage && currentPage > 1 && currentPage > Math.ceil((totalUsers - 1) / 7)) {
                            searchParams.set('page', (parseInt(currentPage) - 1).toString());
                        }

                        window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                    }, 1500);
                } else {
                    showNotification(data.message || 'Xóa người dùng thất bại', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showNotification('Đã có lỗi xảy ra khi xóa người dùng', 'error');
            });
    }

    // Hàm hiển thị thông báo
    function showNotification(message, type = 'success') {
        const icons = {
            success: document.querySelector('.notification-icon .fa-check-circle'),
            delete: document.querySelector('.notification-icon .fa-trash-alt'),
            error: document.querySelector('.notification-icon .fa-exclamation-triangle')
        };

        // Ẩn tất cả các biểu tượng
        Object.values(icons).forEach(icon => {
            if (icon) icon.style.display = 'none';
        });

        // Hiển thị biểu tượng phù hợp
        if (type === 'success') {
            if (icons.success) icons.success.style.display = 'block';
            notificationModal.className = 'notification-modal success';
        } else if (type === 'delete') {
            if (icons.delete) icons.delete.style.display = 'block';
            notificationModal.className = 'notification-modal delete';
        } else {
            if (icons.error) icons.error.style.display = 'block';
            notificationModal.className = 'notification-modal error';
        }

        document.getElementById('notificationMessage').textContent = message;
        notificationModal.style.display = 'block';

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
            notificationModal.style.display = 'none';
        }, 3000);
    }
});