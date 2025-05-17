document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewClassroomModal = document.getElementById('viewClassroomModal');
    const editClassroomModal = document.getElementById('editClassroomModal');
    const addClassroomModal = document.getElementById('addClassroomModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const openAddModalBtn = document.getElementById('openAddModal');

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewClassroomModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editClassroomModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addClassroomModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewClassroomModal) viewClassroomModal.style.display = 'none';
        if (e.target === editClassroomModal) editClassroomModal.style.display = 'none';
        if (e.target === addClassroomModal) addClassroomModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Mở modal thêm lớp học
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            addClassroomModal.style.display = 'block';
            document.getElementById('addClassroomForm').reset();
        });
    }

    // Xử lý nút xem chi tiết lớp học
    document.querySelectorAll('.view-classroom-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const classroomId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/classrooms/${classroomId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('viewRoomCode').textContent = data.classroom.room_code;
                    document.getElementById('viewRoomName').textContent = data.classroom.name;
                    document.getElementById('viewCapacity').textContent = data.classroom.capacity;
                    document.getElementById('viewType').textContent = data.classroom.type === 'LT' ? 'Lý thuyết' : 'Thực hành';

                    viewClassroomModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin lớp học', 'error');
                }
            } catch (error) {
                console.error('Error fetching classroom details:', error);
                showNotification('Lỗi khi tải thông tin lớp học', 'error');
            }
        });
    });

    // Xử lý nút chỉnh sửa lớp học
    document.querySelectorAll('.edit-classroom-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const classroomId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/classrooms/${classroomId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('editId').value = data.classroom.id;
                    document.getElementById('editRoomCode').value = data.classroom.room_code;
                    document.getElementById('editRoomName').value = data.classroom.name;
                    document.getElementById('editCapacity').value = data.classroom.capacity;
                    document.getElementById('editType').value = data.classroom.type;

                    editClassroomModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin lớp học', 'error');
                }
            } catch (error) {
                console.error('Error fetching classroom details for edit:', error);
                showNotification('Lỗi khi tải thông tin lớp học', 'error');
            }
        });
    });

    // Xử lý nút xóa lớp học
    document.querySelectorAll('.delete-classroom-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const classroomId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/classrooms/${classroomId}`);
                const data = await response.json();

                if (data.success) {
                    const typeText = data.classroom.type === 'LT' ? 'Lý thuyết' : 'Thực hành';

                    document.getElementById('deleteClassroomInfo').innerHTML = `
                        <p><strong>Mã lớp học:</strong> ${data.classroom.room_code}</p>
                        <p><strong>Tên lớp học:</strong> ${data.classroom.name}</p>
                        <p><strong>Sức chứa:</strong> ${data.classroom.capacity}</p>
                        <p><strong>Loại phòng:</strong> ${typeText}</p>
                    `;

                    document.getElementById('confirmDeleteBtn').setAttribute('data-id', classroomId);
                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin lớp học', 'error');
                }
            } catch (error) {
                console.error('Error fetching classroom details for delete:', error);
                showNotification('Lỗi khi tải thông tin lớp học', 'error');
            }
        });
    });

    // Xử lý xác nhận xóa lớp học
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function () {
        const classroomId = this.getAttribute('data-id');
        try {
            const response = await fetch(`/admin/api/classrooms/${classroomId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Xóa lớp học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                    const searchParams = new URLSearchParams(window.location.search);

                    // Kiểm tra nếu lớp học cuối cùng trên trang hiện tại bị xóa
                    const totalClassrooms = parseInt(document.querySelector('.pagination-info')?.textContent.match(/của (\d+)/)?.[1] || 0);
                    const classroomsOnCurrentPage = document.querySelectorAll('tbody tr').length;
                    const isLastClassroomOnPage = classroomsOnCurrentPage === 1;

                    // Nếu là lớp học cuối cùng và không phải trang đầu tiên thì giảm số trang
                    if (isLastClassroomOnPage && currentPage > 1 && currentPage > Math.ceil((totalClassrooms - 1) / 7)) {
                        searchParams.set('page', (parseInt(currentPage) - 1).toString());
                    }

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi xóa lớp học', 'error');
            }
        } catch (error) {
            console.error('Error deleting classroom:', error);
            showNotification('Lỗi khi xóa lớp học', 'error');
        }
    });

    // Xử lý form thêm lớp học
    document.getElementById('addClassroomForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            room_code: document.getElementById('addRoomCode').value.trim(),
            name: document.getElementById('addRoomName').value.trim(),
            capacity: parseInt(document.getElementById('addCapacity').value),
            type: document.getElementById('addType').value
        };

        try {
            const response = await fetch('/admin/api/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                addClassroomModal.style.display = 'none';
                showNotification('Thêm lớp học thành công', 'success');
                setTimeout(() => {
                    // Đặt lại trang về 1 nếu thêm lớp học mới
                    const searchParams = new URLSearchParams(window.location.search);
                    searchParams.set('page', '1');

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi thêm lớp học', 'error');
            }
        } catch (error) {
            console.error('Error adding classroom:', error);
            showNotification('Lỗi khi thêm lớp học', 'error');
        }
    });

    // Xử lý form cập nhật lớp học
    document.getElementById('editClassroomForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const classroomId = document.getElementById('editId').value;
        const formData = {
            room_code: document.getElementById('editRoomCode').value.trim(),
            name: document.getElementById('editRoomName').value.trim(),
            capacity: parseInt(document.getElementById('editCapacity').value),
            type: document.getElementById('editType').value
        };

        try {
            const response = await fetch(`/admin/api/classrooms/${classroomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                editClassroomModal.style.display = 'none';
                showNotification('Cập nhật lớp học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi cập nhật lớp học', 'error');
            }
        } catch (error) {
            console.error('Error updating classroom:', error);
            showNotification('Lỗi khi cập nhật lớp học', 'error');
        }
    });

    // Kiểm tra mã lớp học đã tồn tại
    document.getElementById('addRoomCode')?.addEventListener('blur', async function () {
        const roomCode = this.value.trim();
        if (!roomCode) return;

        try {
            const response = await fetch(`/admin/api/classrooms/check-duplicate?field=room_code&value=${encodeURIComponent(roomCode)}`);
            const data = await response.json();

            if (data.exists) {
                showNotification(`Mã lớp học "${roomCode}" đã tồn tại`, 'error');
                this.focus();
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        } catch (error) {
            console.error('Error checking duplicate classroom code:', error);
        }
    });

    // Kiểm tra mã lớp học đã tồn tại khi sửa
    document.getElementById('editRoomCode')?.addEventListener('blur', async function () {
        const roomCode = this.value.trim();
        const currentId = document.getElementById('editId')?.value;

        if (!roomCode || !currentId) return;

        try {
            const response = await fetch(`/admin/api/classrooms/check-duplicate?field=room_code&value=${encodeURIComponent(roomCode)}&excludeId=${currentId}`);
            const data = await response.json();

            if (data.exists) {
                showNotification(`Mã lớp học "${roomCode}" đã tồn tại`, 'error');
                this.focus();
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        } catch (error) {
            console.error('Error checking duplicate classroom code during edit:', error);
        }
    });

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
            const searchCode = paginationContainer.dataset.searchCode || '';

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
                    const searchParam = searchCode ? `&searchCode=${searchCode}` : '';
                    paginationHTML += `<a href="?page=${i}${searchParam}" class="pagination-link">${i}</a>`;
                }
            }

            pageNumbersContainer.innerHTML = paginationHTML;
        }
    }
});
