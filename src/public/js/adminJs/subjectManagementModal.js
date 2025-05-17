document.addEventListener('DOMContentLoaded', function () {
    // Khai báo biến cho các modal
    const viewSubjectModal = document.getElementById('viewSubjectModal');
    const editSubjectModal = document.getElementById('editSubjectModal');
    const addSubjectModal = document.getElementById('addSubjectModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const notificationModal = document.getElementById('notificationModal');
    const openAddModalBtn = document.getElementById('openAddModal');

    // Đóng modal khi click vào nút đóng
    document.querySelectorAll('.close-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewSubjectModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editSubjectModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addSubjectModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
        });
    });

    // Đóng modal khi click bên ngoài modal
    window.addEventListener('click', (e) => {
        if (e.target === viewSubjectModal) viewSubjectModal.style.display = 'none';
        if (e.target === editSubjectModal) editSubjectModal.style.display = 'none';
        if (e.target === addSubjectModal) addSubjectModal.style.display = 'none';
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
    });

    // Mở modal thêm môn học
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            addSubjectModal.style.display = 'block';
            document.getElementById('addSubjectForm').reset();
        });
    }

    // Xử lý nút xem chi tiết môn học
    document.querySelectorAll('.view-subject-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/subjects/${subjectId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('viewSubCode').textContent = data.subject.sub_code;
                    document.getElementById('viewSubName').textContent = data.subject.name;
                    document.getElementById('viewCredit').textContent = data.subject.credit;

                    viewSubjectModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin môn học', 'error');
                }
            } catch (error) {
                console.error('Error fetching subject details:', error);
                showNotification('Lỗi khi tải thông tin môn học', 'error');
            }
        });
    });

    // Xử lý nút chỉnh sửa môn học
    document.querySelectorAll('.edit-subject-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/subjects/${subjectId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('editId').value = data.subject.id;
                    document.getElementById('editSubCode').value = data.subject.sub_code;
                    document.getElementById('editSubName').value = data.subject.name;
                    document.getElementById('editCredit').value = data.subject.credit;

                    editSubjectModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin môn học', 'error');
                }
            } catch (error) {
                console.error('Error fetching subject details for edit:', error);
                showNotification('Lỗi khi tải thông tin môn học', 'error');
            }
        });
    });

    // Xử lý nút xóa môn học
    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const subjectId = btn.getAttribute('data-id');
            try {
                const response = await fetch(`/admin/api/subjects/${subjectId}`);
                const data = await response.json();

                if (data.success) {
                    document.getElementById('deleteSubjectInfo').innerHTML = `
                        <p><strong>Mã môn học:</strong> ${data.subject.sub_code}</p>
                        <p><strong>Tên môn học:</strong> ${data.subject.name}</p>
                        <p><strong>Số tín chỉ:</strong> ${data.subject.credit}</p>
                    `;

                    document.getElementById('confirmDeleteBtn').setAttribute('data-id', subjectId);
                    deleteConfirmModal.style.display = 'block';
                } else {
                    showNotification('Không thể tải thông tin môn học', 'error');
                }
            } catch (error) {
                console.error('Error fetching subject details for delete:', error);
                showNotification('Lỗi khi tải thông tin môn học', 'error');
            }
        });
    });

    // Xử lý xác nhận xóa môn học
    document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
        const subjectId = this.getAttribute('data-id');
        try {
            const response = await fetch(`/admin/api/subjects/${subjectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                deleteConfirmModal.style.display = 'none';
                showNotification('Xóa môn học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentPage = new URLSearchParams(window.location.search).get('page') || 1;
                    const searchParams = new URLSearchParams(window.location.search);

                    // Kiểm tra nếu môn học cuối cùng trên trang hiện tại bị xóa
                    const totalSubjects = parseInt(document.querySelector('.pagination-info')?.textContent.match(/của (\d+)/)?.[1] || 0);
                    const subjectsOnCurrentPage = document.querySelectorAll('tbody tr').length;
                    const isLastSubjectOnPage = subjectsOnCurrentPage === 1;

                    // Nếu là môn học cuối cùng và không phải trang đầu tiên thì giảm số trang
                    if (isLastSubjectOnPage && currentPage > 1 && currentPage > Math.ceil((totalSubjects - 1) / 7)) {
                        searchParams.set('page', (parseInt(currentPage) - 1).toString());
                    }

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi xóa môn học', 'error');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            showNotification('Lỗi khi xóa môn học', 'error');
        }
    });

    // Xử lý form thêm môn học
    document.getElementById('addSubjectForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            sub_code: document.getElementById('addSubCode').value.trim(),
            name: document.getElementById('addSubName').value.trim(),
            credit: parseInt(document.getElementById('addCredit').value)
        };

        try {
            const response = await fetch('/admin/api/subjects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                addSubjectModal.style.display = 'none';
                showNotification('Thêm môn học thành công', 'success');
                setTimeout(() => {
                    // Đặt lại trang về 1 nếu thêm môn học mới
                    const searchParams = new URLSearchParams(window.location.search);
                    searchParams.set('page', '1');

                    window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi thêm môn học', 'error');
            }
        } catch (error) {
            console.error('Error adding subject:', error);
            showNotification('Lỗi khi thêm môn học', 'error');
        }
    });

    // Xử lý form cập nhật môn học
    document.getElementById('editSubjectForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const subjectId = document.getElementById('editId').value;
        const formData = {
            sub_code: document.getElementById('editSubCode').value.trim(),
            name: document.getElementById('editSubName').value.trim(),
            credit: parseInt(document.getElementById('editCredit').value)
        };

        try {
            const response = await fetch(`/admin/api/subjects/${subjectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                editSubjectModal.style.display = 'none';
                showNotification('Cập nhật môn học thành công', 'success');
                setTimeout(() => {
                    // Giữ lại tham số phân trang khi reload
                    const currentUrl = new URL(window.location.href);
                    window.location.href = currentUrl.href;
                }, 1500);
            } else {
                showNotification(data.message || 'Lỗi khi cập nhật môn học', 'error');
            }
        } catch (error) {
            console.error('Error updating subject:', error);
            showNotification('Lỗi khi cập nhật môn học', 'error');
        }
    });

    // Kiểm tra mã môn học đã tồn tại
    document.getElementById('addSubCode')?.addEventListener('blur', async function () {
        const subCode = this.value.trim();
        if (!subCode) return;

        try {
            const response = await fetch(`/admin/api/subjects/check-duplicate?field=sub_code&value=${encodeURIComponent(subCode)}`);
            const data = await response.json();

            if (data.exists) {
                showNotification(`Mã môn học "${subCode}" đã tồn tại`, 'error');
                this.focus();
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        } catch (error) {
            console.error('Error checking duplicate subject code:', error);
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

    // Thêm API kiểm tra trùng lặp cho cả khi sửa
    document.getElementById('editSubCode')?.addEventListener('blur', async function () {
        const subCode = this.value.trim();
        const currentId = document.getElementById('editId')?.value;

        if (!subCode || !currentId) return;

        try {
            const response = await fetch(`/admin/api/subjects/check-duplicate?field=sub_code&value=${encodeURIComponent(subCode)}&excludeId=${currentId}`);
            const data = await response.json();

            if (data.exists) {
                showNotification(`Mã môn học "${subCode}" đã tồn tại`, 'error');
                this.focus();
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        } catch (error) {
            console.error('Error checking duplicate subject code during edit:', error);
        }
    });

    // Thêm xử lý cho trang phân trang
    document.addEventListener('DOMContentLoaded', function () {
        const pageNumbersContainer = document.getElementById('page-numbers');
        if (!pageNumbersContainer) return;

        const paginationContainer = document.getElementById('pagination-container');
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
    });
});