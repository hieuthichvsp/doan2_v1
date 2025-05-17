document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewSemesterModal = document.getElementById('viewSemesterModal');
    const editSemesterModal = document.getElementById('editSemesterModal');
    const addSemesterModal = document.getElementById('addSemesterModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const openAddModalBtn = document.getElementById('openAddModal');

    // Khởi tạo date picker
    initDatePickers();

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewSemesterModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editSemesterModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSemesterModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewSemesterModal) viewSemesterModal.style.display = 'none';
        if (e.target === editSemesterModal) editSemesterModal.style.display = 'none';
        if (e.target === addSemesterModal) addSemesterModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Mở modal thêm học kỳ
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            addSemesterModal.style.display = 'block';
            document.getElementById('addSemesterForm').reset();
        });
    }

    // Xử lý nút xem chi tiết học kỳ
    document.querySelectorAll('.view-semester-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const semesterId = btn.getAttribute('data-id');
            try {
                // Lấy thông tin học kỳ
                const response = await fetch(`/admin/api/semesters/${semesterId}`);
                const data = await response.json();

                if (data.success) {
                    const semester = data.semester;
                    document.getElementById('viewSemesterName').textContent = semester.name;
                    document.getElementById('viewStartTime').textContent = semester.start_time_formatted;
                    document.getElementById('viewEndTime').textContent = semester.end_time_formatted;

                    // Hiển thị trạng thái
                    const statusEl = document.getElementById('viewSemesterStatus');
                    statusEl.className = 'status ' + semester.status;

                    if (semester.status === 'active') {
                        statusEl.textContent = 'Đang diễn ra';
                    } else if (semester.status === 'upcoming') {
                        statusEl.textContent = 'Sắp tới';
                    } else {
                        statusEl.textContent = 'Đã kết thúc';
                    }

                    document.getElementById('viewClassSessionCount').textContent = semester.classSessionCount || 0;

                    // Lấy danh sách buổi học thuộc học kỳ
                    const classSessionsResponse = await fetch(`/admin/api/semesters/${semesterId}/class-sessions`);
                    const classSessionsData = await classSessionsResponse.json();

                    const classSessionsContainer = document.getElementById('classSessionsContainer');
                    const classSessionList = document.getElementById('classSessionList');

                    if (classSessionsData.success && classSessionsData.classSessions.length > 0) {
                        let tableHtml = `
                            <table class="class-session-table">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Lớp học</th>
                                        <th>Môn học</th>
                                        <th>Ngày</th>
                                        <th>Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;

                        classSessionsData.classSessions.forEach((session, index) => {
                            tableHtml += `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${session.class ? session.class.room_code + ' - ' + session.class.name : 'N/A'}</td>
                                    <td>${session.subject ? session.subject.sub_code + ' - ' + session.subject.name : 'N/A'}</td>
                                    <td>${session.date_formatted}</td>
                                    <td>${session.start_time_formatted} - ${session.end_time_formatted}</td>
                                </tr>
                            `;
                        });

                        tableHtml += `
                                </tbody>
                            </table>
                        `;

                        classSessionList.innerHTML = tableHtml;
                        classSessionsContainer.style.display = 'block';
                    } else {
                        classSessionList.innerHTML = '<p class="no-data">Không có buổi học nào trong học kỳ này</p>';
                        classSessionsContainer.style.display = 'block';
                    }

                    viewSemesterModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin học kỳ', 'error');
                }
            } catch (error) {
                console.error('Error fetching semester details:', error);
                showNotification('Lỗi khi tải thông tin học kỳ', 'error');
            }
        });
    });

    // Xử lý nút chỉnh sửa học kỳ
    document.querySelectorAll('.edit-semester-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const semesterId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/semesters/${semesterId}`);
                const data = await response.json();

                if (data.success) {
                    const semester = data.semester;
                    document.getElementById('editId').value = semester.id;
                    document.getElementById('editName').value = semester.name;

                    // Format dates for inputs (YYYY-MM-DD)
                    const startDate = new Date(semester.start_time);
                    const endDate = new Date(semester.end_time);

                    document.getElementById('editStartTime').value = formatDateForInput(startDate);
                    document.getElementById('editEndTime').value = formatDateForInput(endDate);

                    // Reinitialize date pickers
                    initDatePickers();

                    editSemesterModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin học kỳ', 'error');
                }
            } catch (error) {
                console.error('Error fetching semester details for edit:', error);
                showNotification('Lỗi khi tải thông tin học kỳ', 'error');
            }
        });
    });

    // Xử lý nút xóa học kỳ
    document.querySelectorAll('.delete-semester-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const semesterId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/semesters/${semesterId}`);
                const data = await response.json();

                if (data.success) {
                    const semester = data.semester;
                    document.getElementById('deleteSemesterInfo').innerHTML = `
                        <p><strong>Tên học kỳ:</strong> ${semester.name}</p>
                        <p><strong>Thời gian:</strong> ${semester.start_time_formatted} - ${semester.end_time_formatted}</p>
                    `;

                    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                    confirmDeleteBtn.setAttribute('data-id', semesterId);

                    // Kiểm tra học kỳ có đang được sử dụng không
                    if (semester.classSessionCount && semester.classSessionCount > 0) {
                        confirmDeleteBtn.disabled = true;
                        confirmDeleteBtn.classList.add('disabled');
                        document.getElementById('deleteWarningMessage').innerHTML = `
                            <div class="warning-message">
                                Không thể xóa học kỳ này vì nó đang được sử dụng bởi ${semester.classSessionCount} buổi học.
                            </div>`;
                        document.getElementById('deleteWarningMessage').style.display = 'block';
                    } else {
                        confirmDeleteBtn.disabled = false;
                        confirmDeleteBtn.classList.remove('disabled');
                        document.getElementById('deleteWarningMessage').style.display = 'none';
                    }

                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin học kỳ', 'error');
                }
            } catch (error) {
                console.error('Error fetching semester details for delete:', error);
                showNotification('Lỗi khi tải thông tin học kỳ', 'error');
            }
        });
    });

    // Xử lý xác nhận xóa học kỳ
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function () {
        if (this.disabled) return;

        const semesterId = this.getAttribute('data-id');
        try {
            const response = await fetch(`/admin/api/semesters/${semesterId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Xóa học kỳ thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                    const searchParams = new URLSearchParams(window.location.search);

                    // Kiểm tra nếu học kỳ cuối cùng trên trang hiện tại bị xóa
                    const totalSemesters = parseInt(document.querySelector('.pagination-info')?.textContent.match(/của (\d+)/)?.[1] || 0);
                    const semestersOnCurrentPage = document.querySelectorAll('tbody tr').length;
                    const isLastSemesterOnPage = semestersOnCurrentPage === 1;

                    // Nếu là học kỳ cuối cùng và không phải trang đầu tiên thì giảm số trang
                    if (isLastSemesterOnPage && currentPage > 1 && currentPage > Math.ceil((totalSemesters - 1) / 10)) {
                        searchParams.set('page', (parseInt(currentPage) - 1).toString());
                    }

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi xóa học kỳ', 'error');
            }
        } catch (error) {
            console.error('Error deleting semester:', error);
            showNotification('Lỗi khi xóa học kỳ', 'error');
        }
    });

    // Xử lý form thêm học kỳ
    document.getElementById('addSemesterForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('addName').value.trim(),
            start_time: document.getElementById('addStartTime').value,
            end_time: document.getElementById('addEndTime').value
        };

        // Kiểm tra trước khi gửi
        if (!validateSemesterForm(formData)) return;

        try {
            const response = await fetch('/admin/api/semesters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                addSemesterModal.style.display = 'none';
                showNotification('Thêm học kỳ thành công', 'success');
                setTimeout(() => {
                    // Đặt lại trang về 1 nếu thêm học kỳ mới
                    const searchParams = new URLSearchParams(window.location.search);
                    searchParams.set('page', '1');

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi thêm học kỳ', 'error');
            }
        } catch (error) {
            console.error('Error adding semester:', error);
            showNotification('Lỗi khi thêm học kỳ', 'error');
        }
    });

    // Xử lý form cập nhật học kỳ
    document.getElementById('editSemesterForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const semesterId = document.getElementById('editId').value;
        const formData = {
            name: document.getElementById('editName').value.trim(),
            start_time: document.getElementById('editStartTime').value,
            end_time: document.getElementById('editEndTime').value
        };

        // Kiểm tra trước khi gửi
        if (!validateSemesterForm(formData)) return;

        try {
            const response = await fetch(`/admin/api/semesters/${semesterId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                editSemesterModal.style.display = 'none';
                showNotification('Cập nhật học kỳ thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi cập nhật học kỳ', 'error');
            }
        } catch (error) {
            console.error('Error updating semester:', error);
            showNotification('Lỗi khi cập nhật học kỳ', 'error');
        }
    });

    // Kiểm tra tên học kỳ đã tồn tại
    document.getElementById('addName')?.addEventListener('blur', async function () {
        const name = this.value.trim();
        if (!name) return;

        checkDuplicateSemesterName(name);
    });

    // Kiểm tra tên học kỳ đã tồn tại khi cập nhật
    document.getElementById('editName')?.addEventListener('blur', async function () {
        const name = this.value.trim();
        const semesterId = document.getElementById('editId').value;
        if (!name || !semesterId) return;

        checkDuplicateSemesterName(name, semesterId);
    });

    // Kiểm tra trùng lặp tên học kỳ
    async function checkDuplicateSemesterName(name, excludeId = null) {
        try {
            const endpoint = '/admin/api/semesters/check-duplicate';
            const url = new URL(endpoint);
            url.searchParams.append('name', name);
            if (excludeId) {
                url.searchParams.append('excludeId', excludeId);
            }

            const response = await fetch(url.toString());
            const data = await response.json();

            if (!data.success) {
                showNotification(data.message || 'Tên học kỳ đã tồn tại', 'error');
            }
        } catch (error) {
            console.error('Error checking duplicate semester name:', error);
            showNotification('Lỗi khi kiểm tra tên học kỳ', 'error');
        }
    }

    // Kiểm tra form học kỳ
    function validateSemesterForm(formData) {
        const { name, start_time, end_time } = formData;

        if (!name) {
            showNotification('Tên học kỳ không được để trống', 'error');
            return false;
        }

        if (!start_time || !end_time) {
            showNotification('Thời gian học kỳ không được để trống', 'error');
            return false;
        }

        if (new Date(start_time) >= new Date(end_time)) {
            showNotification('Thời gian bắt đầu phải trước thời gian kết thúc', 'error');
            return false;
        }

        return true;
    }

    // Hiển thị thông báo
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notificationModal.appendChild(notification);
        notificationModal.style.display = 'block';

        setTimeout(() => {
            notification.remove();
            if (!notificationModal.hasChildNodes()) {
                notificationModal.style.display = 'none';
            }
        }, 3000);
    }

    // Định dạng ngày cho input
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Khởi tạo date picker
    function initDatePickers() {
        const datePickers = document.querySelectorAll('.date-picker');
        datePickers.forEach(picker => {
            picker.type = 'date';
        });
    }
});