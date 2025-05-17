document.addEventListener('DOMContentLoaded', function() {
    // Code xử lý sidebar - Sửa lại để phù hợp với cấu trúc HTML hiện tại
    const toggleButton = document.querySelector('label.open');
    const content = document.querySelector('.content');
    const checkboxSidebar = document.getElementById('open');
    
    if (toggleButton) {
        console.log('Tìm thấy nút toggle sidebar');
        toggleButton.addEventListener('click', function() {
            console.log('Đã click vào nút toggle');
            // Không cần thêm sự kiện click vì checkbox và label đã xử lý việc này
            // Chỉ thêm class để hỗ trợ CSS nếu cần
            content.classList.toggle('sidebar-open');
        });
    }
    
    // Thêm sự kiện để theo dõi trạng thái checkbox
    if (checkboxSidebar) {
        checkboxSidebar.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('has-sidebar-open');
                content.classList.add('sidebar-open');
            } else {
                document.body.classList.remove('has-sidebar-open');
                content.classList.remove('sidebar-open');
            }
        });
    }
    
    // Kiểm tra trạng thái ban đầu của checkbox
    if (checkboxSidebar && checkboxSidebar.checked) {
        document.body.classList.add('has-sidebar-open');
        content.classList.add('sidebar-open');
    }
    
    // Tiếp tục các chức năng khác
    // Fetch dashboard data
    fetchDashboardData();
    
    // Set up chart filter event
    const attendanceChartFilter = document.getElementById('attendanceChartFilter');
    if (attendanceChartFilter) {
        attendanceChartFilter.addEventListener('change', function() {
            fetchAttendanceData(this.value);
        });
    }
    
    // Initialize charts
    initAttendanceChart();
    initClassTypeChart();
    
    // Fetch component data
    fetchCurrentClassSessions();
    fetchDeviceStatus();
    fetchRecentActivities();
});

// Fetch all dashboard data
function fetchDashboardData() {
    fetch('/admin/api/dashboard/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatCards(data.stats);
            }
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
        });
}

// Update stat cards with data
function updateStatCards(stats) {
    document.getElementById('studentCount').textContent = stats.studentCount.toLocaleString();
    document.getElementById('classSessionCount').textContent = stats.classSessionCount.toLocaleString();
    document.getElementById('teacherCount').textContent = stats.teacherCount.toLocaleString();
    document.getElementById('deviceCount').textContent = stats.deviceCount.toLocaleString();
}

// Initialize attendance chart
function initAttendanceChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    window.attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Đúng giờ',
                    data: [],
                    backgroundColor: 'rgba(51, 153, 255, 0.2)',
                    borderColor: '#3399FF',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Đi muộn',
                    data: [],
                    backgroundColor: 'rgba(251, 188, 5, 0.2)',
                    borderColor: '#fbbc05',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Vắng mặt',
                    data: [],
                    backgroundColor: 'rgba(234, 67, 53, 0.2)',
                    borderColor: '#ea4335',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load initial data
    fetchAttendanceData('week');
}

// Fetch attendance data for chart
function fetchAttendanceData(period) {
    fetch(`/admin/api/dashboard/attendance?period=${period}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateAttendanceChart(data.attendance);
            }
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
        });
}

// Update the attendance chart with data
function updateAttendanceChart(data) {
    window.attendanceChart.data.labels = data.labels;
    window.attendanceChart.data.datasets[0].data = data.onTime;
    window.attendanceChart.data.datasets[1].data = data.late;
    window.attendanceChart.data.datasets[2].data = data.absent;
    window.attendanceChart.update();
}

// Initialize class type chart
function initClassTypeChart() {
    const ctx = document.getElementById('classTypeChart').getContext('2d');
    
    window.classTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Lý thuyết', 'Thực hành'],
            datasets: [
                {
                    data: [0, 0],
                    backgroundColor: ['#3399FF', '#34a853'],
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Load data
    fetchClassTypeData();
}

// Fetch class type distribution data
function fetchClassTypeData() {
    fetch('/admin/api/dashboard/classtype')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.classTypeChart.data.datasets[0].data = [data.theory, data.practice];
                window.classTypeChart.update();
            }
        })
        .catch(error => {
            console.error('Error fetching class type data:', error);
        });
}

// Fetch current class sessions
function fetchCurrentClassSessions() {
    const container = document.getElementById('currentClassSessions');
    
    fetch('/admin/api/dashboard/currentsessions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                container.innerHTML = '';
                
                if (data.sessions && data.sessions.length > 0) {
                    data.sessions.forEach(session => {
                        container.appendChild(createClassSessionRow(session));
                    });
                } else {
                    container.innerHTML = '<tr><td colspan="4" class="no-data">Không có học phần nào đang diễn ra</td></tr>';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching current class sessions:', error);
            container.innerHTML = '<tr><td colspan="4" class="error">Không thể tải dữ liệu học phần</td></tr>';
        });
}

// Create class session table row
function createClassSessionRow(session) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${session.class_code}</td>
        <td>${session.name}</td>
        <td>${session.teacher_name || 'Chưa phân công'}</td>
        <td><span class="status ${session.active ? 'delivered' : 'pending'}">${session.active ? 'Đang diễn ra' : 'Kết thúc'}</span></td>
    `;
    
    return row;
}

// Fetch device status
function fetchDeviceStatus() {
    const container = document.getElementById('recentDevices');
    
    fetch('/admin/api/dashboard/devices')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                container.innerHTML = '';
                
                if (data.devices && data.devices.length > 0) {
                    data.devices.forEach(device => {
                        container.appendChild(createDeviceElement(device));
                    });
                } else {
                    container.innerHTML = '<div class="no-data">Không có thiết bị nào</div>';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching device status:', error);
            container.innerHTML = '<div class="error">Không thể tải dữ liệu thiết bị</div>';
        });
}

// Create device element
function createDeviceElement(device) {
    const element = document.createElement('div');
    element.className = 'device-item';
    
    element.innerHTML = `
        <div class="device-icon">
            <i class="fas fa-microchip"></i>
        </div>
        <div class="device-info">
            <h4>${device.name}</h4>
            <p>${device.device_code} - ${device.location || 'N/A'}</p>
        </div>
        <div class="device-status ${device.status ? 'status-online' : 'status-offline'}" 
             title="${device.status ? 'Online' : 'Offline'}">
        </div>
    `;
    
    return element;
}

// Fetch recent activities
function fetchRecentActivities() {
    const container = document.getElementById('recentActivities');
    
    fetch('/admin/api/dashboard/activities')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                container.innerHTML = '';
                
                if (data.activities && data.activities.length > 0) {
                    data.activities.forEach(activity => {
                        container.appendChild(createActivityElement(activity));
                    });
                } else {
                    container.innerHTML = '<div class="no-data">Không có hoạt động nào gần đây</div>';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching recent activities:', error);
            container.innerHTML = '<div class="error">Không thể tải dữ liệu hoạt động</div>';
        });
}

// Create activity element
function createActivityElement(activity) {
    const element = document.createElement('div');
    element.className = 'activity-item';
    
    let iconClass = 'icon-attendance';
    if (activity.type === 'class') iconClass = 'icon-class';
    if (activity.type === 'device') iconClass = 'icon-device';
    
    element.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="fas ${getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
            <p>${activity.message}</p>
            <span class="activity-time">${formatTime(activity.timestamp)}</span>
        </div>
    `;
    
    return element;
}

// Get icon for activity type
function getActivityIcon(type) {
    switch(type) {
        case 'attendance': return 'fa-user-check';
        case 'class': return 'fa-chalkboard';
        case 'device': return 'fa-microchip';
        default: return 'fa-bell';
    }
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}