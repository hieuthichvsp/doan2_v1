document.addEventListener('DOMContentLoaded', function () {
    // Đối tượng lưu trữ dữ liệu học phần hiện tại đang xem/sửa/xóa
    let currentSessionId = null;
    let currentSessionData = null;

    // ===== MODAL ELEMENTS =====
    // Modals
    const viewModal = document.getElementById('viewClassSessionModal');
    const studentsModal = document.getElementById('studentsListModal');
    const editModal = document.getElementById('editClassSessionModal');
    const addModal = document.getElementById('addClassSessionModal');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const exportBtns = document.querySelectorAll('.export-students-btn');

    // Buttons to open modals
    const openAddBtn = document.getElementById('openAddModal');
    const viewBtns = document.querySelectorAll('.view-classsession-btn');
    const editBtns = document.querySelectorAll('.edit-classsession-btn');
    const deleteBtns = document.querySelectorAll('.delete-classsession-btn');

    // Close buttons
    const closeViewBtns = document.querySelectorAll('.close-view-btn');
    const closeStudentsBtns = document.querySelectorAll('.close-students-btn');
    const closeEditBtns = document.querySelectorAll('.close-edit-btn');
    const closeAddBtns = document.querySelectorAll('.close-add-btn');
    const closeDeleteBtns = document.querySelectorAll('.close-delete-btn');

    // Form elements
    const editForm = document.getElementById('editClassSessionForm');
    const addForm = document.getElementById('addClassSessionForm');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const viewEnrolledStudentsBtn = document.getElementById('viewEnrolledStudentsBtn');

    // Filter elements
    const typeFilter = document.getElementById('typeFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const subjectFilter = document.getElementById('subjectFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    // Biến quản lý bước
    let currentStep = 1;
    let currentEditStep = 1;

    // Biến quản lý danh sách lịch học
    let temporarySchedules = [];
    let editTemporarySchedules = [];
    let editCurrentSchedules = [];
    let editDeletedSchedules = [];

    // Biến lưu trữ danh sách thời gian
    let timeOptions = [];

    // ===== EVENT LISTENERS =====
    // Open modal events
    if (openAddBtn) openAddBtn.addEventListener('click', openAddModal);

    viewBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            openViewModal(id);
        });
    });

    editBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            openEditModal(id);
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            openDeleteModal(id);
        });
    });

    // Close modal events
    closeViewBtns.forEach(btn => btn.addEventListener('click', closeViewModal));
    closeStudentsBtns.forEach(btn => btn.addEventListener('click', closeStudentsModal));
    closeEditBtns.forEach(btn => btn.addEventListener('click', closeEditModal));
    closeAddBtns.forEach(btn => btn.addEventListener('click', closeAddModal));
    closeDeleteBtns.forEach(btn => btn.addEventListener('click', closeDeleteModal));

    // Form submission events
    if (editForm) editForm.addEventListener('submit', handleEditFormSubmit);
    if (addForm) addForm.addEventListener('submit', handleAddFormSubmit);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    if (viewEnrolledStudentsBtn) viewEnrolledStudentsBtn.addEventListener('click', loadEnrolledStudents);

    // Filter events
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

    // Close modals when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === viewModal) closeViewModal();
        if (event.target === studentsModal) closeStudentsModal();
        if (event.target === editModal) closeEditModal();
        if (event.target === addModal) closeAddModal();
        if (event.target === deleteModal) closeDeleteModal();
    });

    // Input validation for class code
    const editClassCode = document.getElementById('editClassCode');
    const addClassCode = document.getElementById('addClassCode');

    if (editClassCode) {
        editClassCode.addEventListener('blur', function () {
            validateClassCode(this.value, 'edit');
        });
    }

    if (addClassCode) {
        addClassCode.addEventListener('blur', function () {
            validateClassCode(this.value, 'add');
        });
    }

    // New button event listener
    const newBtn = document.getElementById('newBtn');
    if (newBtn) {
        newBtn.addEventListener('click', function () {
            loadEnrolledStudents(currentSessionId);
        });
    }

    // Hàm điều hướng giữa các bước thêm mới
    function goToStep(step) {
        console.log(`Going to step ${step}`);
        
        // Ẩn tất cả các bước
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Hiển thị bước được chọn
        const targetStep = document.getElementById(`step${step}-content`);
        if (targetStep) {
            targetStep.classList.add('active');
        } else {
            console.error(`Error: step${step}-content element not found`);
        }
        
        // Cập nhật chỉ báo bước
        document.querySelectorAll('.step').forEach(stepEl => {
            if (!stepEl) return;
            
            const stepNumber = parseInt(stepEl.getAttribute('data-step'));
            stepEl.classList.remove('active', 'completed');
            
            if (stepNumber === step) {
                stepEl.classList.add('active');
            } else if (stepNumber < step) {
                stepEl.classList.add('completed');
            }
        });
        
        currentStep = step;
    }

    // Bước 1 -> 2 trong thêm mới
    function goToStep2() {
        // Kiểm tra form
        const form = document.getElementById('addClassSessionForm');
        if (!form) {
            console.error('Error: addClassSessionForm element not found');
            return;
        }
        
        const formData = new FormData(form);
        
        // Kiểm tra các trường bắt buộc
        let hasEmptyFields = false;
        for (const [name, value] of formData.entries()) {
            if (name !== 'teacher_id' && !value) { // teacher_id có thể trống
                hasEmptyFields = true;
                break;
            }
        }
        
        if (hasEmptyFields) {
            const warningElement = document.getElementById('addWarning');
            if (warningElement) {
                warningElement.textContent = 'Vui lòng điền đầy đủ thông tin học phần';
                warningElement.style.display = 'block';
            }
            return;
        }
        
        // Kiểm tra cảnh báo mã học phần
        const codeWarningElement = document.getElementById('addClassCodeWarning');
        if (codeWarningElement && codeWarningElement.style.display !== 'none') {
            return; // Không cho phép tiếp tục nếu có cảnh báo mã học phần
        }
        
        // Xóa các cảnh báo trước đó
        const warningElement = document.getElementById('addWarning');
        if (warningElement) warningElement.style.display = 'none';
        
        // Chuyển đến bước 2
        goToStep(2);
    }

    // Bước 2 -> 3 trong thêm mới
    function goToStep3() {
        // Kiểm tra nếu có ít nhất một lịch học
        if (temporarySchedules.length === 0) {
            const warningElement = document.getElementById('schedule-builder-warning');
            if (warningElement) {
                warningElement.textContent = 'Vui lòng thêm ít nhất một lịch học';
                warningElement.style.display = 'block';
            }
            return;
        }

        // Xóa các cảnh báo trước đó
        const warningElement = document.getElementById('schedule-builder-warning');
        if (warningElement) {
            warningElement.style.display = 'none';
        }

        // Điền thông tin xác nhận
        fillConfirmationData();

        // Chuyển đến bước 3
        goToStep(3);
    }

    // Hàm điều hướng giữa các bước chỉnh sửa
    function goToEditStep(step) {
        console.log(`Going to edit step ${step}`);
        
        // Ẩn tất cả các bước - FIX: Thay .step-content bằng .edit-step-content
        document.querySelectorAll('.edit-step-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Hiển thị bước được chọn
        const targetStep = document.getElementById(`edit-step${step}-content`);
        if (targetStep) {
            targetStep.classList.add('active');
            console.log(`Set active class on element:`, targetStep);
        } else {
            console.error(`Error: edit-step${step}-content element not found`);
        }
        
        // Cập nhật chỉ báo bước - FIX: Thay .step bằng .edit-step
        document.querySelectorAll('.edit-step').forEach(stepEl => {
            if (!stepEl) return;
            
            const stepNumber = parseInt(stepEl.getAttribute('data-step'));
            stepEl.classList.remove('active', 'completed');
            
            if (stepNumber === step) {
                stepEl.classList.add('active');
            } else if (stepNumber < step) {
                stepEl.classList.add('completed');
            }
        });
        
        currentEditStep = step;
    }

    // Bước 1 -> 2 trong chỉnh sửa
    function goToEditStep2() {
        console.log('Executing goToEditStep2()');
        
        // Kiểm tra form
        const form = document.getElementById('editClassSessionForm');
        if (!form) {
            console.error('Error: editClassSessionForm element not found');
            return;
        }
        
        const formData = new FormData(form);
        
        // Kiểm tra các trường bắt buộc
        let hasEmptyFields = false;
        for (const [name, value] of formData.entries()) {
            if (name !== 'teacher_id' && !value) { // teacher_id có thể trống
                hasEmptyFields = true;
                break;
            }
        }
        
        if (hasEmptyFields) {
            const warningElement = document.getElementById('editWarning');
            if (warningElement) {
                warningElement.textContent = 'Vui lòng điền đầy đủ thông tin học phần';
                warningElement.style.display = 'block';
            }
            return;
        }
        
        // Kiểm tra cảnh báo mã học phần
        const codeWarningElement = document.getElementById('editClassCodeWarning');
        if (codeWarningElement && codeWarningElement.style.display !== 'none') {
            return; // Không cho phép tiếp tục nếu có cảnh báo mã học phần
        }
        
        // Xóa các cảnh báo trước đó
        const warningElement = document.getElementById('editWarning');
        if (warningElement) warningElement.style.display = 'none';
        
        // Chuyển đến bước 2 - sửa dòng này
        goToEditStep(2);  // Thay thế goToStep(2) bằng goToEditStep(2)
    }

    // Bước 2 -> 3 trong chỉnh sửa
    function goToEditStep3() {
        // Kiểm tra nếu có ít nhất một lịch học
        if (editTemporarySchedules.length === 0) {
            const warningElement = document.getElementById('edit-schedule-builder-warning');
            if (warningElement) {
                warningElement.textContent = 'Vui lòng thêm ít nhất một lịch học';
                warningElement.style.display = 'block';
            }
            return;
        }

        // Xóa các cảnh báo trước đó
        const warningElement = document.getElementById('edit-schedule-builder-warning');
        if (warningElement) {
            warningElement.style.display = 'none';
        }

        // Điền thông tin xác nhận
        fillEditConfirmationData();

        // Chuyển đến bước 3 - SỬA DÒNG NÀY
        goToEditStep(3);  // Thay thế goToStep(3) bằng goToEditStep(3)
    }

    // ===== MODAL FUNCTIONS =====
    // View modal
    function openViewModal(id) {
        currentSessionId = id;
        loadSessionDetails(id);
        viewModal.style.display = 'block';
    }

    function closeViewModal() {
        viewModal.style.display = 'none';
        currentSessionId = null;
        currentSessionData = null;
    }

    // Students modal
    function openStudentsModal() {
        studentsModal.style.display = 'block';
    }

    function closeStudentsModal() {
        studentsModal.style.display = 'none';
    }

    // Edit modal
    function openEditModal(id) {
        currentSessionId = id;
        loadSessionForEdit(id);
        
        // Reset về bước 1 và hiển thị nội dung bước 1
        currentEditStep = 1;
        
        // Tải danh sách thời gian nếu chưa có
        if (timeOptions.length === 0) {
            loadTimeOptions();
        }
        
        // Hiện modal
        editModal.style.display = 'block';
        
        // Đảm bảo hiển thị bước đầu tiên đúng cách
        setTimeout(() => {
            goToEditStep(1); 
            console.log("Opened edit modal, showing step 1");
        }, 100);
    }

    function closeEditModal() {
        editModal.style.display = 'none';
        editForm.reset();
        document.getElementById('editWarning').style.display = 'none';
        document.getElementById('editClassCodeWarning').style.display = 'none';
        currentSessionId = null;
        currentSessionData = null;
    }

    // Add modal
    function openAddModal() {
        // Reset form
        const addForm = document.getElementById('addClassSessionForm');
        if (addForm) addForm.reset();
        
        // Reset danh sách lịch học
        temporarySchedules = [];
        updateSchedulesList();
        
        // Reset các warnings
        document.getElementById('addWarning').style.display = 'none';
        document.getElementById('addClassCodeWarning').style.display = 'none';
        document.getElementById('schedule-builder-warning').style.display = 'none';
        document.getElementById('confirmWarning').style.display = 'none';
        
        // Reset về bước 1
        currentStep = 1;
        goToStep(1);
        
        // Hiển thị modal
        if (addModal) addModal.style.display = 'block';
        
        // Tải danh sách thời gian nếu chưa có
        if (timeOptions.length === 0) {
            loadTimeOptions();
        }
    }

    function closeAddModal() {
        if (addModal) addModal.style.display = 'none';
        
        // Reset form
        const addForm = document.getElementById('addClassSessionForm');
        if (addForm) addForm.reset();
        
        // Reset danh sách lịch học
        temporarySchedules = [];
        
        // Reset các warnings
        document.getElementById('addWarning').style.display = 'none';
        document.getElementById('addClassCodeWarning').style.display = 'none';
        document.getElementById('schedule-builder-warning').style.display = 'none';
        document.getElementById('confirmWarning').style.display = 'none';
    }

    // Delete modal
    function openDeleteModal(id) {
        currentSessionId = id;
        loadSessionForDelete(id);
        deleteModal.style.display = 'block';
    }

    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        document.getElementById('deleteWarningMessage').style.display = 'none';
        currentSessionId = null;
        currentSessionData = null;
    }

    // ===== DATA LOADING FUNCTIONS =====
    // Load class session details for view modal
    function loadSessionDetails(id) {
        showLoading();

        fetch(`/admin/api/classsessions/${id}`)
            .then(response => {
                hideLoading();
                if (!response.ok) {
                    throw new Error('Không thể tải thông tin học phần');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    currentSessionData = data.classSession;

                    // Điền thông tin cơ bản
                    document.getElementById('viewClassCode').textContent = data.classSession.class_code;
                    document.getElementById('viewName').textContent = data.classSession.name;

                    // Loại học phần
                    const typeElement = document.getElementById('viewType');
                    typeElement.textContent = data.classSession.type === 'LT' ? 'LT' : 'TH';
                    typeElement.className = `type-badge ${data.classSession.type === 'LT' ? 'type-lt' : 'type-th'}`;

                    // Thông tin liên quan
                    document.getElementById('viewSubject').textContent = data.classSession.subject ? data.classSession.subject.name : 'N/A';
                    document.getElementById('viewSemester').textContent = data.classSession.semester ? data.classSession.semester.name : 'N/A';
                    document.getElementById('viewClass').textContent = data.classSession.class ? data.classSession.class.name : 'N/A';
                    document.getElementById('viewTeacher').textContent = data.classSession.teacher ? data.classSession.teacher.name : 'Chưa phân công';

                    // Thông tin sĩ số
                    document.getElementById('viewCapacity').textContent = data.classSession.capacity;
                    document.getElementById('viewEnrollmentCount').textContent = data.classSession.enrollmentCount;
                    document.getElementById('viewRemainingSlots').textContent = data.classSession.remainingSlots;
                    document.getElementById('viewAttendanceCount').textContent = data.classSession.attendanceCount || 0;

                    // Hiển thị lịch học
                    const scheduleList = document.getElementById('scheduleList');
                    scheduleList.innerHTML = '';
                    document.getElementById('scheduleCount').textContent = data.classSession.schedules ? data.classSession.schedules.length : 0;

                    if (data.classSession.schedules && data.classSession.schedules.length > 0) {
                        data.classSession.schedules.forEach(schedule => {
                            const scheduleItem = document.createElement('div');
                            scheduleItem.className = 'schedule-item';

                            // Lấy thông tin thời gian từ đối tượng time nếu có
                            const startTime = schedule.time ? schedule.time.start_time : 'N/A';
                            const endTime = schedule.time ? schedule.time.end_time : 'N/A';

                            // Hiển thị ngày trong tuần dựa vào trường weekday mà không sử dụng date
                            const weekdayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                            const weekday = schedule.weekday >= 0 && schedule.weekday < weekdayNames.length ?
                                weekdayNames[schedule.weekday] : 'N/A';

                            // Hiển thị thông tin lịch học không sử dụng date và classroom
                            scheduleItem.innerHTML = `
                                <div class="schedule-time"><i class="far fa-clock"></i> ${startTime} - ${endTime}</div>
                                <div class="schedule-date"><i class="far fa-calendar-alt"></i> ${weekday}</div>
                                <div class="schedule-room"><i class="fas fa-map-marker-alt"></i> Phòng học: ${data.classSession.class.name || 'Chưa xác định'}</div>
                            `;

                            scheduleList.appendChild(scheduleItem);
                        });
                    } else {
                        const noSchedule = document.createElement('p');
                        noSchedule.textContent = 'Chưa có lịch học nào được đăng ký';
                        noSchedule.style.fontStyle = 'italic';
                        noSchedule.style.color = '#777';
                        scheduleList.appendChild(noSchedule);
                    }

                    // Thêm event listener cho nút xem danh sách sinh viên sau khi modal đã được hiển thị
                    const viewEnrolledStudentsBtn = document.getElementById('viewEnrolledStudentsBtn');
                    if (viewEnrolledStudentsBtn) {
                        // Xóa tất cả event listeners cũ để tránh trùng lặp
                        const newBtn = viewEnrolledStudentsBtn.cloneNode(true);
                        viewEnrolledStudentsBtn.parentNode.replaceChild(newBtn, viewEnrolledStudentsBtn);

                        newBtn.addEventListener('click', function () {
                            console.log('Loading enrolled students for session ID:', currentSessionId);
                            loadEnrolledStudents();
                        });
                    }
                } else {
                    showNotification('Không thể tải thông tin học phần', false);
                }
            })
            .catch(error => {
                hideLoading();
                showNotification('Đã xảy ra lỗi khi tải thông tin học phần', false);
                console.error('Error loading session details:', error);
            });
    }

    // Load enrolled students for a class session
    function loadEnrolledStudents(id) {
        const sessionId = id || currentSessionId;
        if (!sessionId) {
            console.error('No session ID provided');
            return;
        }

        showLoading();
        closeViewModal();
        openStudentsModal();
        console.log('Loading enrolled students for session ID:', sessionId);
        
        // Đảm bảo lưu sessionId vào biến toàn cục
        currentSessionId = sessionId;

        fetch(`/admin/api/classsessions/${sessionId}/students`)
            .then(response => {
                hideLoading();
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách sinh viên');
                }
                return response.json();
            })
            .then(data => {
                const studentsList = document.getElementById('studentsList');
                studentsList.innerHTML = '';

                // Debug để xem cấu trúc dữ liệu trả về
                console.log('Student data received:', data);
                
                // Cập nhật tiêu đề modal nếu có thông tin session
                if (data.classSession) {
                    const modalTitle = document.querySelector('#studentsListModal .modal-header h3');
                    if (modalTitle) {
                        modalTitle.textContent = `Danh sách sinh viên - ${data.classSession.class_code} - ${data.classSession.name}`;
                    }
                }

                if (data.success && data.students && data.students.length > 0) {
                    data.students.forEach((student, index) => {
                        const row = document.createElement('tr');
                        // Sử dụng student.user_code nếu student_id không tồn tại
                        const studentId = student.student_id || student.user_code || 'N/A';
                        row.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${studentId}</td>
                            <td>${student.name || 'N/A'}</td>
                            <td>${student.email || 'N/A'}</td>
                        `;
                        studentsList.appendChild(row);
                    });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="4" class="no-results">Chưa có sinh viên nào đăng ký</td>';
                    studentsList.appendChild(row);
                }
            })
            .catch(error => {
                hideLoading();
                showNotification('Đã xảy ra lỗi khi tải danh sách sinh viên', false);
                console.error('Error loading enrolled students:', error);
            });
    }

    // Load class session data for edit modal
    function loadSessionForEdit(id) {
        showLoading();

        fetch(`/admin/api/classsessions/${id}`)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    currentSessionData = data.classSession;

                    // Điền form với dữ liệu
                    document.getElementById('editId').value = data.classSession.id;
                    document.getElementById('editClassCode').value = data.classSession.class_code;
                    document.getElementById('editName').value = data.classSession.name;
                    document.getElementById('editType').value = data.classSession.type;
                    document.getElementById('editSubject').value = data.classSession.sub_id || '';
                    document.getElementById('editSemester').value = data.classSession.semester_id || '';
                    document.getElementById('editClass').value = data.classSession.class_id || '';
                    document.getElementById('editCapacity').value = data.classSession.capacity;
                    document.getElementById('editTeacher').value = data.classSession.teacher_id || '';

                    // Kiểm tra nếu sĩ số nhỏ hơn số sinh viên đã đăng ký
                    if (data.enrollmentCount > 0) {
                        const minCapacity = document.getElementById('editCapacity');
                        minCapacity.min = data.enrollmentCount;
                        minCapacity.setAttribute('data-enrolled', data.enrollmentCount);

                        const warningDiv = document.getElementById('editWarning');
                        warningDiv.innerHTML = `<strong>Lưu ý:</strong> Đã có ${data.enrollmentCount} sinh viên đăng ký học phần này. 
                            Sĩ số không thể nhỏ hơn số lượng này.`;
                        warningDiv.style.display = 'block';
                    }

                    // Xử lý lịch học
                    editTemporarySchedules = [];
                    editDeletedSchedules = [];
                    
                    if (data.classSession.schedules && data.classSession.schedules.length > 0) {
                        data.classSession.schedules.forEach(schedule => {
                            const weekdayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                            const weekdayText = weekdayNames[schedule.weekday] || 'N/A';
                            
                            editTemporarySchedules.push({
                                id: schedule.id,
                                weekday: schedule.weekday,
                                id_time: schedule.time ? schedule.time.id : null,
                                weekdayText: weekdayText,
                                timeText: schedule.time ? `${schedule.time.start_time} - ${schedule.time.end_time}` : 'N/A',
                                type: schedule.time ? schedule.time.type : ''
                            });
                        });
                        
                        // Cập nhật danh sách lịch học trong UI - đảm bảo bạn gọi hàm này
                        updateEditSchedulesList();
                        console.log('Loaded schedules:', editTemporarySchedules.length);
                    }
                    
                    // Đảm bảo hiển thị bước 1
                    goToEditStep(1);
                    console.log('Loaded session data, showing edit step 1');
                } else {
                    closeEditModal();
                    showNotification('Không thể tải thông tin học phần', false);
                }
            })
            .catch(error => {
                hideLoading();
                closeEditModal();
                showNotification('Đã xảy ra lỗi khi tải thông tin học phần', false);
                console.error('Error loading session for edit:', error);
            });
    }

    // Load class session data for delete confirmation
    function loadSessionForDelete(id) {
        showLoading();

        fetch(`/admin/api/classsessions/${id}`)
            .then(response => {
                hideLoading();
                if (!response.ok) {
                    throw new Error('Không thể tải thông tin học phần');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    currentSessionData = data.classSession;

                    // Hiển thị thông tin học phần sắp xóa
                    const infoDiv = document.getElementById('deleteClassSessionInfo');
                    infoDiv.innerHTML = `
                        <p><strong>Mã học phần:</strong> ${data.classSession.class_code}</p>
                        <p><strong>Tên học phần:</strong> ${data.classSession.name}</p>
                        <p><strong>Môn học:</strong> ${data.classSession.subject ? data.classSession.subject.name : 'N/A'}</p>
                    `;

                    // Kiểm tra nếu có sinh viên đăng ký hoặc đã có điểm danh
                    const warningDiv = document.getElementById('deleteWarningMessage');
                    if (data.enrollmentCount > 0 || data.attendanceCount > 0) {
                        let warningText = '<strong>Cảnh báo:</strong> ';

                        if (data.enrollmentCount > 0) {
                            warningText += `Có ${data.enrollmentCount} sinh viên đã đăng ký học phần này. `;
                        }

                        if (data.attendanceCount > 0) {
                            warningText += `Đã có ${data.attendanceCount} buổi điểm danh được tạo. `;
                        }

                        warningText += 'Việc xóa học phần sẽ xóa tất cả dữ liệu liên quan.';

                        warningDiv.innerHTML = warningText;
                        warningDiv.className = 'warning-message error';
                        warningDiv.style.display = 'block';
                    } else {
                        warningDiv.style.display = 'none';
                    }
                } else {
                    closeDeleteModal();
                    showNotification('Không thể tải thông tin học phần', false);
                }
            })
            .catch(error => {
                hideLoading();
                closeDeleteModal();
                showNotification('Đã xảy ra lỗi khi tải thông tin học phần', false);
                console.error('Error loading session for delete:', error);
            });
    }

    // ===== FORM HANDLING =====
    // Edit form submit
    function handleEditFormSubmit(e) {
        e.preventDefault();

        // Validation
        const editCapacity = document.getElementById('editCapacity');
        const enrolledCount = parseInt(editCapacity.getAttribute('data-enrolled') || 0);

        if (parseInt(editCapacity.value) < enrolledCount) {
            const warningDiv = document.getElementById('editWarning');
            warningDiv.innerHTML = `<strong>Lỗi:</strong> Sĩ số không thể nhỏ hơn số sinh viên đã đăng ký (${enrolledCount}).`;
            warningDiv.style.display = 'block';
            return;
        }

        // Form data
        const formData = new FormData(editForm);
        const sessionData = {
            id: document.getElementById('editId').value,
            class_code: formData.get('class_code'),
            name: formData.get('name'),
            type: formData.get('type'),
            sub_id: formData.get('sub_id'),
            semester_id: formData.get('semester_id'),
            class_id: formData.get('class_id'),
            capacity: formData.get('capacity'),
            teacher_id: formData.get('teacher_id') || null
        };

        showLoading();

        fetch(`/admin/api/classsessions/${currentSessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        })
            .then(response => {
                hideLoading();
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    closeEditModal();
                    showNotification('Cập nhật học phần thành công', true);

                    // Reload page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    const warningDiv = document.getElementById('editWarning');
                    warningDiv.textContent = data.message || 'Có lỗi xảy ra khi cập nhật học phần';
                    warningDiv.className = 'warning-message error';
                    warningDiv.style.display = 'block';
                }
            })
            .catch(error => {
                hideLoading();
                const warningDiv = document.getElementById('editWarning');
                warningDiv.textContent = 'Có lỗi xảy ra khi cập nhật học phần';
                warningDiv.className = 'warning-message error';
                warningDiv.style.display = 'block';
                console.error('Error updating class session:', error);
            });
    }

    // Add form submit
    function handleAddFormSubmit(e) {
        e.preventDefault();

        // Form data
        const formData = new FormData(addForm);
        const sessionData = {
            class_code: formData.get('class_code'),
            name: formData.get('name'),
            type: formData.get('type'),
            sub_id: formData.get('sub_id'),
            semester_id: formData.get('semester_id'),
            class_id: formData.get('class_id'),
            capacity: formData.get('capacity'),
            teacher_id: formData.get('teacher_id') || null
        };

        showLoading();

        fetch('/admin/api/classsessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        })
            .then(response => {
                hideLoading();
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    closeAddModal();
                    showNotification('Thêm học phần thành công', true);

                    // Reload page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    const warningDiv = document.getElementById('addWarning');
                    warningDiv.textContent = data.message || 'Có lỗi xảy ra khi thêm học phần';
                    warningDiv.className = 'warning-message error';
                    warningDiv.style.display = 'block';
                }
            })
            .catch(error => {
                hideLoading();
                const warningDiv = document.getElementById('addWarning');
                warningDiv.textContent = 'Có lỗi xảy ra khi thêm học phần';
                warningDiv.className = 'warning-message error';
                warningDiv.style.display = 'block';
                console.error('Error adding class session:', error);
            });
    }

    // Delete confirmation
    function handleDeleteConfirm() {
        if (!currentSessionId) return;

        showLoading();

        fetch(`/admin/api/classsessions/${currentSessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            // Thêm tham số để yêu cầu xóa cả lịch học liên quan
            body: JSON.stringify({ deleteRelatedSchedules: true })
        })
            .then(response => {
                hideLoading();
                return response.json();
            })
            .then(data => {
                closeDeleteModal();

                if (data.success) {
                    showNotification('Xóa học phần thành công', true);

                    // Reload page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showNotification(data.message || 'Có lỗi xảy ra khi xóa học phần', false);
                }
            })
            .catch(error => {
                hideLoading();
                closeDeleteModal();
                showNotification('Đã xảy ra lỗi khi xóa học phần', false);
                console.error('Error deleting class session:', error);
            });
    }

    // ===== FILTER FUNCTIONS =====
    function applyFilters() {
        const type = typeFilter ? typeFilter.value : '';
        const semester = semesterFilter ? semesterFilter.value : '';
        const subject = subjectFilter ? subjectFilter.value : '';

        // Build query string
        let queryParams = [];
        if (type) queryParams.push(`type=${type}`);
        if (semester) queryParams.push(`semester=${semester}`);
        if (subject) queryParams.push(`subject=${subject}`);

        // Get current search term if any
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        if (searchTerm) queryParams.push(`search=${searchTerm}`);

        // Debug
        console.log('Applying filters with params:', queryParams.join('&'));

        // Redirect to filtered URL
        window.location.href = `/admin/classsessionManagement?${queryParams.join('&')}`;
    }

    function resetFilters() {
        // Get current search term if any
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');

        // Redirect with only search term if present
        if (searchTerm) {
            window.location.href = `/admin/classsessionManagement?search=${searchTerm}`;
        } else {
            window.location.href = '/admin/classsessionManagement';
        }
    }

    // ===== UTILITY FUNCTIONS =====
    // Validate class code to be unique
    function validateClassCode(code, mode) {
        if (!code) return;

        // If editing and code hasn't changed, no need to validate
        if (mode === 'edit' && currentSessionData && code === currentSessionData.class_code) {
            document.getElementById('editClassCodeWarning').style.display = 'none';
            return;
        }

        fetch(`/admin/api/classsessions/check-code?code=${code}`)
            .then(response => response.json())
            .then(data => {
                const warningElement = document.getElementById(`${mode}ClassCodeWarning`);

                if (data.exists) {
                    warningElement.textContent = 'Mã học phần đã tồn tại';
                    warningElement.style.display = 'block';
                    document.getElementById(`${mode}ClassCode`).classList.add('error');
                } else {
                    warningElement.style.display = 'none';
                    document.getElementById(`${mode}ClassCode`).classList.remove('error');
                }
            })
            .catch(error => {
                console.error('Error validating class code:', error);
            });
    }

    // Show notification
    function showNotification(message, isSuccess) {
        const notificationElement = document.getElementById('notificationModal');
        const messageElement = document.getElementById('notificationMessage');

        messageElement.textContent = message;

        // Set correct styling based on success/error
        if (isSuccess) {
            notificationElement.classList.add('success');
            notificationElement.classList.remove('error');
        } else {
            notificationElement.classList.add('error');
            notificationElement.classList.remove('success');
        }

        // Show notification
        notificationElement.style.display = 'block';

        // Set automatic hiding
        setTimeout(() => {
            notificationElement.classList.add('fade-out');

            setTimeout(() => {
                notificationElement.style.display = 'none';
                notificationElement.classList.remove('fade-out');
            }, 500);
        }, 3000);
    }

    // Loading overlay
    function showLoading() {
        loadingOverlay.classList.add('show');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('show');
    }

    // ===== INITIALIZE CAPACITY BARS =====
    function initializeCapacityBars() {
        const capacityBars = document.querySelectorAll('.capacity-bar');

        capacityBars.forEach(bar => {
            const text = bar.querySelector('span').textContent;
            const [enrolled, capacity] = text.split('/').map(num => parseInt(num.trim()));
            const percentage = Math.min(100, (enrolled / capacity) * 100);

            // Tạo filled-capacity div nếu chưa có
            let filledBar = bar.querySelector('.filled-capacity');
            if (!filledBar) {
                filledBar = document.createElement('div');
                filledBar.className = 'filled-capacity';
                bar.insertBefore(filledBar, bar.firstChild);
            }

            // Set width
            filledBar.style.width = `${percentage}%`;

            // Set color based on percentage
            if (percentage >= 90) {
                filledBar.style.backgroundColor = '#ff5c5c'; // Red when almost full
            } else if (percentage >= 70) {
                filledBar.style.backgroundColor = '#ffa928'; // Orange when getting full
            } else {
                filledBar.style.backgroundColor = '#3399FF'; // Default blue
            }
        });
    }

    // Initialize capacity bars on page load
    initializeCapacityBars();

    // Điền dữ liệu vào bước xác nhận (thêm mới)
    function fillConfirmationData() {
        const form = document.getElementById('addClassSessionForm');
        if (!form) {
            console.error('Add form not found');
            return;
        }
        
        const formData = new FormData(form);

        // Điền thông tin cơ bản
        const confirmElements = {
            'class-code': formData.get('class_code') || '',
            'name': formData.get('name') || '',
            'type': formData.get('type') === 'LT' ? 'Lý thuyết (LT)' : 'Thực hành (TH)',
            'capacity': formData.get('capacity') || ''
        };
        
        Object.keys(confirmElements).forEach(key => {
            const element = document.getElementById(`confirm-${key}`);
            if (element) {
                element.textContent = confirmElements[key];
            }
        });
        
        // Các select box
        const subjectSelect = document.getElementById('addSubject');
        const semesterSelect = document.getElementById('addSemester');
        const classSelect = document.getElementById('addClass');
        const teacherSelect = document.getElementById('addTeacher');
        
        if (subjectSelect) {
            const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
            const element = document.getElementById('confirm-subject');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (semesterSelect) {
            const selectedOption = semesterSelect.options[semesterSelect.selectedIndex];
            const element = document.getElementById('confirm-semester');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (classSelect) {
            const selectedOption = classSelect.options[classSelect.selectedIndex];
            const element = document.getElementById('confirm-class');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (teacherSelect) {
            const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
            const element = document.getElementById('confirm-teacher');
            if (element) element.textContent = selectedOption && selectedOption.value ? selectedOption.text : 'Chưa phân công';
        }

        // Điền lịch học
        const scheduleCountElement = document.getElementById('confirm-schedule-count');
        if (scheduleCountElement) {
            scheduleCountElement.textContent = temporarySchedules.length;
        }

        const schedulesList = document.getElementById('confirm-schedules');
        if (schedulesList) {
            schedulesList.innerHTML = '';

            temporarySchedules.forEach(schedule => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${schedule.weekdayText}</strong>: ${schedule.timeText}`;
                schedulesList.appendChild(li);
            });
        }
    }

    // Điền dữ liệu vào bước xác nhận (chỉnh sửa)
    function fillEditConfirmationData() {
        const form = document.getElementById('editClassSessionForm');
        if (!form) {
            console.error('Edit form not found');
            return;
        }
        
        const formData = new FormData(form);

        // Điền thông tin cơ bản
        const confirmElements = {
            'class-code': formData.get('class_code') || '',
            'name': formData.get('name') || '',
            'type': formData.get('type') === 'LT' ? 'Lý thuyết (LT)' : 'Thực hành (TH)',
            'capacity': formData.get('capacity') || ''
        };
        
        Object.keys(confirmElements).forEach(key => {
            const element = document.getElementById(`edit-confirm-${key}`);
            if (element) {
                element.textContent = confirmElements[key];
            }
        });
        
        // Các select box
        const subjectSelect = document.getElementById('editSubject');
        const semesterSelect = document.getElementById('editSemester');
        const classSelect = document.getElementById('editClass');
        const teacherSelect = document.getElementById('editTeacher');
        
        if (subjectSelect) {
            const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
            const element = document.getElementById('edit-confirm-subject');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (semesterSelect) {
            const selectedOption = semesterSelect.options[semesterSelect.selectedIndex];
            const element = document.getElementById('edit-confirm-semester');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (classSelect) {
            const selectedOption = classSelect.options[classSelect.selectedIndex];
            const element = document.getElementById('edit-confirm-class');
            if (element) element.textContent = selectedOption ? selectedOption.text : '';
        }
        
        if (teacherSelect) {
            const selectedOption = teacherSelect.options[teacherSelect.selectedIndex];
            const element = document.getElementById('edit-confirm-teacher');
            if (element) element.textContent = selectedOption && selectedOption.value ? selectedOption.text : 'Chưa phân công';
        }

        // Điền lịch học
        const scheduleCountElement = document.getElementById('edit-confirm-schedule-count');
        if (scheduleCountElement) {
            scheduleCountElement.textContent = editTemporarySchedules.length;
        }

        const schedulesList = document.getElementById('edit-confirm-schedules');
        if (schedulesList) {
            schedulesList.innerHTML = '';

            editTemporarySchedules.forEach(schedule => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${schedule.weekdayText}</strong>: ${schedule.timeText}`;
                schedulesList.appendChild(li);
            });
        }
    }

    // Tải các tùy chọn thời gian
    function loadTimeOptions(callback) {
        console.log('Loading time options...');
        
        fetch('/admin/api/times')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    timeOptions = data.times;
                    console.log('Successfully loaded time options:', timeOptions.length);
                    populateTimeSelect(); // Cập nhật select trong modal thêm mới
                    
                    // Nếu đang mở modal thêm lịch học của chỉnh sửa, cập nhật nó
                    const editScheduleModal = document.getElementById('editScheduleModal');
                    if (editScheduleModal && editScheduleModal.style.display === 'block') {
                        const sessionType = document.getElementById('editType').value;
                        populateEditTimeSelect(sessionType);
                    }
                    
                    // Gọi callback nếu có
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    console.error('Error loading time options:', data.message);
                }
            })
            .catch(error => {
                console.error('Error loading time options:', error);
            });
    }

    // Điền các tùy chọn thời gian vào select
    function populateTimeSelect() {
        const selectElement = document.getElementById('scheduleTime');
        if (!selectElement) return;
        
        // Xóa các options hiện tại
        while (selectElement.firstChild) {
            selectElement.removeChild(selectElement.firstChild);
        }
        
        // Thêm option mặc định
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Chọn khung giờ --';
        selectElement.appendChild(defaultOption);
        
        // Thêm các options từ timeOptions
        timeOptions.forEach(time => {
            const option = document.createElement('option');
            option.value = time.id;
            option.textContent = `${time.start_time} - ${time.end_time} (${time.type})`;
            selectElement.appendChild(option);
        });
    }

    // Lọc khung giờ theo loại học phần (LT hoặc TH)
    function filterTimeOptionsByType(type) {
        const selectElement = document.getElementById('scheduleTime');
        if (!selectElement) return;
        
        // Xóa các options hiện tại
        while (selectElement.firstChild) {
            selectElement.removeChild(selectElement.firstChild);
        }
        
        // Thêm option mặc định
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Chọn khung giờ --';
        selectElement.appendChild(defaultOption);
        
        // Lọc và thêm options phù hợp với loại học phần
        timeOptions.filter(time => !type || time.type === type).forEach(time => {
            const option = document.createElement('option');
            option.value = time.id;
            option.textContent = `${time.start_time} - ${time.end_time} (${time.type})`;
            selectElement.appendChild(option);
        });
    }

    // Thêm lịch học mới
    function addSchedule() {
        const weekday = parseInt(document.getElementById('scheduleWeekday').value);
        const timeId = parseInt(document.getElementById('scheduleTime').value);
        
        if (isNaN(weekday) || isNaN(timeId)) {
            document.getElementById('schedule-conflict-warning').textContent = 'Vui lòng chọn thứ và khung giờ';
            document.getElementById('schedule-conflict-warning').style.display = 'block';
            return;
        }
        
        // Kiểm tra trùng lặp
        const isDuplicate = temporarySchedules.some(schedule => 
            schedule.weekday === weekday && schedule.id_time === timeId
        );
        
        if (isDuplicate) {
            document.getElementById('schedule-conflict-warning').textContent = 'Lịch học này đã được thêm';
            document.getElementById('schedule-conflict-warning').style.display = 'block';
            return;
        }
        
        // Lấy thông tin khung giờ và tên thứ
        const selectedTime = timeOptions.find(time => time.id === timeId);
        const weekdayText = getWeekdayText(weekday);
        const timeText = selectedTime ? `${selectedTime.start_time} - ${selectedTime.end_time}` : '';
        
        // Thêm vào danh sách tạm thời
        temporarySchedules.push({
            weekday,
            id_time: timeId,
            weekdayText,
            timeText,
            type: selectedTime ? selectedTime.type : ''
        });
        
        // Cập nhật giao diện
        updateSchedulesList();
        
        // Đóng modal thêm lịch học
        closeAddScheduleModal();
    }

    // Cập nhật danh sách lịch học (thêm mới)
    function updateSchedulesList() {
        const schedulesList = document.getElementById('added-schedules-list');
        const noSchedulesMessage = document.getElementById('no-schedules-message');
        
        if (!schedulesList || !noSchedulesMessage) return;
        
        if (temporarySchedules.length > 0) {
            schedulesList.innerHTML = '';
            noSchedulesMessage.style.display = 'none';
            
            temporarySchedules.forEach((schedule, index) => {
                const li = document.createElement('li');
                li.className = 'schedule-item';
                li.innerHTML = `
                    <div class="schedule-item-info">
                        <span class="schedule-item-weekday">${schedule.weekdayText}</span>
                        <span class="schedule-item-time">${schedule.timeText}</span>
                    </div>
                    <div class="schedule-item-actions">
                        <i class="fas fa-trash delete-schedule-btn" data-index="${index}"></i>
                    </div>
                `;
                schedulesList.appendChild(li);
                
                // Thêm sự kiện xóa
                const deleteBtn = li.querySelector('.delete-schedule-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        temporarySchedules.splice(index, 1);
                        updateSchedulesList();
                    });
                }
            });
        } else {
            schedulesList.innerHTML = '';
            noSchedulesMessage.style.display = 'block';
        }
    }

    // Cập nhật danh sách lịch học (chỉnh sửa)
    function updateEditSchedulesList() {
        console.log('Updating edit schedules list:', editTemporarySchedules);
        
        const schedulesList = document.getElementById('edit-schedule-list');
        const noSchedulesMessage = document.getElementById('edit-no-schedules-message');
        
        if (!schedulesList || !noSchedulesMessage) {
            console.error('Cannot find edit schedule list elements:', 
                !!schedulesList, !!noSchedulesMessage);
            return;
        }

        if (editTemporarySchedules && editTemporarySchedules.length > 0) {
            // Clear existing content
            schedulesList.innerHTML = '';
            noSchedulesMessage.style.display = 'none';

            // Add each schedule to the list
            editTemporarySchedules.forEach((schedule, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${schedule.weekdayText}</td>
                    <td>${schedule.timeText}</td>
                    <td>${schedule.type === 'LT' ? 'Lý thuyết' : 'Thực hành'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-edit-schedule-btn" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                schedulesList.appendChild(tr);
                
                // Add event for the delete button
                const deleteBtn = tr.querySelector('.delete-edit-schedule-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        
                        // If this is an existing schedule (has ID), add to deleted list
                        if (editTemporarySchedules[index] && editTemporarySchedules[index].id) {
                            editDeletedSchedules.push({...editTemporarySchedules[index]});
                        }
                        
                        // Remove from temporary list
                        editTemporarySchedules.splice(index, 1);
                        updateEditSchedulesList();
                    });
                }
            });
        } else {
            schedulesList.innerHTML = '';
            noSchedulesMessage.style.display = 'block';
        }
    }

    // Lấy text cho thứ trong tuần
    function getWeekdayText(weekday) {
        const weekdays = {
            0: 'Chủ nhật',
            1: 'Thứ hai',
            2: 'Thứ ba',
            3: 'Thứ tư',
            4: 'Thứ năm',
            5: 'Thứ sáu',
            6: 'Thứ bảy'
        };
        
        return weekdays[weekday] || 'N/A';
    }

    // Lấy text cho khung giờ
    function getTimeText(timeId) {
        const time = timeOptions.find(t => t.id === timeId);
        return time ? `${time.start_time} - ${time.end_time}` : 'N/A';
    }

    // Lưu học phần mới
    function saveClassSession() {
        // Lấy dữ liệu form
        const form = document.getElementById('addClassSessionForm');
        const formData = new FormData(form);

        // Tạo object học phần
        const classSessionData = {
            class_code: formData.get('class_code'),
            name: formData.get('name'),
            type: formData.get('type'),
            sub_id: formData.get('sub_id'),
            semester_id: formData.get('semester_id'),
            class_id: formData.get('class_id'),
            capacity: formData.get('capacity'),
            teacher_id: formData.get('teacher_id') || null,
            schedules: temporarySchedules.map(schedule => ({
                weekday: schedule.weekday,
                id_time: schedule.id_time
            }))
        };

        // Hiển thị loading
        showLoading();

        // Gọi API tạo học phần mới
        fetch('/admin/api/classsessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classSessionData)
        })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    closeAddModal();
                    showNotification('Thêm học phần mới thành công', true);
                    setTimeout(() => { window.location.reload(); }, 1500);
                } else {
                    document.getElementById('confirmWarning').textContent = data.message || 'Có lỗi xảy ra khi tạo học phần mới';
                    document.getElementById('confirmWarning').style.display = 'block';
                }
            })
            .catch(error => {
                hideLoading();
                document.getElementById('confirmWarning').textContent = 'Có lỗi xảy ra khi tạo học phần mới';
                document.getElementById('confirmWarning').style.display = 'block';
                console.error('Error saving class session:', error);
            });
    }

    // Cập nhật học phần
    function updateClassSession() {
        // Lấy dữ liệu form
        const form = document.getElementById('editClassSessionForm');
        if (!form) {
            console.error('Edit form not found');
            return;
        }
        
        const formData = new FormData(form);
        
        // Validation
        const editCapacity = document.getElementById('editCapacity');
        const enrolledCount = parseInt(editCapacity.getAttribute('data-enrolled') || 0);

        if (parseInt(editCapacity.value) < enrolledCount) {
            const warningDiv = document.getElementById('edit-confirmWarning');
            if (warningDiv) {
                warningDiv.innerHTML = `<strong>Lỗi:</strong> Sĩ số không thể nhỏ hơn số sinh viên đã đăng ký (${enrolledCount}).`;
                warningDiv.style.display = 'block';
            }
            return;
        }

        console.log('Updating class session with:', {
            id: currentSessionId,
            schedules: editTemporarySchedules,
            deletedSchedules: editDeletedSchedules
        });

        // Tạo object học phần
        const classSessionData = {
            id: currentSessionId,
            class_code: formData.get('class_code'),
            name: formData.get('name'),
            type: formData.get('type'),
            sub_id: formData.get('sub_id'),
            semester_id: formData.get('semester_id'),
            class_id: formData.get('class_id'),
            capacity: formData.get('capacity'),
            teacher_id: formData.get('teacher_id') || null,
            schedules: editTemporarySchedules.map(schedule => ({
                id: schedule.id, // Giữ lại ID nếu là lịch học hiện có
                weekday: schedule.weekday,
                id_time: schedule.id_time
            })),
            deletedSchedules: editDeletedSchedules.map(schedule => schedule.id).filter(id => id !== undefined)
        };

        // Hiển thị loading
        showLoading();

        // Gọi API cập nhật học phần
        fetch(`/admin/api/classsessions/${currentSessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classSessionData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Server returned an error');
                });
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            if (data.success) {
                closeEditModal();
                showNotification('Cập nhật học phần thành công', true);
                setTimeout(() => { window.location.reload(); }, 1500);
            } else {
                const warningElement = document.getElementById('edit-confirmWarning');
                if (warningElement) {
                    warningElement.textContent = data.message || 'Có lỗi xảy ra khi cập nhật học phần';
                    warningElement.style.display = 'block';
                }
            }
        })
        .catch(error => {
            hideLoading();
            const warningElement = document.getElementById('edit-confirmWarning');
            if (warningElement) {
                warningElement.textContent = 'Có lỗi xảy ra khi cập nhật học phần: ' + error.message;
                warningElement.style.display = 'block';
            }
            console.error('Error updating class session:', error);
        });
    }

    // Gắn sự kiện cho các nút trong modal thêm mới
    const step1Next = document.getElementById('step1-next');
    if (step1Next) step1Next.addEventListener('click', goToStep2);

    const step2Prev = document.getElementById('step2-prev');
    if (step2Prev) step2Prev.addEventListener('click', () => goToStep(1));

    const step2Next = document.getElementById('step2-next');
    if (step2Next) step2Next.addEventListener('click', goToStep3);

    const step3Prev = document.getElementById('step3-prev');
    if (step3Prev) step3Prev.addEventListener('click', () => goToStep(2));

    const saveClasssessionBtn = document.getElementById('save-classsession-btn');
    if (saveClasssessionBtn) saveClasssessionBtn.addEventListener('click', saveClassSession);

    // Gắn sự kiện cho các nút trong modal chỉnh sửa
    const editStep1NextBtn = document.getElementById('edit-step1-next');
    if (editStep1NextBtn) editStep1NextBtn.addEventListener('click', goToEditStep2);

    const editStep2PrevBtn = document.getElementById('edit-step2-prev');
    if (editStep2PrevBtn) editStep2PrevBtn.addEventListener('click', () => goToEditStep(1));

    const editStep2NextBtn = document.getElementById('edit-step2-next');
    if (editStep2NextBtn) editStep2NextBtn.addEventListener('click', goToEditStep3);

    const editStep3PrevBtn = document.getElementById('edit-step3-prev');
    if (editStep3PrevBtn) editStep3PrevBtn.addEventListener('click', () => goToEditStep(2));

    const updateClasssessionBtn = document.getElementById('update-classsession-btn');
    if (updateClasssessionBtn) {
        updateClasssessionBtn.addEventListener('click', function() {
            console.log("Calling updateClassSession with schedules:", editTemporarySchedules);
            updateClassSession();
        });
    }

    // Gắn sự kiện cho nút thêm lịch học
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    if (addScheduleBtn) addScheduleBtn.addEventListener('click', openAddScheduleModal);

    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) addScheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addSchedule();
    });

    // Các nút đóng modal thêm lịch học
    const closeScheduleBtns = document.querySelectorAll('.close-schedule-btn');
    closeScheduleBtns.forEach(btn => btn.addEventListener('click', closeAddScheduleModal));

    // Gắn sự kiện cho nút thêm lịch học trong form chỉnh sửa
    const editAddScheduleBtn = document.getElementById('edit-add-schedule-btn');
    if (editAddScheduleBtn) editAddScheduleBtn.addEventListener('click', openEditAddScheduleModal);

    const editScheduleForm = document.getElementById('editScheduleForm');
    if (editScheduleForm) editScheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addEditSchedule();
    });

    // Các nút đóng modal thêm lịch học trong form chỉnh sửa
    const closeEditScheduleBtns = document.querySelectorAll('.close-edit-schedule-btn');
    closeEditScheduleBtns.forEach(btn => btn.addEventListener('click', closeEditAddScheduleModal));

    // Thêm CSS để đảm bảo hiển thị đúng các bước
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Ẩn tất cả các bước content */
        .step-content, .edit-step-content {
            display: none !important;
        }
        
        /* Chỉ hiển thị bước đang active */
        .step-content.active, .edit-step-content.active {
            display: block !important;
        }
        
    `;
    document.head.appendChild(styleElement);

    // Mở modal thêm lịch học
function openAddScheduleModal() {
    const form = document.getElementById('addScheduleForm');
    if (form) form.reset();
    
    // Lọc khung giờ theo loại học phần đã chọn
    const sessionType = document.getElementById('addType').value;
    filterTimeOptionsByType(sessionType);
    
    const warningElement = document.getElementById('schedule-conflict-warning');
    if (warningElement) warningElement.style.display = 'none';
    
    const scheduleModal = document.getElementById('addScheduleModal');
    if (scheduleModal) scheduleModal.style.display = 'block';
}

// Đóng modal thêm lịch học
function closeAddScheduleModal() {
    const modal = document.getElementById('addScheduleModal');
    if (modal) modal.style.display = 'none';
    
    const form = document.getElementById('addScheduleForm');
    if (form) form.reset();
    
    const warningElement = document.getElementById('schedule-conflict-warning');
    if (warningElement) warningElement.style.display = 'none';
}

// Mở modal thêm lịch học (cho form chỉnh sửa)
function openEditAddScheduleModal() {
    console.log('Opening edit add schedule modal');
    
    // Kiểm tra nếu modal không tồn tại, tạo mới
    let scheduleModal = document.getElementById('editScheduleModal');
    if (!scheduleModal) {
        console.log('Creating editScheduleModal dynamically');
        // Tạo modal động nếu không tồn tại trong HTML
        scheduleModal = document.createElement('div');
        scheduleModal.id = 'editScheduleModal';
        scheduleModal.className = 'modal';
        
        scheduleModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Thêm lịch học</h3>
                    <span class="close-edit-schedule-btn">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editScheduleForm">
                        <div class="form-group">
                            <label for="editScheduleWeekday">Thứ:</label>
                            <select id="editScheduleWeekday" required>
                                <option value="">-- Chọn thứ --</option>
                                <option value="0">Chủ nhật</option>
                                <option value="1">Thứ hai</option>
                                <option value="2">Thứ ba</option>
                                <option value="3">Thứ tư</option>
                                <option value="4">Thứ năm</option>
                                <option value="5">Thứ sáu</option>
                                <option value="6">Thứ bảy</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editScheduleTime">Khung giờ:</label>
                            <select id="editScheduleTime" required>
                                <option value="">-- Chọn khung giờ --</option>
                                <!-- Các options sẽ được thêm bằng JavaScript -->
                            </select>
                        </div>
                        <div id="edit-schedule-conflict-warning" class="warning-message" style="display:none;"></div>
                        <div class="form-actions">
                            <button type="button" id="confirm-edit-schedule-btn" class="btn btn-primary">Thêm lịch học</button>
                            <button type="button" class="btn btn-secondary close-edit-schedule-btn">Hủy</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(scheduleModal);
        
        // Thêm event listener cho nút đóng và nút thêm
        const closeButtons = scheduleModal.querySelectorAll('.close-edit-schedule-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeEditAddScheduleModal);
        });
        
        const confirmButton = scheduleModal.querySelector('#confirm-edit-schedule-btn');
        if (confirmButton) {
            confirmButton.addEventListener('click', addEditSchedule);
        }
    }
    
    // Reset form
    const form = document.getElementById('editScheduleForm');
    if (form) form.reset();
    
    // Xóa các thông báo lỗi
    const warningElement = document.getElementById('edit-schedule-conflict-warning');
    if (warningElement) warningElement.style.display = 'none';
    
    // Kiểm tra và tải dữ liệu khung giờ nếu cần
    if (timeOptions.length === 0) {
        // Tải dữ liệu khung giờ rồi hiển thị modal
        loadTimeOptions(() => {
            // Lọc khung giờ theo loại học phần sau khi đã tải xong
            const sessionType = document.getElementById('editType').value;
            populateEditTimeSelect(sessionType);
            // Hiển thị modal
            scheduleModal.style.display = 'block';
        });
    } else {
        // Lọc khung giờ theo loại học phần
        const sessionType = document.getElementById('editType').value;
        populateEditTimeSelect(sessionType);
        // Hiển thị modal
        scheduleModal.style.display = 'block';
    }
}

// Hàm điền các tùy chọn thời gian cho modal chỉnh sửa
function populateEditTimeSelect(type) {
    console.log('Populating edit time select with type:', type);
    console.log('Available time options:', timeOptions);
    
    const selectElement = document.getElementById('editScheduleTime');
    if (!selectElement) {
        console.error('Edit schedule time select not found');
        return;
    }
    
    // Xóa các options hiện tại
    while (selectElement.firstChild) {
        selectElement.removeChild(selectElement.firstChild);
    }
    
    // Thêm option mặc định
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Chọn khung giờ --';
    selectElement.appendChild(defaultOption);
    
    // Kiểm tra nếu không có timeOptions
    if (!timeOptions || timeOptions.length === 0) {
        console.error('No time options available. Loading time options now...');
        loadTimeOptions();
        return;
    }
    
    // Lọc và thêm options phù hợp với loại học phần
    const filteredOptions = type ? timeOptions.filter(time => time.type === type) : timeOptions;
    console.log('Filtered time options:', filteredOptions);
    
    filteredOptions.forEach(time => {
        const option = document.createElement('option');
        option.value = time.id;
        option.textContent = `${time.start_time} - ${time.end_time} (${time.type})`;
        selectElement.appendChild(option);
    });
}

// Thêm lịch học mới (cho form chỉnh sửa)
function addEditSchedule() {
    console.log('Adding edit schedule');
    
    // Lấy dữ liệu từ form
    const weekdaySelect = document.getElementById('editScheduleWeekday');
    const timeSelect = document.getElementById('editScheduleTime');
    
    if (!weekdaySelect || !timeSelect) {
        console.error('Edit schedule form elements not found');
        return;
    }
    
    const weekday = parseInt(weekdaySelect.value);
    const timeId = parseInt(timeSelect.value);
    
    console.log('Selected weekday:', weekday);
    console.log('Selected timeId:', timeId);
    
    // Validate dữ liệu
    if (isNaN(weekday) || isNaN(timeId)) {
        const warningElement = document.getElementById('edit-schedule-conflict-warning');
        if (warningElement) {
            warningElement.textContent = 'Vui lòng chọn thứ và khung giờ';
            warningElement.style.display = 'block';
        }
        return;
    }
    
    // Kiểm tra trùng lặp
    const isDuplicate = editTemporarySchedules.some(schedule => 
        schedule.weekday === weekday && schedule.id_time === timeId
    );
    
    if (isDuplicate) {
        const warningElement = document.getElementById('edit-schedule-conflict-warning');
        if (warningElement) {
            warningElement.textContent = 'Lịch học này đã được thêm';
            warningElement.style.display = 'block';
        }
        return;
    }
    
    // Lấy thông tin khung giờ và tên thứ
    const selectedTime = timeOptions.find(time => time.id === timeId);
    const weekdayText = getWeekdayText(weekday);
    const timeText = selectedTime ? `${selectedTime.start_time} - ${selectedTime.end_time}` : '';
    
    console.log('Found time option:', selectedTime);
    console.log('Weekday text:', weekdayText);
    console.log('Time text:', timeText);
    
    // Thêm vào danh sách tạm thời
    editTemporarySchedules.push({
        weekday,
        id_time: timeId,
        weekdayText,
        timeText,
        type: selectedTime ? selectedTime.type : ''
    });
    
    console.log('Updated schedules:', editTemporarySchedules);
    
    // Cập nhật giao diện
    updateEditSchedulesList();
    
    // Đóng modal thêm lịch học
    closeEditAddScheduleModal();
}

// Sửa lại phần gắn sự kiện cho nút thêm lịch học trong form chỉnh sửa
// Đặt code này vào cuối đoạn DOMContentLoaded
document.addEventListener('click', function(e) {
    // Delegate event cho nút thêm lịch học trong form chỉnh sửa
    if (e.target && (e.target.id === 'edit-add-schedule-btn' || e.target.closest('#edit-add-schedule-btn'))) {
        console.log('Edit add schedule button clicked');
        openEditAddScheduleModal();
    }
});

function closeEditAddScheduleModal() {
    const modal = document.getElementById('editScheduleModal');
    if (modal) modal.style.display = 'none';
    
    const form = document.getElementById('editScheduleForm');
    if (form) form.reset();
    
    const warningElement = document.getElementById('edit-schedule-conflict-warning');
    if (warningElement) warningElement.style.display = 'none';
}

// Hàm xuất danh sách sinh viên ra file Excel
function exportStudentList(id) {
    const sessionId = id || currentSessionId;
    
    if (!sessionId) {
        console.error('No session ID provided for export');
        showNotification('Không thể xuất file: Thiếu thông tin học phần', false);
        return;
    }

    console.log('Exporting student list for session ID:', sessionId);
    showLoading();
    
    // Tạo một link ẩn để tải file
    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    downloadLink.href = `/admin/api/classsessions/${sessionId}/export-students`;
    
    // Thêm link vào document và click nó
    document.body.appendChild(downloadLink);
    
    // Thêm xử lý lỗi khi tải file
    downloadLink.addEventListener('error', function() {
        showNotification('Có lỗi xảy ra khi tải file', false);
        hideLoading();
    });
    
    downloadLink.click();
    
    // Xóa link sau khi đã click
    setTimeout(() => {
        document.body.removeChild(downloadLink);
        hideLoading();
    }, 1500);
}

// Thay đổi phần xử lý sự kiện cho exportStudentsBtn
if (exportStudentsBtn) {
    exportStudentsBtn.addEventListener('click', function() {
        console.log('Exporting student list for session ID:', currentSessionId);
        // Đảm bảo có session ID trước khi gọi hàm
        if (currentSessionId) {
            exportStudentList(currentSessionId);
        } else {
            console.error('No session ID available for export');
            showNotification('Không thể xuất danh sách: Thiếu thông tin học phần', false);
        }
    });
}

// Thêm xử lý cho nút xuất danh sách trong bảng (thêm vào phần event listeners)
exportBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            console.log('Export button clicked from table, ID:', id);
            if (id) {
                exportStudentList(id);
            } else {
                console.error('No ID found on export button');
                showNotification('Không thể xuất danh sách: Thiếu thông tin học phần', false);
            }
        });
    });
});
