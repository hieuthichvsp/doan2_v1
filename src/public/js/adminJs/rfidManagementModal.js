document.addEventListener('DOMContentLoaded', function() {
    // Variables
    let currentRfidPage = 1;
    let currentRfidUserPage = 1;
    let rfidSearchTerm = '';
    let rfidUserSearchTerm = '';
    let rfidsData = [];
    let rfidUsersData = [];
    let currentRfidId = null;
    let currentRfidUserId = null;

    // DOM Elements - Tabs
    const tabLinks = document.querySelectorAll('.nav-tabs li');
    const tabContents = document.querySelectorAll('.tab-pane');

    // DOM Elements - RFID Tab
    const rfidTableBody = document.getElementById('rfidTableBody');
    const rfidPagination = document.getElementById('rfidPagination');
    const rfidPaginationFrom = document.getElementById('rfidPaginationFrom');
    const rfidPaginationTo = document.getElementById('rfidPaginationTo');
    const rfidPaginationTotal = document.getElementById('rfidPaginationTotal');
    const addRfidBtn = document.getElementById('addRfidBtn');
    const rfidSearchInput = document.getElementById('rfidSearchInput');
    const rfidSearchBtn = document.getElementById('rfidSearchBtn');
    
    // DOM Elements - RFID User Tab
    const rfidUserTableBody = document.getElementById('rfidUserTableBody');
    const rfidUserPagination = document.getElementById('rfidUserPagination');
    const rfidUserPaginationFrom = document.getElementById('rfidUserPaginationFrom');
    const rfidUserPaginationTo = document.getElementById('rfidUserPaginationTo');
    const rfidUserPaginationTotal = document.getElementById('rfidUserPaginationTotal');
    const assignRfidBtn = document.getElementById('assignRfidBtn');
    const rfidUserSearchInput = document.getElementById('rfidUserSearchInput');
    const rfidUserSearchBtn = document.getElementById('rfidUserSearchBtn');

    // DOM Elements - RFID Modal
    const rfidModal = document.getElementById('rfidModal');
    const rfidForm = document.getElementById('rfidForm');
    const rfidModalLabel = document.getElementById('rfidModalLabel');
    const rfidId = document.getElementById('rfidId');
    const rfidCode = document.getElementById('rfidCode');
    const rfidCodeFeedback = document.getElementById('rfidCodeFeedback');
    const saveRfidBtn = document.getElementById('saveRfidBtn');
    const closeRfidBtns = document.querySelectorAll('.close-rfid-btn');
    
    // DOM Elements - View RFID Modal
    const viewRfidModal = document.getElementById('viewRfidModal');
    const viewRfidId = document.getElementById('viewRfidId');
    const viewRfidCode = document.getElementById('viewRfidCode');
    const viewRfidStatus = document.getElementById('viewRfidStatus');
    const viewRfidUser = document.getElementById('viewRfidUser');
    const viewRfidCreatedAt = document.getElementById('viewRfidCreatedAt');
    const viewRfidUpdatedAt = document.getElementById('viewRfidUpdatedAt');
    const closeViewBtns = document.querySelectorAll('.close-view-btn');
    
    // DOM Elements - Assign RFID Modal
    const assignRfidModal = document.getElementById('assignRfidModal');
    const assignRfidSelect = document.getElementById('assignRfidSelect');
    const assignUserSelect = document.getElementById('assignUserSelect');
    const assignRfidSelectFeedback = document.getElementById('assignRfidSelectFeedback');
    const assignUserSelectFeedback = document.getElementById('assignUserSelectFeedback');
    const saveAssignRfidBtn = document.getElementById('saveAssignRfidBtn');
    const closeAssignBtns = document.querySelectorAll('.close-assign-btn');
    
    // DOM Elements - Delete Confirmation Modal
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const deleteRfidInfo = document.getElementById('deleteRfidInfo');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const closeDeleteBtns = document.querySelectorAll('.close-delete-btn');
    
    // DOM Elements - Unassign Confirmation Modal
    const unassignConfirmationModal = document.getElementById('unassignConfirmationModal');
    const unassignRfidInfo = document.getElementById('unassignRfidInfo');
    const confirmUnassignBtn = document.getElementById('confirmUnassignBtn');
    const closeUnassignBtns = document.querySelectorAll('.close-unassign-btn');

    // DOM Elements - Notification Modal
    const notificationModal = document.getElementById('notificationModal');
    const notificationMessage = document.getElementById('notificationMessage');

    // DOM Elements - Reactivate Confirmation Modal
    const reactivateConfirmationModal = document.getElementById('reactivateConfirmationModal');
    const reactivateRfidInfo = document.getElementById('reactivateRfidInfo');
    const confirmReactivateBtn = document.getElementById('confirmReactivateBtn');
    const closeReactivateBtns = document.querySelectorAll('.close-reactivate-btn');

    // DOM Elements - Edit RFID User Modal
    const editRfidUserModal = document.getElementById('editRfidUserModal');
    const editRfidUserForm = document.getElementById('editRfidUserForm');
    const editRfidUserId = document.getElementById('editRfidUserId');
    const editRfidSelect = document.getElementById('editRfidSelect');
    const editUserSelect = document.getElementById('editUserSelect');
    const editRfidSelectFeedback = document.getElementById('editRfidSelectFeedback');
    const editUserSelectFeedback = document.getElementById('editUserSelectFeedback');
    const saveEditRfidUserBtn = document.getElementById('saveEditRfidUserBtn');
    const closeEditUserBtns = document.querySelectorAll('.close-edit-user-btn');

    // DOM Elements - Delete RFID User Modal
    const deleteRfidUserModal = document.getElementById('deleteRfidUserModal');
    const deleteRfidUserInfo = document.getElementById('deleteRfidUserInfo');
    const confirmDeleteRfidUserBtn = document.getElementById('confirmDeleteRfidUserBtn');
    const closeDeleteUserBtns = document.querySelectorAll('.close-delete-user-btn');

    // Event Listeners - Tab navigation
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Activate selected tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Load data based on active tab
            if (tabId === 'rfid-content') {
                loadRfids();
            } else if (tabId === 'rfid-user-content') {
                loadRfidUsers();
            }
        });
    });

    // Event Listeners
    addRfidBtn.addEventListener('click', showAddRfidModal);
    rfidSearchBtn.addEventListener('click', searchRfids);
    rfidSearchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchRfids();
        }
    });
    
    assignRfidBtn.addEventListener('click', showAssignRfidModal);
    rfidUserSearchBtn.addEventListener('click', searchRfidUsers);
    rfidUserSearchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchRfidUsers();
        }
    });
    
    saveRfidBtn.addEventListener('click', saveRfid);
    saveAssignRfidBtn.addEventListener('click', saveRfidAssignment);
    
    // Modal close events
    closeRfidBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(rfidModal);
        });
    });
    
    closeViewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(viewRfidModal);
        });
    });

    closeAssignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(assignRfidModal);
        });
    });

    closeDeleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(deleteConfirmationModal);
        });
    });

    closeUnassignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(unassignConfirmationModal);
        });
    });

    closeReactivateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(reactivateConfirmationModal);
        });
    });

    closeEditUserBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(editRfidUserModal);
        });
    });

    closeDeleteUserBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(deleteRfidUserModal);
        });
    });

    // Initialize data
    loadRfids();

    // Functions - RFID Management
    function loadRfids() {
        showLoading(rfidTableBody);
        
        console.log(`Loading RFIDs: page=${currentRfidPage}, search=${rfidSearchTerm}`);
        
        fetch(`/admin/api/rfids?page=${currentRfidPage}&search=${rfidSearchTerm}`)
            .then(response => response.json())
            .then(data => {
                console.log('API Response:', data);
                if (data.success) {
                    rfidsData = data.data;
                    renderRfidTable();
                    renderRfidPagination(data);
                } else {
                    showError(rfidTableBody, data.message || 'Không thể tải danh sách RFID');
                }
            })
            .catch(error => {
                console.error('Error loading RFIDs:', error);
                showError(rfidTableBody, 'Không thể tải danh sách RFID');
            });
    }

    function renderRfidTable() {
        rfidTableBody.innerHTML = '';
        
        if (rfidsData.length === 0) {
            rfidTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        Không có dữ liệu RFID
                    </td>
                </tr>
            `;
            return;
        }
        
        rfidsData.forEach((rfid, index) => {
            // Find active RFID user association
            const activeRfidUser = rfid.rfidUsers && rfid.rfidUsers.find(ru => ru.status === true);
            const status = activeRfidUser ? 'Đã gán' : 'Chưa gán';
            const statusClass = activeRfidUser ? 'badge bg-success' : 'badge bg-secondary';
            const userName = activeRfidUser && activeRfidUser.user ? activeRfidUser.user.name : 'N/A';
            
            rfidTableBody.innerHTML += `
                <tr>
                    <td>${(currentRfidPage - 1) * 10 + index + 1}</td>
                    <td>${rfid.id}</td>
                    <td>${rfid.code}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td>${userName}</td>
                    <td class="action-btns">
                        <i class="fas fa-eye view-rfid-btn" data-id="${rfid.id}" title="Xem"></i>
                        <i class="fas fa-edit edit-rfid-btn" data-id="${rfid.id}" title="Chỉnh sửa"></i>
                        <i class="fas fa-trash delete-rfid-btn" data-id="${rfid.id}" 
                            ${activeRfidUser ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''} title="Xóa"></i>
                    </td>
                </tr>
            `;
        });
        
        // Event listeners for view, edit and delete buttons
        document.querySelectorAll('.view-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showViewRfidModal(id);
            });
        });
        
        document.querySelectorAll('.edit-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showEditRfidModal(id);
            });
        });
        
        document.querySelectorAll('.delete-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rfid = rfidsData.find(r => r.id == id);
                const activeRfidUser = rfid.rfidUsers && rfid.rfidUsers.find(ru => ru.status === true);
                
                if (!activeRfidUser) {
                    showDeleteConfirmation(id);
                }
            });
        });
    }

    // Thêm console.log để kiểm tra
    function renderRfidPagination(data) {
        console.log('Rendering pagination:', data);
        rfidPagination.innerHTML = '';
        
        if (!data.totalPages || data.totalPages <= 1) {
            console.log('No pagination needed');
            return;
        }
        
        // First and Previous Page buttons
        rfidPagination.innerHTML += `
            <a class="pagination-link first-page ${data.currentPage === 1 ? 'disabled' : ''}" 
               data-page="1" title="Trang đầu">
                <i class="fas fa-angle-double-left"></i>
            </a>
            <a class="pagination-link prev-page ${data.currentPage === 1 ? 'disabled' : ''}" 
               data-page="${data.currentPage - 1}" title="Trang trước">
                <i class="fas fa-angle-left"></i>
            </a>
        `;
        
        const startPage = Math.max(1, data.currentPage - 2);
        const endPage = Math.min(data.totalPages, data.currentPage + 2);
        
        if (startPage > 1) {
            rfidPagination.innerHTML += `
                <a class="pagination-link" data-page="1">1</a>
                ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
            `;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            rfidPagination.innerHTML += `
                <a class="pagination-link ${data.currentPage === i ? 'active' : ''}" data-page="${i}">${i}</a>
            `;
        }
        
        if (endPage < data.totalPages) {
            rfidPagination.innerHTML += `
                ${endPage < data.totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
                <a class="pagination-link" data-page="${data.totalPages}">${data.totalPages}</a>
            `;
        }
        
        // Next and Last Page buttons
        rfidPagination.innerHTML += `
            <a class="pagination-link next-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.currentPage + 1}" title="Trang sau">
                <i class="fas fa-angle-right"></i>
            </a>
            <a class="pagination-link last-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.totalPages}" title="Trang cuối">
                <i class="fas fa-angle-double-right"></i>
            </a>
        `;
        
        // Event listener for pagination links
        setTimeout(() => {
            console.log('Pagination links:', document.querySelectorAll('#rfidPagination .pagination-link').length);
            document.querySelectorAll('#rfidPagination .pagination-link').forEach(link => {
                console.log('Pagination link:', link.textContent, 'data-page:', link.getAttribute('data-page'));
            });
        }, 100);
        
        document.querySelectorAll('#rfidPagination .pagination-link').forEach(link => {
            link.addEventListener('click', function() {
                if (!this.classList.contains('disabled')) {
                    const page = parseInt(this.getAttribute('data-page'));
                    if (!isNaN(page)) {
                        currentRfidPage = page;
                        loadRfids();
                        
                        // Scroll to top of the table
                        document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    function searchRfids() {
        rfidSearchTerm = rfidSearchInput.value.trim();
        currentRfidPage = 1;
        loadRfids();
        
        // Add searching class for visual feedback
        rfidSearchInput.classList.add('searching');
        setTimeout(() => {
            rfidSearchInput.classList.remove('searching');
        }, 500);
    }

    function showAddRfidModal() {
        rfidModalLabel.textContent = 'Thêm RFID mới';
        rfidId.value = '';
        rfidCode.value = '';
        rfidCode.classList.remove('is-invalid');
        rfidCodeFeedback.textContent = '';
        currentRfidId = null;
        openModal(rfidModal);
    }

    function showEditRfidModal(id) {
        rfidModalLabel.textContent = 'Chỉnh sửa RFID';
        currentRfidId = id;
        
        // Find RFID data
        const rfid = rfidsData.find(r => r.id == id);
        if (rfid) {
            rfidId.value = rfid.id;
            rfidCode.value = rfid.code;
        }
        
        rfidCode.classList.remove('is-invalid');
        rfidCodeFeedback.textContent = '';
        openModal(rfidModal);
    }
    
    function showViewRfidModal(id) {
        // Find RFID data
        const rfid = rfidsData.find(r => r.id == id);
        if (rfid) {
            // Find active RFID user association
            const activeRfidUser = rfid.rfidUsers && rfid.rfidUsers.find(ru => ru.status === true);
            const status = activeRfidUser ? 'Đã gán' : 'Chưa gán';
            const statusClass = activeRfidUser ? 'text-success' : 'text-secondary';
            const userName = activeRfidUser && activeRfidUser.user 
                ? `${activeRfidUser.user.name} (${activeRfidUser.user.user_code})` 
                : 'Không có';
            
            viewRfidId.textContent = rfid.id;
            viewRfidCode.textContent = rfid.code;
            viewRfidStatus.textContent = status;
            viewRfidStatus.className = statusClass;
            viewRfidUser.textContent = userName;
            viewRfidCreatedAt.textContent = formatDateTime(rfid.createdAt);
            viewRfidUpdatedAt.textContent = formatDateTime(rfid.updatedAt);
            
            openModal(viewRfidModal);
        }
    }

    function saveRfid() {
        // Validate form
        if (!rfidCode.value.trim()) {
            rfidCode.classList.add('is-invalid');
            rfidCodeFeedback.textContent = 'Vui lòng nhập mã RFID';
            return;
        }
        
        const rfidData = {
            code: rfidCode.value.trim()
        };
        
        // Check for duplicate code
        const checkDuplicateUrl = `/admin/api/rfids-check-duplicate?code=${encodeURIComponent(rfidData.code)}${currentRfidId ? `&id=${currentRfidId}` : ''}`;
        
        fetch(checkDuplicateUrl)
            .then(response => response.json())
            .then(data => {
                if (data.isDuplicate) {
                    rfidCode.classList.add('is-invalid');
                    rfidCodeFeedback.textContent = 'Mã RFID này đã tồn tại';
                    return Promise.reject('Duplicate RFID code');
                }
                
                const url = currentRfidId ? `/admin/api/rfids/${currentRfidId}` : '/admin/api/rfids';
                const method = currentRfidId ? 'PUT' : 'POST';
                
                return fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rfidData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(rfidModal);
                loadRfids();
                
                // Show success notification
                showNotification(
                    currentRfidId ? 'Cập nhật RFID thành công!' : 'Thêm RFID mới thành công!',
                    'success'
                );
            })
            .catch(error => {
                if (error !== 'Duplicate RFID code') {
                    console.error('Error saving RFID:', error);
                    showNotification('Đã xảy ra lỗi khi lưu RFID', 'error');
                }
            });
    }

    function showDeleteConfirmation(id) {
        currentRfidId = id;
        
        const rfid = rfidsData.find(r => r.id == id);
        deleteRfidInfo.textContent = `Mã RFID: ${rfid.code} (ID: ${rfid.id})`;
        
        openModal(deleteConfirmationModal);
        
        confirmDeleteBtn.onclick = function() {
            deleteRfid(currentRfidId);
        };
    }

    function deleteRfid(id) {
        fetch(`/admin/api/rfids/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(deleteConfirmationModal);
                loadRfids();
                showNotification('Xóa RFID thành công!', 'delete');
            })
            .catch(error => {
                console.error('Error deleting RFID:', error);
                closeModal(deleteConfirmationModal);
                showNotification(error.message || 'Đã xảy ra lỗi khi xóa RFID', 'error');
            });
    }

    // Functions - RFID User Management
    function loadRfidUsers() {
        showLoading(rfidUserTableBody);
        
        fetch(`/admin/api/rfid-users?page=${currentRfidUserPage}&search=${rfidUserSearchTerm}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    rfidUsersData = data.data;
                    renderRfidUserTable();
                    renderRfidUserPagination(data);
                } else {
                    showError(rfidUserTableBody, data.message || 'Không thể tải danh sách gán RFID');
                }
            })
            .catch(error => {
                console.error('Error loading RFID Users:', error);
                showError(rfidUserTableBody, 'Không thể tải danh sách gán RFID');
            });
    }

    function renderRfidUserTable() {
        rfidUserTableBody.innerHTML = '';
        
        if (rfidUsersData.length === 0) {
            rfidUserTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        Không có dữ liệu gán RFID
                    </td>
                </tr>
            `;
            return;
        }
        
        rfidUsersData.forEach((rfidUser, index) => {
            const status = rfidUser.status ? 'Đang hoạt động' : 'Đã vô hiệu';
            const statusClass = rfidUser.status ? 'badge bg-success' : 'badge bg-danger';
            
            rfidUserTableBody.innerHTML += `
                <tr>
                    <td>${(currentRfidUserPage - 1) * 10 + index + 1}</td>
                    <td>${rfidUser.id}</td>
                    <td>${rfidUser.rfid ? rfidUser.rfid.code : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.user_code : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.name : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.email : 'N/A'}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td class="action-btns">
                        ${rfidUser.status ? `
                            <i class="fas fa-edit edit-rfid-user-btn" 
                                data-id="${rfidUser.id}" title="Chỉnh sửa"></i>
                            <i class="fas fa-unlink unassign-rfid-btn" 
                                data-id="${rfidUser.id}" title="Hủy gán RFID"></i>
                        ` : `
                            <i class="fas fa-check-circle reactivate-rfid-btn" 
                                data-id="${rfidUser.id}" title="Kích hoạt lại"></i>
                        `}
                        <i class="fas fa-trash delete-rfid-user-btn" 
                            data-id="${rfidUser.id}" title="Xóa"></i>
                    </td>
                </tr>
            `;
        });
        
        // Event listeners for edit buttons
        document.querySelectorAll('.edit-rfid-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showEditRfidUserModal(id);
            });
        });
        
        // Event listeners for unassign buttons
        document.querySelectorAll('.unassign-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showUnassignConfirmation(id);
            });
        });
        
        // Event listeners for reactivate buttons
        document.querySelectorAll('.reactivate-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showReactivateConfirmation(id);
            });
        });
        
        // Event listeners for delete buttons
        document.querySelectorAll('.delete-rfid-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showDeleteRfidUserConfirmation(id);
            });
        });
    }

    function renderRfidUserPagination(data) {
        rfidUserPagination.innerHTML = '';
        
        if (data.totalPages <= 1) {
            return;
        }
        
        // First and Previous Page buttons
        rfidUserPagination.innerHTML += `
            <a class="pagination-link first-page ${data.currentPage === 1 ? 'disabled' : ''}" 
               data-page="1" title="Trang đầu">
                <i class="fas fa-angle-double-left"></i>
            </a>
            <a class="pagination-link prev-page ${data.currentPage === 1 ? 'disabled' : ''}" 
               data-page="${data.currentPage - 1}" title="Trang trước">
                <i class="fas fa-angle-left"></i>
            </a>
        `;
        
        // Page numbers
        const startPage = Math.max(1, data.currentPage - 2);
        const endPage = Math.min(data.totalPages, data.currentPage + 2);
        
        if (startPage > 1) {
            rfidUserPagination.innerHTML += `
                <a class="pagination-link" data-page="1">1</a>
                ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
            `;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            rfidUserPagination.innerHTML += `
                <a class="pagination-link ${data.currentPage === i ? 'active' : ''}" data-page="${i}">${i}</a>
            `;
        }
        
        if (endPage < data.totalPages) {
            rfidUserPagination.innerHTML += `
                ${endPage < data.totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
                <a class="pagination-link" data-page="${data.totalPages}">${data.totalPages}</a>
            `;
        }
        
        // Next and Last Page buttons
        rfidUserPagination.innerHTML += `
            <a class="pagination-link next-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.currentPage + 1}" title="Trang sau">
                <i class="fas fa-angle-right"></i>
            </a>
            <a class="pagination-link last-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.totalPages}" title="Trang cuối">
                <i class="fas fa-angle-double-right"></i>
            </a>
        `;
        
        // Event listener for pagination links
        document.querySelectorAll('#rfidUserPagination .pagination-link').forEach(link => {
            link.addEventListener('click', function() {
                if (!this.classList.contains('disabled')) {
                    const page = parseInt(this.getAttribute('data-page'));
                    if (!isNaN(page)) {
                        currentRfidUserPage = page;
                        loadRfidUsers();
                    }
                }
            });
        });
    }

    function searchRfidUsers() {
        rfidUserSearchTerm = rfidUserSearchInput.value.trim();
        currentRfidUserPage = 1;
        loadRfidUsers();
    }

    function showAssignRfidModal() {
        // Clear previous selections
        assignRfidSelect.innerHTML = '<option value="" selected disabled>-- Chọn RFID --</option>';
        assignUserSelect.innerHTML = '<option value="" selected disabled>-- Chọn người dùng --</option>';
        
        // Load available RFIDs
        fetch('/admin/api/available-rfids')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    data.data.forEach(rfid => {
                        assignRfidSelect.innerHTML += `<option value="${rfid.id}">${rfid.code}</option>`;
                    });
                } else {
                    showNotification('Không thể tải danh sách RFID', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading available RFIDs:', error);
                showNotification('Đã xảy ra lỗi khi tải danh sách RFID', 'error');
            });
        
        // Load available users
        fetch('/admin/api/available-users')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    data.data.forEach(user => {
                        assignUserSelect.innerHTML += `
                            <option value="${user.id}">${user.user_code} - ${user.name}</option>
                        `;
                    });
                } else {
                    showNotification('Không thể tải danh sách người dùng', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading available users:', error);
                showNotification('Đã xảy ra lỗi khi tải danh sách người dùng', 'error');
            });
        
        openModal(assignRfidModal);
    }

    function saveRfidAssignment() {
        const rfidId = assignRfidSelect.value;
        const userId = assignUserSelect.value;
        
        // Validate selections
        let isValid = true;
        
        if (!rfidId) {
            assignRfidSelect.classList.add('is-invalid');
            assignRfidSelectFeedback.textContent = 'Vui lòng chọn RFID';
            isValid = false;
        } else {
            assignRfidSelect.classList.remove('is-invalid');
            assignRfidSelectFeedback.textContent = '';
        }
        
        if (!userId) {
            assignUserSelect.classList.add('is-invalid');
            assignUserSelectFeedback.textContent = 'Vui lòng chọn người dùng';
            isValid = false;
        } else {
            assignUserSelect.classList.remove('is-invalid');
            assignUserSelectFeedback.textContent = '';
        }
        
        if (!isValid) {
            return;
        }
        
        const assignmentData = {
            rfidId: rfidId,
            userId: userId
        };
        
        fetch('/admin/api/rfid-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(assignRfidModal);
                loadRfidUsers();
                showNotification('Gán RFID cho người dùng thành công!', 'success');
            })
            .catch(error => {
                console.error('Error saving RFID assignment:', error);
                showNotification('Đã xảy ra lỗi khi gán RFID', 'error');
            });
    }

    // Thêm các chức năng còn thiếu
    function showUnassignConfirmation(id) {
        currentRfidUserId = id;
        
        const rfidUser = rfidUsersData.find(ru => ru.id == id);
        unassignRfidInfo.textContent = `Mã RFID: ${rfidUser.rfid.code}, Người dùng: ${rfidUser.user.name} (${rfidUser.user.user_code})`;
        
        openModal(unassignConfirmationModal);
        
        confirmUnassignBtn.onclick = function() {
            unassignRfid(currentRfidUserId);
        };
    }

    function unassignRfid(id) {
        fetch(`/admin/api/rfid-users/${id}/unassign`, {
            method: 'PUT'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(unassignConfirmationModal);
                loadRfidUsers();
                loadRfids(); // Reload RFID list as well to update status
                showNotification('Hủy gán RFID thành công!', 'success');
            })
            .catch(error => {
                console.error('Error unassigning RFID:', error);
                closeModal(unassignConfirmationModal);
                showNotification(error.message || 'Đã xảy ra lỗi khi hủy gán RFID', 'error');
            });
    }

    // Utility functions
    function showLoading(container) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function showError(container, message) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>${message}
                </td>
            </tr>
        `;
    }

    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        
        // Adjust icon visibility
        document.querySelector('.notification-icon .fa-check-circle').style.display = type === 'success' ? 'inline' : 'none';
        document.querySelector('.notification-icon .fa-trash-alt').style.display = type === 'delete' ? 'inline' : 'none';
        document.querySelector('.notification-icon .fa-exclamation-triangle').style.display = type === 'error' ? 'inline' : 'none';
        
        // Adjust border color
        notificationModal.className = 'notification-modal';
        notificationModal.classList.add(type);
        
        // Show notification
        notificationModal.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notificationModal.classList.add('fade-out');
            setTimeout(() => {
                notificationModal.style.display = 'none';
                notificationModal.classList.remove('fade-out');
            }, 500);
        }, 3000);
    }

    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        
        const date = new Date(dateTimeStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Modal helper functions
    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Close modals when clicking outside of them
    window.addEventListener('click', function(event) {
        if (event.target === rfidModal) closeModal(rfidModal);
        if (event.target === viewRfidModal) closeModal(viewRfidModal);
        if (event.target === assignRfidModal) closeModal(assignRfidModal);
        if (event.target === deleteConfirmationModal) closeModal(deleteConfirmationModal);
        if (event.target === unassignConfirmationModal) closeModal(unassignConfirmationModal);
        if (event.target === reactivateConfirmationModal) closeModal(reactivateConfirmationModal);
        if (event.target === editRfidUserModal) closeModal(editRfidUserModal);
        if (event.target === deleteRfidUserModal) closeModal(deleteRfidUserModal);
    });
    
    // Sửa hàm renderRfidUserTable để hiển thị nút kích hoạt lại cho các gán RFID đã vô hiệu
    function renderRfidUserTable() {
        rfidUserTableBody.innerHTML = '';
        
        if (rfidUsersData.length === 0) {
            rfidUserTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        Không có dữ liệu gán RFID
                    </td>
                </tr>
            `;
            return;
        }
        
        rfidUsersData.forEach((rfidUser, index) => {
            const status = rfidUser.status ? 'Đang hoạt động' : 'Đã vô hiệu';
            const statusClass = rfidUser.status ? 'badge bg-success' : 'badge bg-danger';
            
            rfidUserTableBody.innerHTML += `
                <tr>
                    <td>${(currentRfidUserPage - 1) * 10 + index + 1}</td>
                    <td>${rfidUser.id}</td>
                    <td>${rfidUser.rfid ? rfidUser.rfid.code : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.user_code : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.name : 'N/A'}</td>
                    <td>${rfidUser.user ? rfidUser.user.email : 'N/A'}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                    <td class="action-btns">
                        ${rfidUser.status ? `
                            <i class="fas fa-edit edit-rfid-user-btn" 
                                data-id="${rfidUser.id}" title="Chỉnh sửa"></i>
                            <i class="fas fa-unlink unassign-rfid-btn" 
                                data-id="${rfidUser.id}" title="Hủy gán RFID"></i>
                        ` : `
                            <i class="fas fa-check-circle reactivate-rfid-btn" 
                                data-id="${rfidUser.id}" title="Kích hoạt lại"></i>
                        `}
                        <i class="fas fa-trash delete-rfid-user-btn" 
                            data-id="${rfidUser.id}" title="Xóa"></i>
                    </td>
                </tr>
            `;
        });
        
        // Event listeners for edit buttons
        document.querySelectorAll('.edit-rfid-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showEditRfidUserModal(id);
            });
        });
        
        // Event listeners for unassign buttons
        document.querySelectorAll('.unassign-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showUnassignConfirmation(id);
            });
        });
        
        // Event listeners for reactivate buttons
        document.querySelectorAll('.reactivate-rfid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showReactivateConfirmation(id);
            });
        });
        
        // Event listeners for delete buttons
        document.querySelectorAll('.delete-rfid-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                showDeleteRfidUserConfirmation(id);
            });
        });
    }

    // Thêm hàm hiển thị dialog xác nhận kích hoạt lại
    function showReactivateConfirmation(id) {
        currentRfidUserId = id;
        
        const rfidUser = rfidUsersData.find(ru => ru.id == id);
        const reactivateInfo = document.getElementById('reactivateRfidInfo');
        reactivateInfo.textContent = `Mã RFID: ${rfidUser.rfid.code}, Người dùng: ${rfidUser.user.name} (${rfidUser.user.user_code})`;
        
        openModal(reactivateConfirmationModal);
        
        document.getElementById('confirmReactivateBtn').onclick = function() {
            reactivateRfidUser(currentRfidUserId);
        };
    }

    // Thêm hàm xử lý kích hoạt lại
    function reactivateRfidUser(id) {
        fetch(`/admin/api/rfid-users/${id}/reactivate`, {
            method: 'PUT'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(reactivateConfirmationModal);
                loadRfidUsers();
                loadRfids();
                showNotification('Kích hoạt lại gán RFID thành công!', 'success');
            })
            .catch(error => {
                console.error('Error reactivating RFID:', error);
                closeModal(reactivateConfirmationModal);
                showNotification(error.message || 'Đã xảy ra lỗi khi kích hoạt lại RFID', 'error');
            });
    }

    // Hàm hiển thị modal chỉnh sửa
    function showEditRfidUserModal(id) {
        currentRfidUserId = id;
        const rfidUser = rfidUsersData.find(ru => ru.id == id);
        
        editRfidUserId.value = id;
        
        // Clear previous selections
        editRfidSelect.innerHTML = '<option value="" selected disabled>-- Chọn RFID --</option>';
        editUserSelect.innerHTML = '<option value="" selected disabled>-- Chọn người dùng --</option>';
        
        // Load all RFIDs
        fetch('/admin/api/rfids')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    data.data.forEach(rfid => {
                        const isSelected = rfid.id === rfidUser.rfid_id;
                        editRfidSelect.innerHTML += `
                            <option value="${rfid.id}" ${isSelected ? 'selected' : ''}>
                                ${rfid.code}
                            </option>
                        `;
                    });
                }
            })
            .catch(error => {
                console.error('Error loading RFIDs:', error);
            });
        
        // Load all users
        fetch('/admin/api/users')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    data.data.forEach(user => {
                        const isSelected = user.id === rfidUser.student_id;
                        editUserSelect.innerHTML += `
                            <option value="${user.id}" ${isSelected ? 'selected' : ''}>
                                ${user.user_code} - ${user.name}
                            </option>
                        `;
                    });
                }
            })
            .catch(error => {
                console.error('Error loading users:', error);
            });
        
        openModal(editRfidUserModal);
        
        // Event listener for save button
        saveEditRfidUserBtn.onclick = function() {
            saveEditRfidUser();
        };
    }

    // Hàm lưu thay đổi chỉnh sửa
    function saveEditRfidUser() {
        const id = editRfidUserId.value;
        const rfidId = editRfidSelect.value;
        const userId = editUserSelect.value;
        
        // Validate form
        let isValid = true;
        
        if (!rfidId) {
            editRfidSelect.classList.add('is-invalid');
            editRfidSelectFeedback.textContent = 'Vui lòng chọn RFID';
            isValid = false;
        } else {
            editRfidSelect.classList.remove('is-invalid');
        }
        
        if (!userId) {
            editUserSelect.classList.add('is-invalid');
            editUserSelectFeedback.textContent = 'Vui lòng chọn người dùng';
            isValid = false;
        } else {
            editUserSelect.classList.remove('is-invalid');
        }
        
        if (!isValid) {
            return;
        }
        
        const data = {
            rfidId: rfidId,
            userId: userId
        };
        
        fetch(`/admin/api/rfid-users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(editRfidUserModal);
                loadRfidUsers();
                loadRfids();
                showNotification('Cập nhật gán RFID thành công!', 'success');
            })
            .catch(error => {
                console.error('Error updating RFID user:', error);
                showNotification(error.message || 'Đã xảy ra lỗi khi cập nhật gán RFID', 'error');
            });
    }

    // Hàm hiển thị xác nhận xóa
    function showDeleteRfidUserConfirmation(id) {
        currentRfidUserId = id;
        
        const rfidUser = rfidUsersData.find(ru => ru.id == id);
        deleteRfidUserInfo.textContent = `Mã RFID: ${rfidUser.rfid.code}, Người dùng: ${rfidUser.user.name} (${rfidUser.user.user_code})`;
        
        openModal(deleteRfidUserModal);
        
        confirmDeleteRfidUserBtn.onclick = function() {
            deleteRfidUser(currentRfidUserId);
        };
    }

    // Hàm xóa RFID User
    function deleteRfidUser(id) {
        fetch(`/admin/api/rfid-users/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                closeModal(deleteRfidUserModal);
                loadRfidUsers();
                loadRfids();
                showNotification('Xóa gán RFID thành công!', 'delete');
            })
            .catch(error => {
                console.error('Error deleting RFID user:', error);
                closeModal(deleteRfidUserModal);
                showNotification(error.message || 'Đã xảy ra lỗi khi xóa gán RFID', 'error');
            });
    }
});