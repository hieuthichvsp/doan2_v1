document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewTimeModal = document.getElementById('viewTimeModal');
    const editTimeModal = document.getElementById('editTimeModal');
    const addTimeModal = document.getElementById('addTimeModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const openAddModalBtn = document.getElementById('openAddModal');

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewTimeModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editTimeModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addTimeModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewTimeModal) viewTimeModal.style.display = 'none';
        if (e.target === editTimeModal) editTimeModal.style.display = 'none';
        if (e.target === addTimeModal) addTimeModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Mở modal thêm thời gian tiết học
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            resetAddForm();
            addTimeModal.style.display = 'block';
        });
    }

    // Xử lý nút xem chi tiết thời gian tiết học
    document.querySelectorAll('.view-time-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const timeId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/times/${timeId}`);
                const data = await response.json();

                if (data.success) {
                    const time = data.time;

                    // Hiển thị loại thời gian (LT/TH)
                    const viewTimeType = document.getElementById('viewTimeType');
                    if (viewTimeType) {
                        viewTimeType.textContent = time.type === 'LT' ? 'Lý thuyết' : 'Thực hành';
                        viewTimeType.className = 'type-badge ' + (time.type === 'LT' ? 'type-lt' : 'type-th');
                    }

                    // Hiển thị thời gian bắt đầu và kết thúc
                    if (document.getElementById('viewStartTime')) {
                        document.getElementById('viewStartTime').textContent = time.start_time;
                    }

                    if (document.getElementById('viewEndTime')) {
                        document.getElementById('viewEndTime').textContent = time.end_time;
                    }

                    // Tính và hiển thị thời lượng
                    if (document.getElementById('viewDuration')) {
                        document.getElementById('viewDuration').textContent = calculateDuration(time.start_time, time.end_time);
                    }

                    // Hiển thị số lịch học
                    if (document.getElementById('viewScheduleCount')) {
                        document.getElementById('viewScheduleCount').textContent = data.scheduleCount || 0;
                    }

                    // Hiển thị danh sách lịch học sử dụng thời gian này (nếu có)
                    const scheduleList = document.getElementById('scheduleList');
                    const scheduleContainer = document.getElementById('scheduleContainer');

                    if (scheduleList && scheduleContainer && data.scheduleCount > 0) {
                        const scheduleResponse = await fetch(`/admin/api/times/${timeId}/schedules`);
                        const scheduleData = await scheduleResponse.json();

                        if (scheduleData.success && scheduleData.schedules.length > 0) {
                            let html = '';
                            scheduleData.schedules.forEach((schedule) => {
                                html += `
                                <div class="schedule-item">
                                    <span class="schedule-class">${schedule.class_name || 'N/A'}</span>
                                    <span class="schedule-subject">${schedule.subject_name || 'N/A'}</span>
                                    <span class="schedule-date">${schedule.formatted_date || 'N/A'}</span>
                                </div>
                                `;
                            });
                            scheduleList.innerHTML = html;

                            if (document.getElementById('scheduleCount')) {
                                document.getElementById('scheduleCount').textContent = scheduleData.schedules.length;
                            }

                            scheduleContainer.style.display = 'block';
                        } else {
                            scheduleContainer.style.display = 'none';
                        }
                    } else if (scheduleContainer) {
                        scheduleContainer.style.display = 'none';
                    }

                    viewTimeModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin thời gian tiết học', 'error');
                }
            } catch (error) {
                console.error('Error fetching time details:', error);
                showNotification('Lỗi khi tải thông tin thời gian tiết học', 'error');
            }
        });
    });

    // Xử lý nút chỉnh sửa thời gian tiết học
    document.querySelectorAll('.edit-time-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const timeId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/times/${timeId}`);
                const data = await response.json();

                if (data.success) {
                    const time = data.time;

                    // Điền dữ liệu vào form
                    if (document.getElementById('editId')) {
                        document.getElementById('editId').value = time.id;
                    }

                    if (document.getElementById('editStartTime')) {
                        document.getElementById('editStartTime').value = time.start_time;
                    }

                    if (document.getElementById('editEndTime')) {
                        document.getElementById('editEndTime').value = time.end_time;
                    }

                    // Chọn loại thời gian (LT/TH)
                    const editTypeSelect = document.getElementById('editType');
                    if (editTypeSelect) {
                        editTypeSelect.value = time.type;
                    }

                    // Hiển thị cảnh báo nếu thời gian này đã được sử dụng
                    const warningElement = document.getElementById('editTimeWarning');
                    if (warningElement && data.scheduleCount > 0) {
                        warningElement.style.display = 'block';
                        warningElement.textContent = `Lưu ý: Thời gian này đang được sử dụng bởi ${data.scheduleCount} lịch học.`;
                    } else if (warningElement) {
                        warningElement.style.display = 'none';
                    }

                    editTimeModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin thời gian tiết học', 'error');
                }
            } catch (error) {
                console.error('Error fetching time details for edit:', error);
                showNotification('Lỗi khi tải thông tin thời gian tiết học', 'error');
            }
        });
    });

    // Xử lý nút xóa thời gian tiết học
    document.querySelectorAll('.delete-time-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const timeId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/times/${timeId}`);
                const data = await response.json();

                if (data.success) {
                    const time = data.time;
                    document.getElementById('deleteTimeInfo').innerHTML = `
                        <p><strong>Thời gian:</strong> ${time.start_time} - ${time.end_time}</p>
                        <p><strong>Loại:</strong> ${time.type === 'LT' ? 'Lý thuyết' : 'Thực hành'}</p>
                    `;

                    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                    confirmDeleteBtn.setAttribute('data-id', timeId);

                    // Kiểm tra thời gian có đang được sử dụng không
                    const deleteWarningMessage = document.getElementById('deleteWarningMessage');

                    if (data.scheduleCount > 0) {
                        confirmDeleteBtn.disabled = true;
                        confirmDeleteBtn.classList.add('disabled');

                        if (deleteWarningMessage) {
                            deleteWarningMessage.innerHTML = `
                                <div class="warning-message">
                                    Không thể xóa thời gian tiết học này vì nó đang được sử dụng bởi ${data.scheduleCount} lịch học.
                                </div>`;
                            deleteWarningMessage.style.display = 'block';
                        }
                    } else {
                        confirmDeleteBtn.disabled = false;
                        confirmDeleteBtn.classList.remove('disabled');

                        if (deleteWarningMessage) {
                            deleteWarningMessage.style.display = 'none';
                        }
                    }

                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin thời gian tiết học', 'error');
                }
            } catch (error) {
                console.error('Error fetching time details for delete:', error);
                showNotification('Lỗi khi tải thông tin thời gian tiết học', 'error');
            }
        });
    });

    // Xử lý xác nhận xóa thời gian tiết học
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async function () {
        if (this.disabled) return;

        const timeId = this.getAttribute('data-id');
        try {
            const response = await fetch(`/admin/api/times/${timeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Xóa thời gian tiết học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                    const searchParams = new URLSearchParams(window.location.search);

                    // Kiểm tra nếu thời gian cuối cùng trên trang hiện tại bị xóa
                    const totalTimes = parseInt(document.querySelector('.pagination-info')?.textContent.match(/của (\d+)/)?.[1] || 0);
                    const timesOnCurrentPage = document.querySelectorAll('tbody tr').length;
                    const isLastTimeOnPage = timesOnCurrentPage === 1;

                    // Nếu là thời gian cuối cùng và không phải trang đầu tiên thì giảm số trang
                    if (isLastTimeOnPage && currentPage > 1 && currentPage > Math.ceil((totalTimes - 1) / 10)) {
                        searchParams.set('page', (parseInt(currentPage) - 1).toString());
                    }

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi xóa thời gian tiết học', 'error');
            }
        } catch (error) {
            console.error('Error deleting time:', error);
            showNotification('Lỗi khi xóa thời gian tiết học', 'error');
        }
    });

    // Xử lý form thêm thời gian tiết học
    document.getElementById('addTimeForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            start_time: document.getElementById('addStartTime').value,
            end_time: document.getElementById('addEndTime').value,
            type: document.getElementById('addType').value // Chỉ giữ lại các trường cần thiết
        };

        // Kiểm tra trước khi gửi
        if (!validateTimeForm(formData)) return;

        showLoading();

        try {
            const response = await fetch('/admin/api/times', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            hideLoading();
            const data = await response.json();

            if (data.success) {
                addTimeModal.style.display = 'none';
                showNotification('Thêm thời gian tiết học thành công', 'success');
                setTimeout(() => {
                    // Đặt lại trang về 1 nếu thêm thời gian mới
                    const searchParams = new URLSearchParams(window.location.search);
                    searchParams.set('page', '1');
                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi thêm thời gian tiết học', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Error adding time:', error);
            showNotification('Lỗi khi thêm thời gian tiết học', 'error');
        }
    });

    // Xử lý form chỉnh sửa thời gian tiết học
    document.getElementById('editTimeForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const timeId = document.getElementById('editId').value;
        const formData = {
            start_time: document.getElementById('editStartTime').value,
            end_time: document.getElementById('editEndTime').value,
            type: document.getElementById('editType').value // Chỉ giữ lại các trường cần thiết
        };

        // Kiểm tra trước khi gửi
        if (!validateTimeForm(formData)) return;

        showLoading();

        try {
            const response = await fetch(`/admin/api/times/${timeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            hideLoading();
            const data = await response.json();

            if (data.success) {
                editTimeModal.style.display = 'none';
                showNotification('Cập nhật thời gian tiết học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi cập nhật thời gian tiết học', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Error updating time:', error);
            showNotification('Lỗi khi cập nhật thời gian tiết học', 'error');
        }
    });

    // Kiểm tra thời gian bắt đầu và kết thúc
    document.getElementById('addEndTime')?.addEventListener('change', function () {
        validateTimeRange(
            document.getElementById('addStartTime').value,
            this.value,
            'addTimeConflict'
        );
    });

    document.getElementById('addStartTime')?.addEventListener('change', function () {
        validateTimeRange(
            this.value,
            document.getElementById('addEndTime').value,
            'addTimeConflict'
        );
    });

    document.getElementById('editEndTime')?.addEventListener('change', function () {
        validateTimeRange(
            document.getElementById('editStartTime').value,
            this.value,
            'editTimeConflict'
        );
    });

    document.getElementById('editStartTime')?.addEventListener('change', function () {
        validateTimeRange(
            this.value,
            document.getElementById('editEndTime').value,
            'editTimeConflict'
        );
    });

    /**
     * Kiểm tra và hiển thị cảnh báo khi thời gian bắt đầu >= thời gian kết thúc
     */
    function validateTimeRange(startTime, endTime, warningElementId) {
        const warningElement = document.getElementById(warningElementId);
        if (!startTime || !endTime || !warningElement) {
            if (warningElement) warningElement.style.display = 'none';
            return true;
        }

        if (startTime >= endTime) {
            warningElement.style.display = 'block';
            warningElement.textContent = 'Thời gian kết thúc phải sau thời gian bắt đầu';
            return false;
        } else {
            warningElement.style.display = 'none';
            return true;
        }
    }

    /**
     * Kiểm tra dữ liệu form thời gian tiết học
     */
    function validateTimeForm(formData) {
        let isValid = true;

        // Kiểm tra thời gian bắt đầu
        if (!formData.start_time) {
            showNotification('Vui lòng chọn thời gian bắt đầu', 'error');
            isValid = false;
        }

        // Kiểm tra thời gian kết thúc
        if (!formData.end_time) {
            showNotification('Vui lòng chọn thời gian kết thúc', 'error');
            isValid = false;
        }

        // Kiểm tra loại tiết học
        if (!formData.type) {
            showNotification('Vui lòng chọn loại tiết học', 'error');
            isValid = false;
        }

        // Kiểm tra thời gian bắt đầu phải trước thời gian kết thúc
        if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
            showNotification('Thời gian kết thúc phải sau thời gian bắt đầu', 'error');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Reset form thêm thời gian tiết học
     */
    function resetAddForm() {
        const form = document.getElementById('addTimeForm');
        if (form) {
            form.reset();

            const addTimeConflict = document.getElementById('addTimeConflict');
            if (addTimeConflict) addTimeConflict.style.display = 'none';
        }
    }

    /**
     * Hiển thị thông báo
     */
    function showNotification(message, type = 'success') {
        const notificationMessage = document.getElementById('notificationMessage');
        if (!notificationMessage || !notificationModal) return;

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

    /**
     * Hiển thị loading
     */
    function showLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }

    /**
     * Ẩn loading
     */
    function hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    /**
     * Tính thời lượng giữa thời gian bắt đầu và kết thúc
     */
    function calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 'N/A';

        try {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const diff = (end - start) / 1000 / 60; // Phút
            return `${Math.floor(diff / 60)}h ${diff % 60}m`;
        } catch (error) {
            console.error('Error calculating duration:', error);
            return 'N/A';
        }
    }

    // Mở modal xem chi tiết tiết học
    window.openViewModal = function (id) {
        showLoading();
        
        fetch(`/admin/api/times/${id}/details`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.success) {
                    const time = data.time;
                    
                    // Điền thông tin tiết học
                    document.getElementById('viewTimeId').textContent = time.id;
                    document.getElementById('viewStartTime').textContent = time.formatted_start_time;
                    document.getElementById('viewEndTime').textContent = time.formatted_end_time;
                    document.getElementById('viewType').textContent = time.type === 'LT' ? 'Lý thuyết' : 'Thực hành';
                    
                    // Hiển thị số lịch học
                    const scheduleCountElement = document.getElementById('viewScheduleCount');
                    if (scheduleCountElement) {
                        scheduleCountElement.textContent = data.scheduleCount || 0;
                    }
                    
                    // Hiển thị danh sách lịch học
                    const schedulesList = document.getElementById('viewSchedulesList');
                    if (schedulesList) {
                        if (data.schedules && data.schedules.length > 0) {
                            schedulesList.innerHTML = '';
                            data.schedules.forEach(schedule => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${schedule.weekday_formatted}</td>
                                    <td>${schedule.class_code}</td>
                                    <td>${schedule.class_name}</td>
                                    <td>${schedule.subject_name || ''}</td>
                                    <td>${schedule.classroom_name || ''}</td>
                                `;
                                schedulesList.appendChild(row);
                            });
                        } else {
                            schedulesList.innerHTML = '<tr><td colspan="5" class="no-data">Chưa có lịch học nào sử dụng tiết học này</td></tr>';
                        }
                    }
                    
                    // Hiển thị modal
                    viewTimeModal.style.display = 'block';
                } else {
                    showNotification(data.message || 'Không thể tải thông tin tiết học', false);
                }
            })
            .catch(error => {
                hideLoading();
                showNotification('Đã xảy ra lỗi khi tải thông tin tiết học', false);
                console.error('Error loading time details:', error);
            });
    }

    /**
     * Kiểm tra định dạng thời gian HH:MM 
     */
    function isValidTimeFormat(time) {
        const pattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return pattern.test(time);
    }

    /**
     * Kiểm tra và định dạng input thời gian khi người dùng nhập
     */
    function setupTimeInputValidation(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            
            // Nếu trống thì không kiểm tra
            if (!value) return;
            
            // Kiểm tra định dạng HH:MM
            if (!isValidTimeFormat(value)) {
                showNotification(`Thời gian phải có định dạng HH:MM (ví dụ: 08:30)`, 'error');
                
                // Reset giá trị nếu không hợp lệ
                this.value = '';
            }
        });
    }

    // Thiết lập kiểm tra cho các input thời gian
    setupTimeInputValidation('addStartTime');
    setupTimeInputValidation('addEndTime');
    setupTimeInputValidation('editStartTime');
    setupTimeInputValidation('editEndTime');
});