document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewDepartmentModal = document.getElementById('viewDepartmentModal');
    const editDepartmentModal = document.getElementById('editDepartmentModal');
    const addDepartmentModal = document.getElementById('addDepartmentModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const openAddModalBtn = document.getElementById('openAddModal');

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewDepartmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editDepartmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addDepartmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewDepartmentModal) viewDepartmentModal.style.display = 'none';
        if (e.target === editDepartmentModal) editDepartmentModal.style.display = 'none';
        if (e.target === addDepartmentModal) addDepartmentModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Mở modal thêm khoa
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            addDepartmentModal.style.display = 'block';
            document.getElementById('addDepartmentForm').reset();
        });
    }

    // Xử lý nút xem chi tiết khoa
    document.querySelectorAll('.view-department-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const departmentId = btn.getAttribute('data-id');
            try {
                // Lấy thông tin khoa
                const response = await fetch(`/admin/api/departments/${departmentId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('viewDepartCode').textContent = data.department.departcode;
                    document.getElementById('viewDepartName').textContent = data.department.name;

                    // Lấy danh sách người dùng thuộc khoa
                    const usersResponse = await fetch(`/admin/api/departments/${departmentId}/users`);
                    const usersData = await usersResponse.json();

                    const userCount = usersData.success ? usersData.users.length : 0;
                    document.getElementById('viewUserCount').textContent = userCount;

                    // Hiển thị danh sách người dùng
                    const userList = document.getElementById('departmentUsers');
                    userList.innerHTML = '';

                    if (userCount > 0) {
                        const userTable = document.createElement('table');
                        userTable.className = 'user-table';
                        userTable.innerHTML = `
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Mã số</th>
                                    <th>Họ tên</th>
                                    <th>Vai trò</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usersData.users.map((user, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${user.user_code || '-'}</td>
                                        <td>${user.name}</td>
                                        <td>${user.role ? user.role.name : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        `;
                        userList.appendChild(userTable);
                    } else {
                        userList.innerHTML = '<p class="no-data">Không có người dùng nào thuộc khoa này</p>';
                    }

                    viewDepartmentModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin khoa', 'error');
                }
            } catch (error) {
                console.error('Error fetching department details:', error);
                showNotification('Lỗi khi tải thông tin khoa', 'error');
            }
        });
    });

    // Xử lý nút chỉnh sửa khoa
    document.querySelectorAll('.edit-department-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const departmentId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/departments/${departmentId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('editId').value = data.department.id;
                    document.getElementById('editDepartCode').value = data.department.departcode;
                    document.getElementById('editDepartName').value = data.department.name;

                    editDepartmentModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin khoa', 'error');
                }
            } catch (error) {
                console.error('Error fetching department details for edit:', error);
                showNotification('Lỗi khi tải thông tin khoa', 'error');
            }
        });
    });

    // Xử lý nút xóa khoa
    document.querySelectorAll('.delete-department-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const departmentId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/departments/${departmentId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('deleteDepartmentInfo').innerHTML = `
                        <p><strong>Mã khoa:</strong> ${data.department.departcode}</p>
                        <p><strong>Tên khoa:</strong> ${data.department.name}</p>
                    `;

                    document.getElementById('confirmDeleteBtn').setAttribute('data-id', departmentId);
                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin khoa', 'error');
                }
            } catch (error) {
                console.error('Error fetching department details for delete:', error);
                showNotification('Lỗi khi tải thông tin khoa', 'error');
            }
        });
    });

    // Xử lý xác nhận xóa khoa
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function () {
        const departmentId = this.getAttribute('data-id');
        try {
            const response = await fetch(`/admin/api/departments/${departmentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Xóa khoa thành công', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi xóa khoa', 'error');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            showNotification('Lỗi khi xóa khoa', 'error');
        }
    });

    // Xử lý form thêm khoa
    document.getElementById('addDepartmentForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            departcode: document.getElementById('addDepartCode').value.trim(),
            name: document.getElementById('addDepartName').value.trim()
        };

        try {
            const response = await fetch('/admin/api/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                addDepartmentModal.style.display = 'none';
                showNotification('Thêm khoa thành công', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi thêm khoa', 'error');
            }
        } catch (error) {
            console.error('Error adding department:', error);
            showNotification('Lỗi khi thêm khoa', 'error');
        }
    });

    // Xử lý form cập nhật khoa
    document.getElementById('editDepartmentForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const departmentId = document.getElementById('editId').value;
        const formData = {
            departcode: document.getElementById('editDepartCode').value.trim(),
            name: document.getElementById('editDepartName').value.trim()
        };

        try {
            const response = await fetch(`/admin/api/departments/${departmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                editDepartmentModal.style.display = 'none';
                showNotification('Cập nhật khoa thành công', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi cập nhật khoa', 'error');
            }
        } catch (error) {
            console.error('Error updating department:', error);
            showNotification('Lỗi khi cập nhật khoa', 'error');
        }
    });

    // Kiểm tra mã khoa đã tồn tại
    document.getElementById('addDepartCode')?.addEventListener('blur', async function () {
        const code = this.value.trim();
        if (!code) return;

        checkDuplicateField('departcode', code);
    });

    // Kiểm tra tên khoa đã tồn tại
    document.getElementById('addDepartName')?.addEventListener('blur', async function () {
        const name = this.value.trim();
        if (!name) return;

        checkDuplicateField('name', name);
    });

    // Kiểm tra mã khoa đã tồn tại khi cập nhật
    document.getElementById('editDepartCode')?.addEventListener('blur', async function () {
        const code = this.value.trim();
        const departmentId = document.getElementById('editId').value;
        if (!code || !departmentId) return;

        checkDuplicateField('departcode', code, departmentId);
    });

    // Kiểm tra tên khoa đã tồn tại khi cập nhật
    document.getElementById('editDepartName')?.addEventListener('blur', async function () {
        const name = this.value.trim();
        const departmentId = document.getElementById('editId').value;
        if (!name || !departmentId) return;

        checkDuplicateField('name', name, departmentId);
    });

    // Hàm kiểm tra trùng lặp
    async function checkDuplicateField(field, value, excludeId = null) {
        try {
            const endpoint = field === 'departcode' ? '/admin/api/departments/check-code' : '/admin/api/departments/check-name';
            const url = new URL(endpoint, window.location.origin);
            url.searchParams.append('value', value);
            if (excludeId) url.searchParams.append('excludeId', excludeId);

            const response = await fetch(url.toString());
            const data = await response.json();

            const inputId = field === 'departcode'
                ? (excludeId ? 'editDepartCode' : 'addDepartCode')
                : (excludeId ? 'editDepartName' : 'addDepartName');
            const inputElement = document.getElementById(inputId);

            if (data.exists) {
                const fieldName = field === 'departcode' ? 'Mã khoa' : 'Tên khoa';
                showNotification(`${fieldName} "${value}" đã tồn tại`, 'error');
                inputElement.classList.add('error');
            } else {
                inputElement.classList.remove('error');
            }
        } catch (error) {
            console.error(`Error checking duplicate ${field}:`, error);
        }
    }

    // Hiển thị thông báo
    function showNotification(message, type = 'success') {
        const notificationMessage = document.getElementById('notificationMessage');
        if (!notificationMessage) return;

        notificationMessage.textContent = message;

        notificationModal.className = 'notification-modal ' + type;
        notificationModal.style.display = 'block';

        setTimeout(() => {
            notificationModal.classList.add('fade-out');
            setTimeout(() => {
                notificationModal.style.display = 'none';
                notificationModal.classList.remove('fade-out');
            }, 500);
        }, 3000);
    }

    // Xử lý phân trang
    const pageNumbersContainer = document.getElementById('page-numbers');
    if (pageNumbersContainer) {
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            const currentPage = parseInt(paginationContainer.dataset.currentPage) || 1;
            const totalPages = parseInt(paginationContainer.dataset.totalPages) || 1;
            const searchTerm = paginationContainer.dataset.searchTerm || '';

            // Tạo khoảng trang để hiển thị
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            // Đảm bảo luôn hiển thị ít nhất 5 trang nếu có đủ
            if (endPage - startPage + 1 < 5 && totalPages >= 5) {
                if (startPage === 1) {
                    endPage = Math.min(5, totalPages);
                } else if (endPage === totalPages) {
                    startPage = Math.max(1, totalPages - 4);
                }
            }

            // Tạo nút cho mỗi trang
            let paginationHTML = '';

            for (let i = startPage; i <= endPage; i++) {
                if (i === currentPage) {
                    paginationHTML += `<span class="pagination-link active">${i}</span>`;
                } else {
                    const searchParam = searchTerm ? `&search=${searchTerm}` : '';
                    paginationHTML += `<a href="?page=${i}${searchParam}" class="pagination-link">${i}</a>`;
                }
            }

            pageNumbersContainer.innerHTML = paginationHTML;
        }
    }
});