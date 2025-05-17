document.addEventListener('DOMContentLoaded', function() {
    // Variables
    let currentDevicePage = 1;
    let deviceSearchTerm = '';
    let devicesData = [];
    let currentDeviceId = null;

    // DOM Elements - Device Management
    const deviceTableBody = document.getElementById('deviceTableBody');
    const devicePagination = document.getElementById('devicePagination');
    const devicePaginationFrom = document.getElementById('devicePaginationFrom');
    const devicePaginationTo = document.getElementById('devicePaginationTo');
    const devicePaginationTotal = document.getElementById('devicePaginationTotal');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const deviceSearchInput = document.getElementById('deviceSearchInput');
    const deviceSearchBtn = document.getElementById('deviceSearchBtn');
    
    // DOM Elements - Device Modal
    const deviceModal = document.getElementById('deviceModal');
    const deviceForm = document.getElementById('deviceForm');
    const deviceModalLabel = document.getElementById('deviceModalLabel');
    const deviceId = document.getElementById('deviceId');
    const deviceCode = document.getElementById('deviceCode');
    const deviceName = document.getElementById('deviceName');
    const deviceLocation = document.getElementById('deviceLocation');
    const deviceClass = document.getElementById('deviceClass');
    const deviceStatus = document.getElementById('deviceStatus');
    const deviceCodeFeedback = document.getElementById('deviceCodeFeedback');
    const deviceNameFeedback = document.getElementById('deviceNameFeedback');
    const deviceLocationFeedback = document.getElementById('deviceLocationFeedback');
    const deviceClassFeedback = document.getElementById('deviceClassFeedback');
    const deviceStatusFeedback = document.getElementById('deviceStatusFeedback');
    const saveDeviceBtn = document.getElementById('saveDeviceBtn');
    const closeDeviceBtns = document.querySelectorAll('.close-device-btn');
    
    // DOM Elements - View Device Modal
    const viewDeviceModal = document.getElementById('viewDeviceModal');
    const viewDeviceId = document.getElementById('viewDeviceId');
    const viewDeviceCode = document.getElementById('viewDeviceCode');
    const viewDeviceName = document.getElementById('viewDeviceName');
    const viewDeviceLocation = document.getElementById('viewDeviceLocation');
    const viewDeviceClass = document.getElementById('viewDeviceClass');
    const viewDeviceStatus = document.getElementById('viewDeviceStatus');
    const viewDeviceCreatedAt = document.getElementById('viewDeviceCreatedAt');
    const viewDeviceUpdatedAt = document.getElementById('viewDeviceUpdatedAt');
    const closeViewBtns = document.querySelectorAll('.close-view-btn');
    
    // DOM Elements - Delete Confirmation Modal
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const deleteDeviceInfo = document.getElementById('deleteDeviceInfo');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const closeDeleteBtns = document.querySelectorAll('.close-delete-btn');
    
    // DOM Elements - Notification Modal
    const notificationModal = document.getElementById('notificationModal');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // Initialize the page
    init();
    
    function init() {
        // Load initial data
        loadDevices();
        loadAvailableClasses();
        
        // Add event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Search functionality
        deviceSearchBtn.addEventListener('click', function() {
            deviceSearchTerm = deviceSearchInput.value.trim();
            currentDevicePage = 1;
            loadDevices();
        });
        
        deviceSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                deviceSearchTerm = deviceSearchInput.value.trim();
                currentDevicePage = 1;
                loadDevices();
            }
        });
        
        // Add device button
        addDeviceBtn.addEventListener('click', function() {
            openAddDeviceModal();
        });
        
        // Save device button
        saveDeviceBtn.addEventListener('click', function() {
            saveDevice();
        });
        
        // Close device modal buttons
        closeDeviceBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModal(deviceModal);
                resetDeviceForm();
            });
        });
        
        // Close view modal buttons
        closeViewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModal(viewDeviceModal);
            });
        });
        
        // Close delete confirmation modal buttons
        closeDeleteBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModal(deleteConfirmationModal);
            });
        });
        
        // Input validation for deviceCode
        deviceCode.addEventListener('input', function() {
            validateDeviceCode();
        });
    }
    
    function loadDevices() {
        showLoading(deviceTableBody);
        
        fetch(`/admin/api/devices?page=${currentDevicePage}&search=${deviceSearchTerm}`)
            .then(response => response.json())
            .then(data => {
                console.log('API Response:', data);
                if (data.success) {
                    devicesData = data.data;
                    renderDeviceTable();
                    renderDevicePagination(data);
                } else {
                    showError(deviceTableBody, data.message || 'Không thể tải danh sách thiết bị');
                }
            })
            .catch(error => {
                console.error('Error loading devices:', error);
                showError(deviceTableBody, 'Không thể tải danh sách thiết bị');
            });
    }
    
    function loadAvailableClasses() {
        fetch('/admin/api/available-classes')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderClassSelect(data.data);
                } else {
                    console.error('Error loading classes:', data.message);
                }
            })
            .catch(error => {
                console.error('Error loading classes:', error);
            });
    }
    
    function renderClassSelect(classes) {
        deviceClass.innerHTML = '<option value="">-- Chưa gán lớp học --</option>';
        
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `${cls.room_code} - ${cls.name}`;
            deviceClass.appendChild(option);
        });
    }
    
    function renderDeviceTable() {
        deviceTableBody.innerHTML = '';
        
        if (!devicesData || devicesData.length === 0) {
            deviceTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">Không có thiết bị nào</td>
                </tr>
            `;
            return;
        }
        
        devicesData.forEach((device, index) => {
            const offset = (currentDevicePage - 1) * 10;
            const row = document.createElement('tr');
            
            const statusDisplay = device.status ? 
                '<span class="badge bg-success">Hoạt động</span>' : 
                '<span class="badge bg-danger">Không hoạt động</span>';
                
            const classDisplay = device.class ? `${device.class.room_code} - ${device.class.name}` : 'Chưa gán lớp';
            
            row.innerHTML = `
                <td>${offset + index + 1}</td>
                <td>${device.device_code}</td>
                <td>${device.name}</td>
                <td>${device.location || '-'}</td>
                <td>${classDisplay}</td>
                <td>${statusDisplay}</td>
                <td class="action-btns">
                    <i class="fas fa-eye view-device-btn" title="Xem chi tiết"></i>
                    <i class="fas fa-edit edit-device-btn" title="Chỉnh sửa"></i>
                    <i class="fas fa-trash delete-device-btn" title="Xóa"></i>
                </td>
            `;
            
            deviceTableBody.appendChild(row);
            
            // Add event listeners to action buttons
            const viewBtn = row.querySelector('.view-device-btn');
            const editBtn = row.querySelector('.edit-device-btn');
            const deleteBtn = row.querySelector('.delete-device-btn');
            
            viewBtn.addEventListener('click', () => viewDevice(device.id));
            editBtn.addEventListener('click', () => openEditDeviceModal(device.id));
            deleteBtn.addEventListener('click', () => showDeleteConfirmation(device.id));
        });
    }
    
    function renderDevicePagination(data) {
        console.log('Rendering pagination:', data);
        devicePagination.innerHTML = '';
        
        if (!data.totalPages || data.totalPages <= 1) {
            console.log('No pagination needed');
            return;
        }
        
        // First and Previous Page buttons
        devicePagination.innerHTML += `
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
            devicePagination.innerHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            devicePagination.innerHTML += `
                <a class="pagination-link ${i === data.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </a>
            `;
        }
        
        if (endPage < data.totalPages) {
            devicePagination.innerHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        
        // Next and Last Page buttons
        devicePagination.innerHTML += `
            <a class="pagination-link next-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.currentPage + 1}" title="Trang tiếp">
                <i class="fas fa-angle-right"></i>
            </a>
            <a class="pagination-link last-page ${data.currentPage === data.totalPages ? 'disabled' : ''}" 
               data-page="${data.totalPages}" title="Trang cuối">
                <i class="fas fa-angle-double-right"></i>
            </a>
        `;
        
        // Add event listeners for pagination
        document.querySelectorAll('#devicePagination .pagination-link:not(.disabled)').forEach(link => {
            link.addEventListener('click', function() {
                currentDevicePage = parseInt(this.getAttribute('data-page'));
                loadDevices();
            });
        });
    }
    
    function openAddDeviceModal() {
        resetDeviceForm();
        deviceModalLabel.textContent = 'Thêm thiết bị mới';
        deviceId.value = '';
        currentDeviceId = null;
        openModal(deviceModal);
    }
    
    function openEditDeviceModal(id) {
        resetDeviceForm();
        deviceModalLabel.textContent = 'Cập nhật thiết bị';
        currentDeviceId = id;
        
        const device = devicesData.find(d => d.id == id);
        if (device) {
            deviceId.value = device.id;
            deviceCode.value = device.device_code;
            deviceName.value = device.name;
            deviceLocation.value = device.location || '';
            deviceClass.value = device.class_id || '';
            deviceStatus.value = device.status.toString();
            
            openModal(deviceModal);
        } else {
            // Fetch device details if not found in current data
            fetch(`/admin/api/devices/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const device = data.data;
                        deviceId.value = device.id;
                        deviceCode.value = device.device_code;
                        deviceName.value = device.name;
                        deviceLocation.value = device.location || '';
                        deviceClass.value = device.class_id || '';
                        deviceStatus.value = device.status.toString();
                        
                        openModal(deviceModal);
                    } else {
                        showNotification('Không thể tải thông tin thiết bị', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error loading device details:', error);
                    showNotification('Không thể tải thông tin thiết bị', 'error');
                });
        }
    }
    
    function viewDevice(id) {
        const device = devicesData.find(d => d.id == id);
        if (device) {
            fillViewModal(device);
            openModal(viewDeviceModal);
        } else {
            // Fetch device details if not found in current data
            fetch(`/admin/api/devices/${id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        fillViewModal(data.data);
                        openModal(viewDeviceModal);
                    } else {
                        showNotification('Không thể tải thông tin thiết bị', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error loading device details:', error);
                    showNotification('Không thể tải thông tin thiết bị', 'error');
                });
        }
    }
    
    function fillViewModal(device) {
        viewDeviceId.textContent = device.id;
        viewDeviceCode.textContent = device.device_code;
        viewDeviceName.textContent = device.name;
        viewDeviceLocation.textContent = device.location || '-';
        
        const classDisplay = device.class ? `${device.class.room_code} - ${device.class.name}` : 'Chưa gán lớp';
        viewDeviceClass.textContent = classDisplay;
        
        const statusDisplay = device.status ? 
            '<span class="badge bg-success">Hoạt động</span>' : 
            '<span class="badge bg-danger">Không hoạt động</span>';
        viewDeviceStatus.innerHTML = statusDisplay;
        
        viewDeviceCreatedAt.textContent = formatDateTime(device.createdAt);
        viewDeviceUpdatedAt.textContent = formatDateTime(device.updatedAt);
    }
    
    function showDeleteConfirmation(id) {
        const device = devicesData.find(d => d.id == id);
        if (device) {
            currentDeviceId = id;
            deleteDeviceInfo.textContent = `Mã thiết bị: ${device.device_code}, Tên: ${device.name}`;
            
            openModal(deleteConfirmationModal);
            
            confirmDeleteBtn.onclick = function() {
                deleteDevice(currentDeviceId);
            };
        }
    }
    
    function saveDevice() {
        // Validate form
        if (!validateDeviceForm()) {
            return;
        }
        
        // Prepare data
        const deviceData = {
            device_code: deviceCode.value.trim(),
            name: deviceName.value.trim(),
            location: deviceLocation.value.trim(),
            class_id: deviceClass.value || null,
            status: deviceStatus.value === 'true'
        };
        
        // API URL and method
        const url = currentDeviceId ? 
            `/admin/api/devices/${currentDeviceId}` : 
            '/admin/api/devices';
        const method = currentDeviceId ? 'PUT' : 'POST';
        
        // Check for duplicate device code
        checkDuplicateDeviceCode(deviceData.device_code)
            .then(isDuplicate => {
                if (isDuplicate && (!currentDeviceId || deviceData.device_code !== devicesData.find(d => d.id == currentDeviceId)?.device_code)) {
                    deviceCode.classList.add('is-invalid');
                    deviceCodeFeedback.textContent = 'Mã thiết bị đã tồn tại';
                    return Promise.reject('Mã thiết bị đã tồn tại');
                }
                
                // If no duplicate, proceed with save
                return fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deviceData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    closeModal(deviceModal);
                    resetDeviceForm();
                    loadDevices();
                    
                    const message = currentDeviceId ? 
                        'Cập nhật thiết bị thành công!' : 
                        'Thêm mới thiết bị thành công!';
                    showNotification(message, 'success');
                    
                    currentDeviceId = null;
                } else {
                    showNotification(data.message || 'Đã xảy ra lỗi', 'error');
                }
            })
            .catch(error => {
                console.error('Error saving device:', error);
                if (error !== 'Mã thiết bị đã tồn tại') {
                    showNotification('Đã xảy ra lỗi khi lưu thiết bị', 'error');
                }
            });
    }
    
    function deleteDevice(id) {
        fetch(`/admin/api/devices/${id}`, {
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
                if (data.success) {
                    loadDevices();
                    showNotification('Xóa thiết bị thành công!', 'delete');
                } else {
                    showNotification(data.message || 'Đã xảy ra lỗi khi xóa thiết bị', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting device:', error);
                closeModal(deleteConfirmationModal);
                showNotification(error.message || 'Đã xảy ra lỗi khi xóa thiết bị', 'error');
            });
    }
    
    function checkDuplicateDeviceCode(code) {
        const url = `/admin/api/devices/check-duplicate?deviceCode=${encodeURIComponent(code)}${currentDeviceId ? `&id=${currentDeviceId}` : ''}`;
        
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    return data.isDuplicate;
                } else {
                    console.error('Error checking device code:', data.message);
                    return false;
                }
            })
            .catch(error => {
                console.error('Error checking device code:', error);
                return false;
            });
    }
    
    function validateDeviceCode() {
        const code = deviceCode.value.trim();
        
        // Clear previous validation
        deviceCode.classList.remove('is-invalid');
        deviceCodeFeedback.textContent = '';
        
        // Check empty
        if (!code) {
            deviceCode.classList.add('is-invalid');
            deviceCodeFeedback.textContent = 'Mã thiết bị không được để trống';
            return false;
        }
        
        // Check format (alphanumeric with hyphens and underscores)
        const codeRegex = /^[a-zA-Z0-9_-]+$/;
        if (!codeRegex.test(code)) {
            deviceCode.classList.add('is-invalid');
            deviceCodeFeedback.textContent = 'Mã thiết bị chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
            return false;
        }
        
        return true;
    }
    
    function validateDeviceForm() {
        let isValid = true;
        
        // Validate device code
        if (!validateDeviceCode()) {
            isValid = false;
        }
        
        // Validate name
        const name = deviceName.value.trim();
        deviceName.classList.remove('is-invalid');
        deviceNameFeedback.textContent = '';
        
        if (!name) {
            deviceName.classList.add('is-invalid');
            deviceNameFeedback.textContent = 'Tên thiết bị không được để trống';
            isValid = false;
        }
        
        // Validate location
        const location = deviceLocation.value.trim();
        deviceLocation.classList.remove('is-invalid');
        deviceLocationFeedback.textContent = '';
        
        if (!location) {
            deviceLocation.classList.add('is-invalid');
            deviceLocationFeedback.textContent = 'Vị trí thiết bị không được để trống';
            isValid = false;
        }
        
        return isValid;
    }
    
    function resetDeviceForm() {
        deviceForm.reset();
        
        // Clear validation
        deviceCode.classList.remove('is-invalid');
        deviceName.classList.remove('is-invalid');
        deviceLocation.classList.remove('is-invalid');
        deviceClass.classList.remove('is-invalid');
        deviceStatus.classList.remove('is-invalid');
        
        deviceCodeFeedback.textContent = '';
        deviceNameFeedback.textContent = '';
        deviceLocationFeedback.textContent = '';
        deviceClassFeedback.textContent = '';
        deviceStatusFeedback.textContent = '';
    }
    
    // Utility functions
    function showLoading(container) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
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
                <td colspan="7" class="text-center text-danger">
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
    
    function openModal(modal) {
        modal.style.display = 'block';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    // Close modals when clicking outside of them
    window.addEventListener('click', function(event) {
        if (event.target === deviceModal) closeModal(deviceModal);
        if (event.target === viewDeviceModal) closeModal(viewDeviceModal);
        if (event.target === deleteConfirmationModal) closeModal(deleteConfirmationModal);
    });
});