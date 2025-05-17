document.addEventListener('DOMContentLoaded', function () {
    // Tải thống kê tổng quan
    loadQuickStats();

    // Tải dữ liệu cho mỗi tab
    loadTodaySchedules();
    loadUpcomingSchedules();
    loadTeachingClasses();
    loadNotifications();
    loadAttendanceIssues();

    // Cập nhật số buổi dạy hôm nay
    updateTodayCount();

    // Xử lý modal điểm danh
    const attendanceModal = document.getElementById('attendanceModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    closeModalButtons.forEach(button => {
        button.addEventListener('click', function () {
            attendanceModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target == attendanceModal) {
            attendanceModal.style.display = 'none';
        }
    });

    // Xử lý nút bắt đầu điểm danh
    document.getElementById('startAttendanceBtn').addEventListener('click', function () {
        const classId = this.getAttribute('data-class-id');
        const scheduleId = this.getAttribute('data-schedule-id');
        const method = document.getElementById('attendanceMethod').value;
        const time = document.getElementById('attendanceTime').value;

        startAttendanceSession(classId, scheduleId, method, time);
    });
});

// Tải dữ liệu thống kê nhanh
function loadQuickStats() {
    fetch('/teacher/api/dashboard/quickstats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải thống kê nhanh');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.stats) {
                document.getElementById('classesCount').textContent = data.stats.classesCount || 0;
                document.getElementById('sessionsTaught').textContent = data.stats.sessionsTaught || 0;
                document.getElementById('totalSessions').textContent = data.stats.totalSessions || 0;
                document.getElementById('attendanceRate').textContent = (data.stats.attendanceRate || 0) + '%';
            }
        })
        .catch(error => {
            console.error('Error loading quick stats:', error);
            document.querySelector('.stats-overview').innerHTML += `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải dữ liệu thống kê</p>
                </div>`;
        });
}

// Tải lịch dạy hôm nay
function loadTodaySchedules() {
    fetch('/teacher/api/dashboard/todayschedules')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải lịch dạy hôm nay');
            }
            return response.json();
        })
        .then(data => {
            const scheduleList = document.getElementById('todayScheduleList');

            if (data.success && data.schedules && data.schedules.length > 0) {
                let html = '';
                data.schedules.forEach(schedule => {
                    let statusClass = '';
                    let statusText = '';
                    let actionButton = '';

                    if (schedule.attendanceStatus === 'completed') {
                        statusClass = 'status-completed';
                        statusText = 'Đã điểm danh';
                        actionButton = `<button class="btn btn-view" onclick="viewAttendance(${schedule.attendanceSessionId})">Xem chi tiết</button>`;
                    } else if (schedule.attendanceStatus === 'in-progress') {
                        statusClass = 'status-in-progress';
                        statusText = 'Đang điểm danh';
                        actionButton = `<button class="btn btn-view" onclick="viewAttendance(${schedule.attendanceSessionId})">Xem điểm danh</button>`;
                    } else {
                        statusClass = 'status-pending';
                        statusText = 'Chưa điểm danh';
                        actionButton = `<button class="btn btn-primary" onclick="startAttendance(${schedule.classSessionId}, ${schedule.scheduleId}, '${schedule.className}')">Bắt đầu điểm danh</button>`;
                    }

                    html += `
                        <tr>
                            <td>${schedule.className}</td>
                            <td>${schedule.timeStart.substring(0, 5)} - ${schedule.timeEnd.substring(0, 5)}</td>
                            <td>${schedule.classroom || 'N/A'}</td>
                            <td class="${statusClass}">${statusText}</td>
                            <td>${actionButton}</td>
                        </tr>
                    `;
                });
                scheduleList.innerHTML = html;
            } else {
                scheduleList.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-data">Không có lịch dạy nào hôm nay</td>
                    </tr>`;
            }
        })
        .catch(error => {
            console.error('Error loading today schedules:', error);
            document.getElementById('todayScheduleList').innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Không thể tải lịch dạy hôm nay</p>
                    </td>
                </tr>`;
        });
}

// Cập nhật số buổi dạy hôm nay
function updateTodayCount() {
    fetch('/teacher/api/dashboard/todayschedules')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('todayCount').textContent = data.schedules ? data.schedules.length : 0;
            }
        })
        .catch(error => {
            console.error('Error updating today count:', error);
        });
}

// Tải lịch dạy sắp tới
function loadUpcomingSchedules() {
    fetch('/teacher/api/dashboard/upcomingschedules')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải lịch dạy sắp tới');
            }
            return response.json();
        })
        .then(data => {
            const upcomingScheduleList = document.getElementById('upcomingScheduleList');

            if (data.success && data.schedules && data.schedules.length > 0) {
                // Nhóm lịch học theo ngày
                const groupedSchedules = {};
                data.schedules.forEach(schedule => {
                    if (!groupedSchedules[schedule.date]) {
                        groupedSchedules[schedule.date] = [];
                    }
                    groupedSchedules[schedule.date].push(schedule);
                });

                let html = '';
                // Hiển thị lịch học theo từng ngày (tối đa 5 ngày)
                const dates = Object.keys(groupedSchedules);
                const displayDates = dates.slice(0, 5);

                displayDates.forEach(date => {
                    html += `<div class="schedule-day">
                        <h4 class="day-header">${date}</h4>
                        <div class="day-schedules">`;

                    groupedSchedules[date].forEach(schedule => {
                        const bgClass = schedule.isToday ? 'today-schedule' : '';
                        html += `
                            <div class="schedule-item ${bgClass}">
                                <div class="schedule-time">${schedule.timeStart.substring(0, 5)} - ${schedule.timeEnd.substring(0, 5)}</div>
                                <div class="schedule-details">
                                    <h4>${schedule.className}</h4>
                                    <p><i class="fas fa-map-marker-alt"></i> ${schedule.classroom || 'N/A'}</p>
                                </div>
                            </div>
                        `;
                    });

                    html += `</div></div>`;
                });
                upcomingScheduleList.innerHTML = html;
            } else {
                upcomingScheduleList.innerHTML = '<div class="no-data">Không có lịch dạy sắp tới</div>';
            }
        })
        .catch(error => {
            console.error('Error loading upcoming schedules:', error);
            document.getElementById('upcomingScheduleList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải lịch dạy sắp tới</p>
                </div>`;
        });
}

// Tải danh sách lớp học phần
function loadTeachingClasses() {
    fetch('/teacher/api/dashboard/teachingclasses')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách lớp học phần');
            }
            return response.json();
        })
        .then(data => {
            const classesList = document.getElementById('classesList');

            if (data.success && data.classes && data.classes.length > 0) {
                let html = '';
                data.classes.forEach(classItem => {
                    let scheduleText = classItem.schedule ? classItem.schedule : 'Chưa có lịch';

                    html += `
                        <div class="class-card">
                            <div class="class-info">
                                <h4>${classItem.subjectName}</h4>
                                <p class="class-code">${classItem.classCode}</p>
                                <p class="class-schedule"><i class="fas fa-clock"></i> ${scheduleText}</p>
                                <p class="class-students"><i class="fas fa-user-graduate"></i> ${classItem.studentCount} sinh viên</p>
                            </div>
                            <div class="class-actions">
                                <button class="btn btn-primary" onclick="goToClass(${classItem.id})">Vào lớp</button>
                            </div>
                        </div>
                    `;
                });
                classesList.innerHTML = html;
            } else {
                classesList.innerHTML = '<div class="no-data">Không có lớp học phần nào</div>';
            }
        })
        .catch(error => {
            console.error('Error loading teaching classes:', error);
            document.getElementById('classesList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải danh sách lớp học phần</p>
                </div>`;
        });
}

// Tải thông báo nhắc nhở
function loadNotifications() {
    fetch('/teacher/api/dashboard/notifications')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải thông báo nhắc nhở');
            }
            return response.json();
        })
        .then(data => {
            const notificationList = document.getElementById('notificationList');

            if (data.success && data.notifications && data.notifications.length > 0) {
                let html = '';
                data.notifications.forEach(notification => {
                    let iconClass = 'fa-bell';
                    let iconType = '';
                    if (notification.type === 'attendance') {
                        iconClass = 'fa-clipboard-list';
                        iconType = 'icon-attendance';
                    }
                    if (notification.type === 'warning') {
                        iconClass = 'fa-exclamation-triangle';
                        iconType = 'icon-device';
                    }

                    html += `
                        <li class="activity-item">
                            <div class="activity-icon ${iconType}">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="activity-content">
                                <p>${notification.message}</p>
                                <span class="activity-time">${notification.timeAgo}</span>
                            </div>
                        </li>
                    `;
                });
                notificationList.innerHTML = html;
            } else {
                notificationList.innerHTML = '<li class="no-data">Không có thông báo nào</li>';
            }
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
            document.getElementById('notificationList').innerHTML = `
                <li class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải thông báo nhắc nhở</p>
                </li>`;
        });
}

// Tải tình hình chuyên cần
function loadAttendanceIssues() {
    fetch('/teacher/api/dashboard/attendanceissues')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải danh sách vấn đề chuyên cần');
            }
            return response.json();
        })
        .then(data => {
            const attendanceIssuesList = document.getElementById('attendanceIssuesList');

            if (data.success && data.issues && data.issues.length > 0) {
                let html = '';
                data.issues.forEach(issue => {
                    let severityClass = '';
                    if (issue.absentPercentage >= 30) severityClass = 'high-severity';
                    else if (issue.absentPercentage >= 20) severityClass = 'medium-severity';

                    html += `
                        <li class="activity-item ${severityClass}">
                            <div class="activity-icon ${issue.absentPercentage >= 30 ? 'icon-device' : 'icon-class'}">
                                <i class="fas fa-user-clock"></i>
                            </div>
                            <div class="activity-content">
                                <p><strong>${issue.studentName}</strong> (${issue.studentCode})</p>
                                <p>${issue.className}</p>
                                <p class="issue-stats">
                                    <span class="absent-count">Vắng ${issue.absentCount}/${issue.totalSessions} buổi</span>
                                    <span class="absent-percentage">(${issue.absentPercentage}%)</span>
                                </p>
                            </div>
                        </li>
                    `;
                });
                attendanceIssuesList.innerHTML = html;
            } else {
                attendanceIssuesList.innerHTML = '<li class="no-data">Không phát hiện vấn đề chuyên cần nào</li>';
            }
        })
        .catch(error => {
            console.error('Error loading attendance issues:', error);
            document.getElementById('attendanceIssuesList').innerHTML = `
                <li class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải danh sách vấn đề chuyên cần</p>
                </li>`;
        });
}

// Hàm hiển thị modal điểm danh
function startAttendance(classId, scheduleId, className) {
    // Điền thông tin vào modal
    document.getElementById('attendanceClassName').textContent = className;
    document.getElementById('startAttendanceBtn').setAttribute('data-class-id', classId);
    document.getElementById('startAttendanceBtn').setAttribute('data-schedule-id', scheduleId);

    // Hiển thị modal
    document.getElementById('attendanceModal').style.display = 'block';
}

// Bắt đầu phiên điểm danh
function startAttendanceSession(classId, scheduleId, method, duration) {
    fetch('/teacher/api/attendance/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            classSessionId: classId,
            scheduleId: scheduleId,
            method: method,
            duration: duration
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('attendanceModal').style.display = 'none';
                // Chuyển hướng tới trang điểm danh
                window.location.href = '/teacher/attendance/session/' + data.attendanceSessionId;
            } else {
                alert('Không thể bắt đầu điểm danh: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error starting attendance:', error);
            alert('Đã xảy ra lỗi khi bắt đầu điểm danh');
        });
}

// Hàm xem chi tiết điểm danh
function viewAttendance(attendanceSessionId) {
    window.location.href = '/teacher/attendance/session/' + attendanceSessionId;
}

// Hàm chuyển đến trang lớp học phần
function goToClass(classId) {
    window.location.href = '/teacher/classSession/' + classId;
}

// Hiển thị lịch dạy theo ngày
function renderDayView() {
    const tableBody = document.getElementById('day-schedule-events');
    tableBody.innerHTML = '';

    // Lọc sự kiện trong ngày hiện tại
    const currentDateStr = formatDateForAPI(currentDate);
    const dayEvents = filteredSchedules.filter(event => event.date === currentDateStr);

    // Nếu không có sự kiện nào
    if (dayEvents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="no-data-cell">
                <div class="no-events">
                    <p>Không có buổi học nào vào ngày này</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Sắp xếp sự kiện theo thời gian bắt đầu
    dayEvents.sort((a, b) => {
        const startTimeA = a.startTime.split(':').map(Number);
        const startTimeB = b.startTime.split(':').map(Number);

        if (startTimeA[0] !== startTimeB[0]) {
            return startTimeA[0] - startTimeB[0]; // So sánh giờ
        }
        return startTimeA[1] - startTimeB[1]; // So sánh phút
    });

    // Thêm các sự kiện vào bảng
    dayEvents.forEach((event, index) => {
        const row = document.createElement('tr');
        row.className = 'event-row';
        row.dataset.eventId = event.id;

        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>${event.startTime} - ${event.endTime}</td>
            <td>${event.classSession?.name || 'N/A'}</td>
            <td>${event.subject?.name || 'N/A'}</td>
            <td>${event.class?.room_code || 'N/A'}</td>
        `;

        // Sự kiện click để hiển thị chi tiết
        row.addEventListener('click', () => {
            showEventDetails(event);
        });

        tableBody.appendChild(row);
    });
}

// Hiển thị lịch dạy theo tháng
function renderMonthView() {
    try {
        // Cập nhật tiêu đề tháng
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        // Kiểm tra phần tử có tồn tại không trước khi cập nhật
        const monthTitle = document.getElementById('month-title');
        if (monthTitle) {
            monthTitle.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }

        console.log("Đang render lịch tháng...");

        // Render lịch tháng
        renderCalendarGrid();

        // Render danh sách sự kiện trong tháng
        renderMonthEventsList();

    } catch (error) {
        console.error("Lỗi khi hiển thị lịch tháng:", error);
        // Hiển thị thông báo lỗi trong grid nếu có lỗi
        const calendarGrid = document.getElementById('month-calendar-grid');
        if (calendarGrid) {
            calendarGrid.innerHTML = `
                <div class="error-message" style="grid-column: span 7;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải lịch tháng. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
}

// Hiển thị lưới lịch tháng
function renderCalendarGrid() {
    const calendarGrid = document.getElementById('month-calendar-grid');

    // Kiểm tra xem phần tử có tồn tại không
    if (!calendarGrid) {
        console.error("Không tìm thấy phần tử month-calendar-grid");
        return;
    }

    calendarGrid.innerHTML = '';

    console.log("Đang render lịch grid...");

    // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    console.log("Tháng hiện tại:", firstDayOfMonth, "-", lastDayOfMonth);

    // Lấy ngày đầu tuần (thứ Hai) của tuần chứa ngày đầu tiên của tháng
    const startDate = getStartOfWeek(new Date(firstDayOfMonth));

    // Tính toán ngày cuối cùng cần hiển thị (đảm bảo đủ 6 tuần)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 41); // 6 tuần x 7 ngày - 1

    console.log("Hiển thị từ:", startDate, "đến:", endDate);

    // Tạo các ô ngày trong lịch
    const currentDateCopy = new Date(startDate);
    while (currentDateCopy <= endDate) {
        try {
            const isCurrentMonth = currentDateCopy.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(currentDateCopy, new Date());
            const dateStr = formatDateForAPI(currentDateCopy);

            // Kiểm tra xem ngày này có sự kiện không
            // Đảm bảo filteredSchedules đã được định nghĩa và không phải null
            const filteredSchedulesArray = Array.isArray(filteredSchedules) ? filteredSchedules : [];
            const dayEvents = filteredSchedulesArray.filter(event => event && event.date === dateStr);
            const hasEvents = dayEvents && dayEvents.length > 0;

            // Tạo ô cho ngày hiện tại
            const dayCell = document.createElement('div');
            dayCell.className = `calendar-day${isCurrentMonth ? '' : ' other-month'}${isToday ? ' today' : ''}${hasEvents ? ' has-events' : ''}`;
            dayCell.dataset.date = dateStr;

            // Tạo nội dung cho ô ngày
            let eventIndicators = '';
            if (hasEvents) {
                // Giới hạn hiển thị tối đa 3 chỉ báo sự kiện
                const maxIndicators = Math.min(dayEvents.length, 3);
                for (let i = 0; i < maxIndicators; i++) {
                    eventIndicators += '<div class="event-indicator"></div>';
                }

                if (dayEvents.length > 3) {
                    eventIndicators += `<div class="event-more">+${dayEvents.length - 3}</div>`;
                }
            }

            dayCell.innerHTML = `
                <div class="day-number">${currentDateCopy.getDate()}</div>
                <div class="event-indicators">${eventIndicators}</div>
            `;

            // Sự kiện click vào ngày trên lịch
            if (hasEvents) {
                dayCell.addEventListener('click', function () {
                    // Highlight ngày được chọn
                    document.querySelectorAll('.calendar-day').forEach(cell => {
                        cell.classList.remove('selected');
                    });
                    this.classList.add('selected');

                    // Hiển thị các sự kiện trong ngày được chọn
                    showDayEvents(dateStr);
                });
            }

            calendarGrid.appendChild(dayCell);
        } catch (error) {
            console.error("Lỗi khi tạo ô ngày:", error, "cho ngày:", currentDateCopy);
        }

        // Tăng ngày lên 1
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
}

// Hiển thị sự kiện của ngày được chọn trong lịch tháng
function showDayEvents(dateStr) {
    // Kiểm tra xem phần tử có tồn tại không
    const tableBody = document.getElementById('month-events-list');
    if (!tableBody) {
        console.error("Không tìm thấy phần tử month-events-list");
        return;
    }

    tableBody.innerHTML = '';

    // Lọc sự kiện trong ngày được chọn
    // Đảm bảo filteredSchedules đã được định nghĩa và không phải null
    const filteredSchedulesArray = Array.isArray(filteredSchedules) ? filteredSchedules : [];
    const dayEvents = filteredSchedulesArray.filter(event => event && event.date === dateStr);

    // Nếu không có sự kiện nào
    if (!dayEvents || dayEvents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="no-data-cell">
                <div class="no-events">
                    <p>Không có buổi học nào vào ngày này</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Sắp xếp sự kiện theo thời gian bắt đầu
    dayEvents.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;

        const startTimeA = a.startTime.split(':').map(Number);
        const startTimeB = b.startTime.split(':').map(Number);

        if (startTimeA[0] !== startTimeB[0]) {
            return startTimeA[0] - startTimeB[0]; // So sánh giờ
        }
        return startTimeA[1] - startTimeB[1]; // So sánh phút
    });

    // Thêm các sự kiện vào bảng
    dayEvents.forEach((event, index) => {
        try {
            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.eventId = event.id;

            // Tạo ngày hiển thị và thứ từ ngày
            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayName = weekdayNames[weekday === 0 ? 7 : weekday] || 'N/A';
            const displayDate = formatDate(eventDate);

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${weekdayName}</td>
                <td>${displayDate}</td>
                <td>${event.startTime || ''} - ${event.endTime || ''}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            // Sự kiện click để hiển thị chi tiết
            row.addEventListener('click', () => {
                if (typeof showEventDetails === 'function') {
                    showEventDetails(event);
                }
            });

            tableBody.appendChild(row);
        } catch (error) {
            console.error("Lỗi khi tạo hàng sự kiện:", error, "cho sự kiện:", event);
        }
    });
}

// Hiển thị danh sách sự kiện trong tháng
function renderMonthEventsList() {
    // Kiểm tra xem phần tử có tồn tại không
    const tableBody = document.getElementById('month-events-list');
    if (!tableBody) {
        console.error("Không tìm thấy phần tử month-events-list");
        return;
    }

    tableBody.innerHTML = '';

    // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Format ngày cho API
    const firstDayStr = formatDateForAPI(firstDay);
    const lastDayStr = formatDateForAPI(lastDay);

    console.log("Tìm sự kiện từ", firstDayStr, "đến", lastDayStr);

    // Đảm bảo filteredSchedules đã được định nghĩa và không phải null
    const filteredSchedulesArray = Array.isArray(filteredSchedules) ? filteredSchedules : [];

    // Lọc sự kiện trong tháng hiện tại
    const monthEvents = filteredSchedulesArray.filter(event => {
        if (!event || !event.date) return false;

        const eventDate = event.date;
        return eventDate >= firstDayStr && eventDate <= lastDayStr;
    });

    console.log("Tìm thấy", monthEvents.length, "sự kiện trong tháng");

    // Nếu không có sự kiện nào
    if (monthEvents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="no-data-cell">
                <div class="no-events">
                    <p>Không có buổi học nào trong tháng này</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Sắp xếp sự kiện theo ngày và thời gian
    monthEvents.sort((a, b) => {
        if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
        }

        const startTimeA = a.startTime.split(':').map(Number);
        const startTimeB = b.startTime.split(':').map(Number);

        if (startTimeA[0] !== startTimeB[0]) {
            return startTimeA[0] - startTimeB[0]; // So sánh giờ
        }
        return startTimeA[1] - startTimeB[1]; // So sánh phút
    });

    // Thêm các sự kiện vào bảng
    monthEvents.forEach((event, index) => {
        try {
            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.eventId = event.id;

            // Tạo ngày hiển thị và thứ từ ngày
            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayName = weekdayNames[weekday === 0 ? 7 : weekday] || 'N/A';
            const displayDate = formatDate(eventDate);

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${weekdayName}</td>
                <td>${displayDate}</td>
                <td>${event.startTime || ''} - ${event.endTime || ''}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            // Sự kiện click để hiển thị chi tiết
            row.addEventListener('click', () => {
                if (typeof showEventDetails === 'function') {
                    showEventDetails(event);
                }
            });

            tableBody.appendChild(row);
        } catch (error) {
            console.error("Lỗi khi tạo hàng sự kiện:", error, "cho sự kiện:", event);
        }
    });
}

// Hàm kiểm tra xem hai ngày có phải là cùng một ngày
function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;

    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}