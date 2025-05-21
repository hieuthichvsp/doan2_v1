document.addEventListener('DOMContentLoaded', function () {
    // ===== BIẾN TOÀN CỤC =====
    let allClassSessions = [];
    let filteredClassSessions = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentClassSession = null;
    let studentList = [];
    let filteredStudents = [];
    let currentStudentPage = 1;
    let studentsPerPage = 10;

    // ===== FUNCTIONS =====
    // Tải danh sách lớp học phần
    function loadClassSessions() {
        showLoading(true);

        fetch('/teacher/api/classsession')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allClassSessions = data.classSessions || [];
                    filteredClassSessions = [...allClassSessions];

                    // Tải các bộ lọc
                    loadFilters();

                    // Hiển thị dữ liệu
                    renderClassSessions();
                } else {
                    showNotification(data.message || 'Không thể tải danh sách lớp học phần', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading class sessions:', error);
                showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Tải dữ liệu cho các bộ lọc
    function loadFilters() {
        // Tải danh sách học kỳ
        fetch('/teacher/api/semesters')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateSemesterFilter(data.semesters);
                }
            })
            .catch(error => {
                console.error('Error loading semesters:', error);
            });

        // Tải danh sách môn học
        fetch('/teacher/api/subjects')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateSubjectFilter(data.subjects);
                }
            })
            .catch(error => {
                console.error('Error loading subjects:', error);
            });
    }

    // Điền dữ liệu vào bộ lọc học kỳ
    function populateSemesterFilter(semesters) {
        const select = document.getElementById('filter-semester');
        select.innerHTML = '<option value="">Tất cả học kỳ</option>';

        semesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            select.appendChild(option);
        });
    }

    // Điền dữ liệu vào bộ lọc môn học
    function populateSubjectFilter(subjects) {
        const select = document.getElementById('filter-subject');
        select.innerHTML = '<option value="">Tất cả môn học</option>';

        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    }

    // Áp dụng bộ lọc
    function applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const semesterId = document.getElementById('filter-semester').value;
        const subjectId = document.getElementById('filter-subject').value;
        const classType = document.getElementById('filter-type').value;

        filteredClassSessions = allClassSessions.filter(classSession => {
            // Lọc theo từ khóa tìm kiếm
            const matchesSearch =
                classSession.name.toLowerCase().includes(searchTerm) ||
                (classSession.class_code && classSession.class_code.toLowerCase().includes(searchTerm)) ||
                (classSession.subject && classSession.subject.name.toLowerCase().includes(searchTerm));

            // Lọc theo học kỳ
            const matchesSemester = !semesterId || classSession.semester_id == semesterId;

            // Lọc theo môn học
            const matchesSubject = !subjectId || (classSession.subject && classSession.subject.id == subjectId);

            // Lọc theo loại lớp
            const matchesType = !classType || classSession.type === classType;

            return matchesSearch && matchesSemester && matchesSubject && matchesType;
        });

        currentPage = 1;
        renderClassSessions();
    }

    // Hiển thị danh sách lớp học phần
    function renderClassSessions() {
        const tableBody = document.getElementById('classSessionTableBody');
        tableBody.innerHTML = '';

        if (filteredClassSessions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">Không có lớp học phần nào</td>
                </tr>
            `;
            updatePagination(0, 0);
            return;
        }

        // Tính toán phân trang
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredClassSessions.length);
        const paginatedClassSessions = filteredClassSessions.slice(startIndex, endIndex);

        // Hiển thị từng lớp học phần
        paginatedClassSessions.forEach((classSession, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${classSession.class_code || '-'}</td>
                <td>${classSession.name}</td>
                <td>${classSession.subject ? classSession.subject.name : '-'}</td>
                <td>${classSession.type === 'LT' ? 'Lý thuyết' : 'Thực hành'}</td>
                <td>${classSession.subject ? classSession.subject.credit : '-'}</td>
                <td>${classSession.dataValues?.student_count || 0}</td>
                <td>${classSession.semester ? classSession.semester.name : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" data-id="${classSession.id}" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn attendance-btn" data-id="${classSession.id}" title="Điểm danh">
                            <i class="fas fa-clipboard-check"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);

            // Thêm sự kiện click cho nút xem chi tiết
            row.querySelector('.view-btn').addEventListener('click', function () {
                const classSessionId = this.getAttribute('data-id');
                viewClassSession(classSessionId);
            });

            // Thêm sự kiện click cho nút điểm danh
            row.querySelector('.attendance-btn').addEventListener('click', function () {
                const classSessionId = this.getAttribute('data-id');
                window.location.href = `/teacher/attendance/${classSessionId}`;
            });
        });

        // Cập nhật phân trang
        updatePagination(filteredClassSessions.length, itemsPerPage);
    }

    // Cập nhật hiển thị phân trang
    function updatePagination(totalItems, itemsPerPage) {
        const paginationElement = document.getElementById('pagination');
        const currentItemsElement = document.getElementById('currentItems');
        const totalItemsElement = document.getElementById('totalItems');

        // Cập nhật thông tin số lượng
        currentItemsElement.textContent = Math.min(totalItems, (currentPage - 1) * itemsPerPage + Math.min(totalItems - (currentPage - 1) * itemsPerPage, itemsPerPage));
        totalItemsElement.textContent = totalItems;

        // Tính toán số trang
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Xóa các nút phân trang cũ
        paginationElement.innerHTML = '';

        // Thêm nút Previous
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderClassSessions();
            }
        });
        paginationElement.appendChild(prevButton);

        // Thêm các nút số trang
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderClassSessions();
            });
            paginationElement.appendChild(pageButton);
        }

        // Thêm nút Next
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages || totalPages === 0;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderClassSessions();
            }
        });
        paginationElement.appendChild(nextButton);
    }

    // Xem chi tiết lớp học phần
    function viewClassSession(classSessionId) {
        showLoading(true);

        fetch(`/teacher/api/classsession/${classSessionId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentClassSession = data.classSession;
                    displayClassSessionDetails(currentClassSession);
                    loadStudentList(classSessionId);

                    // Hiển thị modal
                    openModal('viewClassSessionModal');
                } else {
                    showNotification(data.message || 'Không thể tải thông tin lớp học phần', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading class session detail:', error);
                showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Hiển thị thông tin chi tiết lớp học phần
    function displayClassSessionDetails(classSession) {
        document.getElementById('detail-class-code').textContent = classSession.class_code || '-';
        document.getElementById('detail-class-name').textContent = classSession.name || '-';
        document.getElementById('detail-subject').textContent = classSession.subject ? classSession.subject.name : '-';
        document.getElementById('detail-subject-code').textContent = classSession.subject ? classSession.subject.sub_code : '-';
        document.getElementById('detail-type').textContent = classSession.type === 'LT' ? 'Lý thuyết' : 'Thực hành';
        document.getElementById('detail-credits').textContent = classSession.subject ? classSession.subject.credit : '-';
        document.getElementById('detail-semester').textContent = classSession.semester ? classSession.semester.name : '-';
        document.getElementById('detail-student-count').textContent = classSession.dataValues?.student_count || 0;

        // Hiển thị lịch học
        displaySchedule(classSession.schedules || []);
    }

    // Hiển thị lịch học
    function displaySchedule(schedules) {
        const scheduleTableBody = document.getElementById('schedule-table-body');
        scheduleTableBody.innerHTML = '';

        if (!schedules || schedules.length === 0) {
            scheduleTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Chưa có lịch học</td>
                </tr>
            `;
            return;
        }

        // Danh sách tên các thứ trong tuần
        const weekdayNames = {
            1: 'Thứ Hai',
            2: 'Thứ Ba',
            3: 'Thứ Tư',
            4: 'Thứ Năm',
            5: 'Thứ Sáu',
            6: 'Thứ Bảy',
            7: 'Chủ Nhật'
        };

        // Hiển thị từng lịch học
        schedules.forEach(schedule => {
            const startTime = schedule.start_time ? schedule.start_time.substring(0, 5) : '-';
            const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : '-';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${weekdayNames[schedule.weekday] || `Thứ ${schedule.weekday}`}</td>
                <td>${schedule.period || '-'}</td>
                <td>${schedule.room_code || '-'}</td>
                <td>${startTime} - ${endTime}</td>
            `;
            scheduleTableBody.appendChild(row);
        });
    }

    // Tải danh sách sinh viên
    function loadStudentList(classSessionId) {
        fetch(`/teacher/api/classsession/${classSessionId}/students`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    studentList = data.students || [];
                    filteredStudents = [...studentList];
                    currentStudentPage = 1;
                    renderStudentList();
                } else {
                    console.error('Error loading students:', data.message);
                    document.getElementById('student-list-body').innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">Không thể tải danh sách sinh viên</td>
                        </tr>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading students:', error);
                document.getElementById('student-list-body').innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Đã xảy ra lỗi khi tải danh sách sinh viên</td>
                    </tr>
                `;
            });
    }

    // Hiển thị danh sách sinh viên
    function renderStudentList() {
        const tableBody = document.getElementById('student-list-body');
        tableBody.innerHTML = '';

        if (filteredStudents.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Không có sinh viên nào</td>
                </tr>
            `;
            updateStudentPagination(0, 0);
            return;
        }

        // Tính toán phân trang
        const startIndex = (currentStudentPage - 1) * studentsPerPage;
        const endIndex = Math.min(startIndex + studentsPerPage, filteredStudents.length);
        const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

        // Hiển thị từng sinh viên
        paginatedStudents.forEach((student, index) => {
            const dob = student.dob ? new Date(student.dob) : null;
            const formattedDate = dob ? `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}` : '-';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${student.student_code || '-'}</td>
                <td>${student.name}</td>
                <td>${student.class_name || '-'}</td>
                <td>${formattedDate}</td>
                <td>${student.email || '-'}</td>
                <td>${student.attendance_rate || 0}%</td>
            `;
            tableBody.appendChild(row);
        });

        // Cập nhật phân trang
        updateStudentPagination(filteredStudents.length, studentsPerPage);
    }

    // Cập nhật hiển thị phân trang cho danh sách sinh viên
    function updateStudentPagination(totalItems, itemsPerPage) {
        const paginationElement = document.getElementById('studentPagination');
        const currentItemsElement = document.getElementById('currentStudents');
        const totalItemsElement = document.getElementById('totalStudents');

        // Cập nhật thông tin số lượng
        currentItemsElement.textContent = Math.min(totalItems, (currentStudentPage - 1) * itemsPerPage + Math.min(totalItems - (currentStudentPage - 1) * itemsPerPage, itemsPerPage));
        totalItemsElement.textContent = totalItems;

        // Tính toán số trang
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Xóa các nút phân trang cũ
        paginationElement.innerHTML = '';

        // Thêm nút Previous
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentStudentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentStudentPage > 1) {
                currentStudentPage--;
                renderStudentList();
            }
        });
        paginationElement.appendChild(prevButton);

        // Thêm các nút số trang
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentStudentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentStudentPage);
            pageButton.addEventListener('click', () => {
                currentStudentPage = i;
                renderStudentList();
            });
            paginationElement.appendChild(pageButton);
        }

        // Thêm nút Next
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentStudentPage === totalPages || totalPages === 0;
        nextButton.addEventListener('click', () => {
            if (currentStudentPage < totalPages) {
                currentStudentPage++;
                renderStudentList();
            }
        });
        paginationElement.appendChild(nextButton);
    }

    // Xuất danh sách lớp học phần ra Excel
    function exportToExcel() {
        if (filteredClassSessions.length === 0) {
            showNotification('Không có dữ liệu để xuất', 'warning');
            return;
        }

        showLoading(true);

        // Tạo URL request - Thay đổi đường dẫn để phù hợp với route mới
        const url = '/teacher/api/classsession/exportAll';

        // Thực hiện request và tải file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Kiểm tra blob size để đảm bảo dữ liệu đúng
                if (blob.size === 0) {
                    throw new Error('Downloaded file is empty');
                }

                // Tạo link tải xuống
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'danh_sach_lop_hoc_phan.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Hiển thị thông báo thành công
                showNotification('Tải xuống file Excel thành công', 'success');
            })
            .catch(error => {
                console.error('Error exporting to Excel:', error);
                showNotification('Đã xảy ra lỗi khi xuất Excel: ' + error.message, 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Xuất danh sách sinh viên trong lớp ra Excel
    function exportStudentListToExcel() {
        if (!currentClassSession || !currentClassSession.id) {
            showNotification('Không có dữ liệu lớp học phần', 'warning');
            return;
        }

        if (filteredStudents.length === 0) {
            showNotification('Không có sinh viên để xuất', 'warning');
            return;
        }

        showLoading(true);

        // Tạo URL request
        const url = `/teacher/api/classsession/${currentClassSession.id}/students/export`;

        // Thực hiện request và tải file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo link tải xuống
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `danh_sach_sinh_vien_${currentClassSession.class_code || currentClassSession.id}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error exporting student list to Excel:', error);
                showNotification('Đã xảy ra lỗi khi xuất Excel', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Xuất báo cáo lớp học phần
    function exportReportToExcel() {
        if (!currentClassSession || !currentClassSession.id) {
            showNotification('Không có dữ liệu lớp học phần', 'warning');
            return;
        }

        showLoading(true);

        // Tạo URL request
        const url = `/teacher/api/classsession/${currentClassSession.id}/report/export`;

        // Thực hiện request và tải file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Tạo link tải xuống
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `bao_cao_lop_${currentClassSession.class_code || currentClassSession.id}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error exporting report to Excel:', error);
                showNotification('Đã xảy ra lỗi khi xuất báo cáo', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // ===== HELPER FUNCTIONS =====
    // Hiển thị thông báo
    function showNotification(message, type = 'info') {
        try {
            const notificationModal = document.getElementById('notificationModal');

            // Nếu không tìm thấy modal thông báo, tạo mới
            if (!notificationModal) {
                console.warn('Notification modal not found, creating one');

                // Tạo notification modal và thêm vào body
                const newModal = document.createElement('div');
                newModal.id = 'notificationModal';
                newModal.className = 'notification-modal ' + type;

                newModal.innerHTML = `
                    <div class="notification-content">
                        <div class="notification-icon">
                            <i class="fas fa-check-circle" style="${type === 'error' || type === 'warning' ? 'display:none' : ''}"></i>
                            <i class="fas fa-exclamation-triangle" style="${type !== 'error' && type !== 'warning' ? 'display:none' : ''}"></i>
                        </div>
                        <div>
                            <div class="notification-title">${type === 'error' ? 'Lỗi' : type === 'warning' ? 'Cảnh báo' : 'Thành công'}</div>
                            <div class="notification-message">${message}</div>
                        </div>
                    </div>
                `;

                // Thêm CSS inline
                const style = document.createElement('style');
                style.textContent = `
                    .notification-modal {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 9999;
                        background: white;
                        border-radius: 4px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        padding: 15px;
                        display: none;
                        min-width: 300px;
                        animation: slideIn 0.3s forwards;
                    }
                    .notification-modal.success { border-left: 4px solid #28a745; }
                    .notification-modal.error { border-left: 4px solid #dc3545; }
                    .notification-modal.warning { border-left: 4px solid #ffc107; }
                    .notification-content {
                        display: flex;
                        align-items: flex-start;
                    }
                    .notification-icon {
                        font-size: 18px;
                        margin-right: 10px;
                    }
                    .notification-icon .fa-check-circle { color: #28a745; }
                    .notification-icon .fa-exclamation-triangle { color: #dc3545; }
                    .notification-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `;

                document.head.appendChild(style);
                document.body.appendChild(newModal);

                // Sử dụng modal mới tạo
                showNotificationInModal(newModal, message, type);
                return;
            }

            // Nếu modal đã tồn tại
            const notificationTitle = document.getElementById('notification-title');
            const notificationMessage = document.getElementById('notification-message');
            const successIcon = document.querySelector('.notification-icon .fa-check-circle');
            const warningIcon = document.querySelector('.notification-icon .fa-exclamation-triangle');

            // Kiểm tra các phần tử con
            if (!notificationTitle || !notificationMessage || !successIcon || !warningIcon) {
                console.warn('Notification elements not found, using simplified notification');
                notificationModal.className = 'notification-modal ' + type;
                notificationModal.innerHTML = `
                    <div class="notification-content">
                        <div class="notification-icon">
                            <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' :
                        type === 'warning' ? 'fa-exclamation-triangle' :
                            'fa-check-circle'}"></i>
                        </div>
                        <div>
                            <div class="notification-title">${type === 'error' ? 'Lỗi' :
                        type === 'warning' ? 'Cảnh báo' : 'Thành công'}</div>
                            <div class="notification-message">${message}</div>
                        </div>
                    </div>
                `;
            } else {
                // Đặt tiêu đề và ẩn/hiện icon theo loại thông báo
                if (type === 'error') {
                    notificationTitle.textContent = 'Lỗi';
                    successIcon.style.display = 'none';
                    warningIcon.style.display = 'inline';
                    notificationModal.className = 'notification-modal error';
                } else if (type === 'warning') {
                    notificationTitle.textContent = 'Cảnh báo';
                    successIcon.style.display = 'none';
                    warningIcon.style.display = 'inline';
                    notificationModal.className = 'notification-modal warning';
                } else {
                    notificationTitle.textContent = 'Thành công';
                    successIcon.style.display = 'inline';
                    warningIcon.style.display = 'none';
                    notificationModal.className = 'notification-modal success';
                }

                notificationMessage.textContent = message;
            }

            // Hiển thị notification
            notificationModal.style.display = 'block';

            // Tự động ẩn sau 3 giây
            setTimeout(() => {
                notificationModal.style.display = 'none';
            }, 3000);
        } catch (error) {
            // Fallback khi mọi thứ không hoạt động
            console.error('Error showing notification:', error);
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Hàm hỗ trợ để hiển thị thông báo trong modal mới tạo
    function showNotificationInModal(modal, message, type) {
        // Hiển thị notification
        modal.style.display = 'block';

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    }

    // Hiển thị loading
    function showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // Mở modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }

    // Đóng modal
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    // ===== EVENT LISTENERS =====
    // Tìm kiếm lớp học phần
    document.getElementById('searchBtn').addEventListener('click', function () {
        applyFilters();
    });

    document.getElementById('searchInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // Lọc dữ liệu
    document.getElementById('filter-semester').addEventListener('change', applyFilters);
    document.getElementById('filter-subject').addEventListener('change', applyFilters);
    document.getElementById('filter-type').addEventListener('change', applyFilters);

    // Xuất Excel
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    // Làm mới dữ liệu
    document.getElementById('refreshBtn').addEventListener('click', loadClassSessions);

    // Xuất danh sách sinh viên
    document.getElementById('exportStudentListBtn').addEventListener('click', exportStudentListToExcel);

    // Xuất báo cáo lớp học phần
    document.getElementById('exportReportBtn').addEventListener('click', exportReportToExcel);

    // Tìm kiếm sinh viên
    document.getElementById('studentSearchBtn').addEventListener('click', function () {
        const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();
        filteredStudents = studentList.filter(student =>
            student.name.toLowerCase().includes(searchTerm) ||
            (student.student_code && student.student_code.toLowerCase().includes(searchTerm)) ||
            (student.email && student.email.toLowerCase().includes(searchTerm))
        );
        currentStudentPage = 1;
        renderStudentList();
    });

    document.getElementById('studentSearchInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('studentSearchBtn').click();
        }
    });

    // Xem điểm danh
    document.getElementById('viewAttendanceBtn').addEventListener('click', function () {
        if (!currentClassSession || !currentClassSession.id) return;
        window.location.href = `/teacher/attendance/${currentClassSession.id}`;
    });

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', function (event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // ===== KHỞI TẠO =====
    // Tải dữ liệu ban đầu
    loadClassSessions();
});