document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewEnrollmentModal = document.getElementById('viewEnrollmentModal');
    const addEnrollmentModal = document.getElementById('addEnrollmentModal');
    const bulkEnrollmentModal = document.getElementById('bulkEnrollmentModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');

    // Biến lưu trữ danh sách sinh viên cho modal bulk
    let availableStudentsData = [];
    let selectedStudentsData = [];

    // Xử lý dropdown lọc học phần
    const classSessionFilter = document.getElementById('classSessionFilter');
    if (classSessionFilter) {
        classSessionFilter.addEventListener('change', function() {
            const selectedValue = this.value;
            document.getElementById('classSessionInput').value = selectedValue;
            document.getElementById('searchForm').submit();
        });
    }

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewEnrollmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addEnrollmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-bulk-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            bulkEnrollmentModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewEnrollmentModal) viewEnrollmentModal.style.display = 'none';
        if (e.target === addEnrollmentModal) addEnrollmentModal.style.display = 'none';
        if (e.target === bulkEnrollmentModal) bulkEnrollmentModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Xử lý nút xem chi tiết đăng ký
    document.querySelectorAll('.view-enrollment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const enrollmentId = btn.getAttribute('data-id');
            fetchEnrollmentAndPopulateViewModal(enrollmentId);
        });
    });

    // Xử lý nút xóa đăng ký
    document.querySelectorAll('.delete-enrollment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const enrollmentId = btn.getAttribute('data-id');
            showDeleteConfirmation(enrollmentId);
        });
    });

    // Xử lý nút thêm đăng ký
    document.getElementById('addEnrollmentBtn').addEventListener('click', () => {
        addEnrollmentModal.style.display = 'block';
        // Reset form
        document.getElementById('addEnrollmentForm').reset();
        document.getElementById('addStudent').innerHTML = '<option value="">-- Chọn sinh viên --</option>';
        document.getElementById('classCapacityInfo').style.display = 'none';
    });

    // Xử lý nút đăng ký hàng loạt
    document.getElementById('bulkEnrollBtn').addEventListener('click', () => {
        bulkEnrollmentModal.style.display = 'block';
        // Reset form
        document.getElementById('bulkEnrollmentForm').reset();
        document.getElementById('availableStudents').innerHTML = '';
        document.getElementById('selectedStudents').innerHTML = '';
        document.getElementById('bulkClassCapacityInfo').style.display = 'none';
        availableStudentsData = [];
        selectedStudentsData = [];
        updateStudentCounts();
    });

    // Xử lý xác nhận xóa
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const enrollmentId = document.getElementById('confirmDeleteBtn').getAttribute('data-id');
        deleteEnrollment(enrollmentId);
    });

    // Xử lý form thêm đăng ký
    document.getElementById('addEnrollmentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        addEnrollment(this);
    });

    // Xử lý form đăng ký hàng loạt
    document.getElementById('bulkEnrollmentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        bulkEnroll();
    });

    // Xử lý thay đổi học phần trong form thêm
    document.getElementById('addClassSession').addEventListener('change', function() {
        const classSessionId = this.value;
        if (classSessionId) {
            // Lấy thông tin sức chứa lớp học phần
            fetchClassSessionCapacity(classSessionId);
            // Lấy danh sách sinh viên có thể đăng ký
            fetchAvailableStudents(classSessionId);
        } else {
            document.getElementById('addStudent').innerHTML = '<option value="">-- Chọn sinh viên --</option>';
            document.getElementById('classCapacityInfo').style.display = 'none';
        }
    });

    // Xử lý thay đổi học phần trong form bulk
    document.getElementById('bulkClassSession').addEventListener('change', function() {
        const classSessionId = this.value;
        if (classSessionId) {
            // Lấy thông tin sức chứa lớp học phần
            fetchBulkClassSessionCapacity(classSessionId);
            // Lấy danh sách sinh viên có thể đăng ký
            fetchBulkAvailableStudents(classSessionId);
        } else {
            document.getElementById('availableStudents').innerHTML = '';
            document.getElementById('selectedStudents').innerHTML = '';
            document.getElementById('bulkClassCapacityInfo').style.display = 'none';
            availableStudentsData = [];
            selectedStudentsData = [];
            updateStudentCounts();
        }
    });

    // Xử lý tìm kiếm sinh viên khả dụng
    document.getElementById('availableStudentSearch').addEventListener('input', function() {
        filterStudentList('availableStudents', this.value, availableStudentsData);
    });

    // Xử lý tìm kiếm sinh viên đã chọn
    document.getElementById('selectedStudentSearch').addEventListener('input', function() {
        filterStudentList('selectedStudents', this.value, selectedStudentsData);
    });

    // Xử lý nút thêm tất cả sinh viên
    document.getElementById('addAllStudents').addEventListener('click', function() {
        if (availableStudentsData.length === 0) return;
        
        selectedStudentsData = [...selectedStudentsData, ...availableStudentsData];
        availableStudentsData = [];
        
        renderStudentLists();
        updateStudentCounts();
    });

    // Xử lý nút thêm sinh viên đã chọn
    document.getElementById('addSelectedStudents').addEventListener('click', function() {
        const selectedItems = document.querySelectorAll('#availableStudents .student-item.selected');
        if (selectedItems.length === 0) return;
        
        const selectedIds = Array.from(selectedItems).map(item => parseInt(item.dataset.id));
        const studentsToMove = availableStudentsData.filter(student => selectedIds.includes(student.id));
        
        selectedStudentsData = [...selectedStudentsData, ...studentsToMove];
        availableStudentsData = availableStudentsData.filter(student => !selectedIds.includes(student.id));
        
        renderStudentLists();
        updateStudentCounts();
    });

    // Xử lý nút xóa sinh viên đã chọn
    document.getElementById('removeSelectedStudents').addEventListener('click', function() {
        const selectedItems = document.querySelectorAll('#selectedStudents .student-item.selected');
        if (selectedItems.length === 0) return;
        
        const selectedIds = Array.from(selectedItems).map(item => parseInt(item.dataset.id));
        const studentsToMove = selectedStudentsData.filter(student => selectedIds.includes(student.id));
        
        availableStudentsData = [...availableStudentsData, ...studentsToMove];
        selectedStudentsData = selectedStudentsData.filter(student => !selectedIds.includes(student.id));
        
        renderStudentLists();
        updateStudentCounts();
    });

    // Xử lý nút xóa tất cả sinh viên
    document.getElementById('removeAllStudents').addEventListener('click', function() {
        if (selectedStudentsData.length === 0) return;
        
        availableStudentsData = [...availableStudentsData, ...selectedStudentsData];
        selectedStudentsData = [];
        
        renderStudentLists();
        updateStudentCounts();
    });

    // Hàm lấy thông tin đăng ký và hiển thị trong modal xem chi tiết
    function fetchEnrollmentAndPopulateViewModal(enrollmentId) {
        fetch(`/admin/api/enrollments/${enrollmentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const enrollment = data.enrollment;
                    
                    // Thông tin sinh viên
                    document.getElementById('viewStudentCode').textContent = enrollment.student?.user_code || 'N/A';
                    document.getElementById('viewStudentName').textContent = enrollment.student?.name || 'N/A';
                    document.getElementById('viewStudentEmail').textContent = enrollment.student?.email || 'N/A';
                    
                    // Thông tin học phần
                    document.getElementById('viewClassCode').textContent = enrollment.classSession?.class_code || 'N/A';
                    document.getElementById('viewClassName').textContent = enrollment.classSession?.subject?.name || 'N/A';
                    document.getElementById('viewClassType').textContent = 
                        enrollment.classSession?.type === 'LT' ? 'Lý thuyết' : 'Thực hành';
                    document.getElementById('viewSemester').textContent = enrollment.classSession?.semester?.name || 'N/A';
                    document.getElementById('viewEnrollmentDate').textContent = 
                        new Date(enrollment.createdAt).toLocaleDateString('vi-VN');
                    
                    viewEnrollmentModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin đăng ký', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching enrollment:', error);
                showNotification('Đã có lỗi xảy ra khi tải thông tin đăng ký', 'error');
            });
    }

    // Hàm hiển thị xác nhận xóa
    function showDeleteConfirmation(enrollmentId) {
        fetch(`/admin/api/enrollments/${enrollmentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const enrollment = data.enrollment;
                    document.getElementById('deleteEnrollmentInfo').textContent = 
                        `${enrollment.student?.user_code || 'N/A'} - ${enrollment.student?.name || 'N/A'} | ${enrollment.classSession?.class_code || 'N/A'} - ${enrollment.classSession?.subject?.name || 'N/A'}`;
                    document.getElementById('confirmDeleteBtn').setAttribute('data-id', enrollment.id);
                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin đăng ký', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching enrollment:', error);
                showNotification('Đã có lỗi xảy ra khi tải thông tin đăng ký', 'error');
            });
    }

    // Hàm thêm đăng ký môn học mới
    function addEnrollment(form) {
        const formData = new FormData(form);
        const enrollmentData = Object.fromEntries(formData.entries());

        fetch('/admin/api/enrollments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(enrollmentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Đăng ký môn học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Đăng ký môn học thất bại', 'error');
            }
        })
        .catch(error => {
            console.error('Error adding enrollment:', error);
            showNotification('Đã có lỗi xảy ra khi đăng ký môn học', 'error');
        });
    }

    // Hàm xóa đăng ký môn học
    function deleteEnrollment(enrollmentId) {
        fetch(`/admin/api/enrollments/${enrollmentId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Hủy đăng ký môn học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Hủy đăng ký môn học thất bại', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting enrollment:', error);
            showNotification('Đã có lỗi xảy ra khi hủy đăng ký môn học', 'error');
        });
    }

    // Hàm lấy thông tin sức chứa lớp học phần
    function fetchClassSessionCapacity(classSessionId) {
        fetch(`/admin/api/class-sessions/${classSessionId}/capacity`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const capacityInfo = data.capacityInfo;
                    const capacityElement = document.getElementById('classCapacityInfo');
                    
                    // Tạo HTML hiển thị thông tin sức chứa
                    let className = 'text-success';
                    if (capacityInfo.available <= 5) className = 'text-warning';
                    if (capacityInfo.available <= 0) className = 'text-danger';
                    
                    capacityElement.innerHTML = `
                        <div>Sức chứa: ${capacityInfo.capacity} sinh viên</div>
                        <div>Đã đăng ký: ${capacityInfo.currentCount} sinh viên</div>
                        <div class="${className}">Còn trống: ${capacityInfo.available} chỗ</div>
                    `;
                    
                    capacityElement.style.display = 'block';
                } else {
                    document.getElementById('classCapacityInfo').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching class session capacity:', error);
                document.getElementById('classCapacityInfo').style.display = 'none';
            });
    }

    // Hàm lấy thông tin sức chứa lớp học phần cho modal bulk
    function fetchBulkClassSessionCapacity(classSessionId) {
        fetch(`/admin/api/class-sessions/${classSessionId}/capacity`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const capacityInfo = data.capacityInfo;
                    const capacityElement = document.getElementById('bulkClassCapacityInfo');
                    
                    // Tạo HTML hiển thị thông tin sức chứa
                    let className = 'text-success';
                    if (capacityInfo.available <= 5) className = 'text-warning';
                    if (capacityInfo.available <= 0) className = 'text-danger';
                    
                    capacityElement.innerHTML = `
                        <div>Sức chứa: ${capacityInfo.capacity} sinh viên</div>
                        <div>Đã đăng ký: ${capacityInfo.currentCount} sinh viên</div>
                        <div class="${className}">Còn trống: ${capacityInfo.available} chỗ</div>
                    `;
                    
                    capacityElement.style.display = 'block';
                } else {
                    document.getElementById('bulkClassCapacityInfo').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching class session capacity:', error);
                document.getElementById('bulkClassCapacityInfo').style.display = 'none';
            });
    }

    // Hàm lấy danh sách sinh viên có thể đăng ký
    function fetchAvailableStudents(classSessionId) {
        fetch(`/admin/api/class-sessions/${classSessionId}/available-students`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const students = data.students;
                    const selectElement = document.getElementById('addStudent');
                    
                    // Reset select
                    selectElement.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                    
                    // Thêm options mới
                    students.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.id;
                        option.textContent = `${student.user_code} - ${student.name}`;
                        selectElement.appendChild(option);
                    });
                } else {
                    document.getElementById('addStudent').innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching available students:', error);
                document.getElementById('addStudent').innerHTML = '<option value="">-- Chọn sinh viên --</option>';
            });
    }

    // Hàm lấy danh sách sinh viên có thể đăng ký cho modal bulk
    function fetchBulkAvailableStudents(classSessionId) {
        fetch(`/admin/api/class-sessions/${classSessionId}/available-students`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    availableStudentsData = data.students;
                    selectedStudentsData = [];
                    renderStudentLists();
                    updateStudentCounts();
                } else {
                    availableStudentsData = [];
                    selectedStudentsData = [];
                    renderStudentLists();
                    updateStudentCounts();
                }
            })
            .catch(error => {
                console.error('Error fetching available students:', error);
                availableStudentsData = [];
                selectedStudentsData = [];
                renderStudentLists();
                updateStudentCounts();
            });
    }

    // Hàm lọc danh sách sinh viên theo từ khóa tìm kiếm
    function filterStudentList(containerId, searchTerm, studentsData) {
        const container = document.getElementById(containerId);
        const items = container.querySelectorAll('.student-item');
        
        if (searchTerm.trim() === '') {
            items.forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTermLower)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Hàm cập nhật số lượng sinh viên hiển thị trong modal bulk
    function updateStudentCounts() {
        document.getElementById('availableStudentCount').textContent = availableStudentsData.length;
        document.getElementById('selectedStudentCount').textContent = selectedStudentsData.length;
    }

    // Hàm render danh sách sinh viên trong modal bulk
    function renderStudentLists() {
        const availableContainer = document.getElementById('availableStudents');
        const selectedContainer = document.getElementById('selectedStudents');
        
        // Sắp xếp sinh viên theo mã số
        availableStudentsData.sort((a, b) => a.user_code.localeCompare(b.user_code));
        selectedStudentsData.sort((a, b) => a.user_code.localeCompare(b.user_code));
        
        // Render danh sách sinh viên khả dụng
        availableContainer.innerHTML = '';
        availableStudentsData.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-item';
            item.dataset.id = student.id;
            item.textContent = `${student.user_code} - ${student.name}`;
            item.addEventListener('click', toggleStudentSelection);
            availableContainer.appendChild(item);
        });
        
        // Render danh sách sinh viên đã chọn
        selectedContainer.innerHTML = '';
        selectedStudentsData.forEach(student => {
            const item = document.createElement('div');
            item.className = 'student-item';
            item.dataset.id = student.id;
            item.textContent = `${student.user_code} - ${student.name}`;
            item.addEventListener('click', toggleStudentSelection);
            selectedContainer.appendChild(item);
        });
    }

    // Hàm toggle chọn sinh viên
    function toggleStudentSelection(e) {
        e.target.classList.toggle('selected');
    }

    // Hàm đăng ký hàng loạt
    function bulkEnroll() {
        if (selectedStudentsData.length === 0) {
            showNotification('Vui lòng chọn ít nhất một sinh viên để đăng ký', 'error');
            return;
        }

        const classSessionId = document.getElementById('bulkClassSession').value;
        if (!classSessionId) {
            showNotification('Vui lòng chọn học phần', 'error');
            return;
        }

        const studentIds = selectedStudentsData.map(student => student.id);

        fetch('/admin/api/bulk-enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                classSessionId,
                studentIds
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Đăng ký hàng loạt thất bại', 'error');
            }
        })
        .catch(error => {
            console.error('Error bulk enrolling students:', error);
            showNotification('Đã có lỗi xảy ra khi đăng ký hàng loạt', 'error');
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