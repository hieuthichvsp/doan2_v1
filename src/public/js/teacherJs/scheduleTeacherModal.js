document.addEventListener('DOMContentLoaded', function () {
    // ===== BIẾN TOÀN CỤC =====
    let currentDate = new Date();
    let currentView = 'day';
    let allSchedules = [];
    let filteredSchedules = [];
    let activeSemesters = []; // Dùng để lưu danh sách học kỳ
    let selectedSemesterId = null; // Lưu ID học kỳ đã chọn

    // Mảng tên thứ trong tuần
    const weekdayNames = {
        1: 'Thứ Hai',
        2: 'Thứ Ba',
        3: 'Thứ Tư',
        4: 'Thứ Năm',
        5: 'Thứ Sáu',
        6: 'Thứ Bảy',
        7: 'Chủ Nhật'
    };

    // Biến lưu trữ bộ lọc
    let filters = {
        subject: '',
        classSession: '',
        room: ''
    };

    // ===== KHỞI TẠO =====
    setupEventListeners();
    updateCurrentDateDisplay();
    loadSemesters(); // Tải danh sách học kỳ trước

    // ===== FUNCTIONS =====

    // Tải danh sách học kỳ
    function loadSemesters() {
        showLoading(true);

        fetch('/teacher/api/semesters')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    activeSemesters = data.semesters || [];
                    populateSemesterSelector();

                    // Nếu có học kỳ, tự động chọn học kỳ hiện tại
                    if (activeSemesters.length > 0) {
                        selectCurrentSemester();
                    } else {
                        showNoSemesterWarning();
                    }
                } else {
                    console.error('Error loading semesters:', data.message);
                    showNotification('Không thể tải danh sách học kỳ', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading semesters:', error);
                showNotification('Đã xảy ra lỗi khi tải dữ liệu học kỳ', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Điền dữ liệu vào dropdown học kỳ
    function populateSemesterSelector() {
        const semesterSelector = document.getElementById('semester-selector');
        if (!semesterSelector) {
            console.error('Element semester-selector not found');
            return;
        }

        // Xóa tất cả options hiện tại trừ option đầu tiên
        while (semesterSelector.options.length > 1) {
            semesterSelector.remove(1);
        }

        // Thêm các options mới
        activeSemesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            semesterSelector.appendChild(option);
        });

        // Thêm event listener cho selector
        semesterSelector.onchange = function () {
            const selectedId = this.value;
            if (selectedId) {
                selectedSemesterId = parseInt(selectedId);
                const selectedSemester = activeSemesters.find(sem => sem.id === selectedSemesterId);

                // Ẩn cảnh báo và hiển thị lịch
                document.getElementById('semester-warning').style.display = 'none';
                document.getElementById('no-semester-selected').style.display = 'none';

                // Hiển thị card điều khiển lịch
                document.querySelector('.card:not(.semester-selection-card)').style.display = 'block';

                // Tải lịch của học kỳ đã chọn
                loadSchedules();
            } else {
                selectedSemesterId = null;
                document.getElementById('semester-warning').style.display = 'flex';
                document.getElementById('no-semester-selected').style.display = 'block';
                document.querySelector('.card:not(.semester-selection-card)').style.display = 'none';
            }
        };
    }

    // Tự động chọn học kỳ hiện tại
    function selectCurrentSemester() {
        const currentDate = new Date();

        // Tìm học kỳ đang diễn ra (bao gồm ngày hiện tại)
        let currentSemester = activeSemesters.find(semester => {
            const startDate = new Date(semester.start_time);
            const endDate = new Date(semester.end_time);
            return currentDate >= startDate && currentDate <= endDate;
        });

        // Nếu không có học kỳ hiện tại, chọn học kỳ mới nhất
        if (!currentSemester && activeSemesters.length > 0) {
            // Sắp xếp theo thời gian kết thúc giảm dần
            activeSemesters.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
            currentSemester = activeSemesters[0];
        }

        if (currentSemester) {
            selectedSemesterId = currentSemester.id;

            // Chọn option trong dropdown
            const semesterSelector = document.getElementById('semester-selector');
            if (semesterSelector) {
                semesterSelector.value = currentSemester.id;

                // Kích hoạt sự kiện change thủ công
                const event = new Event('change');
                semesterSelector.dispatchEvent(event);
            }
        } else {
            // Nếu không thể chọn học kỳ hiện tại
            document.getElementById('semester-warning').style.display = 'flex';
            document.getElementById('no-semester-selected').style.display = 'block';
            document.querySelector('.card:not(.semester-selection-card)').style.display = 'none';
        }
    }

    // Hiển thị thông báo không có học kỳ
    function showNoSemesterWarning() {
        const semesterSelector = document.getElementById('semester-selector');
        if (semesterSelector) {
            semesterSelector.innerHTML = '<option value="">-- Không có học kỳ nào --</option>';
        }

        const semesterWarning = document.getElementById('semester-warning');
        if (semesterWarning) {
            semesterWarning.style.display = 'flex';
            semesterWarning.textContent = 'Không có học kỳ nào trong hệ thống.';
        }

        const noSemesterMessage = document.getElementById('no-semester-selected');
        if (noSemesterMessage) {
            noSemesterMessage.style.display = 'block';
        }

        // Ẩn các view lịch
        document.querySelectorAll('.schedule-view').forEach(view => {
            view.classList.remove('active');
        });

        // Ẩn card điều khiển lịch
        const scheduleCard = document.querySelector('.card:not(.semester-selection-card)');
        if (scheduleCard) {
            scheduleCard.style.display = 'none';
        }
    }

    // Thiết lập các sự kiện
    function setupEventListeners() {
        // Nút chuyển đổi chế độ xem
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function () {
                const view = this.getAttribute('data-view');

                // Chỉ cho phép chuyển view nếu đã chọn học kỳ
                if (!selectedSemesterId) {
                    showNotification('Vui lòng chọn học kỳ trước khi xem lịch', 'warning');
                    return;
                }

                document.querySelectorAll('.view-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');

                changeView(view);
            });
        });

        // Điều hướng ngày
        document.getElementById('prev-date').addEventListener('click', () => {
            if (!selectedSemesterId) {
                showNotification('Vui lòng chọn học kỳ trước khi điều hướng lịch', 'warning');
                return;
            }
            changeDate(-1);
        });

        document.getElementById('next-date').addEventListener('click', () => {
            if (!selectedSemesterId) {
                showNotification('Vui lòng chọn học kỳ trước khi điều hướng lịch', 'warning');
                return;
            }
            changeDate(1);
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            if (!selectedSemesterId) {
                showNotification('Vui lòng chọn học kỳ trước khi điều hướng lịch', 'warning');
                return;
            }
            currentDate = new Date();
            updateCurrentDateDisplay();
            loadSchedules();
        });

        // Modal chi tiết
        document.querySelector('.close-modal').addEventListener('click', closeModalDetail);
        document.getElementById('start-attendance-btn').addEventListener('click', startAttendance);

        // Tabs tuần
        setupWeekdayTabs();
    }

    // Cập nhật hiển thị ngày hiện tại
    function updateCurrentDateDisplay() {
        try {
            const currentDateElement = document.getElementById('current-date');
            const selectedDayElement = document.getElementById('selected-day');

            if (!currentDateElement) {
                console.warn('Element with ID "current-date" not found');
                return;
            }

            if (currentView === 'day') {
                // Sửa dòng này để sử dụng formatDate thay vì formatDateDisplay
                const formattedDate = formatDate(currentDate);

                // Thêm tên thứ
                const weekday = currentDate.getDay();
                const weekdayIndex = weekday === 0 ? 7 : weekday;
                const weekdayName = weekdayNames[weekdayIndex] || '';
                const formattedDateWithDay = `${weekdayName}, ${formattedDate}`;

                currentDateElement.textContent = formattedDateWithDay;
                if (selectedDayElement) selectedDayElement.textContent = formattedDateWithDay;
            } else if (currentView === 'week') {
                const startOfWeek = getStartOfWeek(currentDate);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                const weekRange = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
                currentDateElement.textContent = weekRange;

                const weekRangeElement = document.getElementById('week-range');
                if (weekRangeElement) {
                    weekRangeElement.textContent = `Tuần từ ${formatDate(startOfWeek)} đến ${formatDate(endOfWeek)}`;
                }
            } else if (currentView === 'month') {
                const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

                const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                currentDateElement.textContent = monthYear;

                const monthTitleElement = document.getElementById('month-title');
                if (monthTitleElement) {
                    monthTitleElement.textContent = monthYear;
                }
            }
        } catch (error) {
            console.error('Error updating date display:', error);
        }
    }

    // Tải dữ liệu
    function loadData() {
        loadFilterOptions();
        loadSchedules();
    }

    // Tải dữ liệu cho bộ lọc
    function loadFilterOptions() {
        // Tải danh sách môn học
        fetch('/teacher/api/schedule/subjects')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateSubjectsFilter(data.data);
                }
            })
            .catch(error => {
                console.error('Error loading subjects:', error);
                showNotification('Không thể tải danh sách môn học', 'error');
            });

        // Tải danh sách lớp học phần
        fetch('/teacher/api/schedule/classsessions')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateClassSessionsFilter(data.data);
                }
            })
            .catch(error => {
                console.error('Error loading class sessions:', error);
                showNotification('Không thể tải danh sách lớp học phần', 'error');
            });

        // Tải danh sách phòng học
        fetch('/teacher/api/schedule/rooms')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateRoomsFilter(data.data);
                }
            })
            .catch(error => {
                console.error('Error loading rooms:', error);
                showNotification('Không thể tải danh sách phòng học', 'error');
            });
    }

    // Điền dữ liệu vào bộ lọc môn học
    function populateSubjectsFilter(subjects) {
        const select = document.getElementById('filter-subject');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    }

    // Điền dữ liệu vào bộ lọc lớp học phần
    function populateClassSessionsFilter(classSessions) {
        const select = document.getElementById('filter-class-session');
        classSessions.forEach(classSession => {
            const option = document.createElement('option');
            option.value = classSession.id;
            option.textContent = `${classSession.name} (${classSession.subject_name})`;
            select.appendChild(option);
        });
    }

    // Điền dữ liệu vào bộ lọc phòng học
    function populateRoomsFilter(rooms) {
        const select = document.getElementById('filter-room');
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.room_code;
            select.appendChild(option);
        });
    }

    // Cập nhật hàm loadSchedules
    function loadSchedules() {
        if (!selectedSemesterId) {
            showNotification('Vui lòng chọn học kỳ trước khi xem lịch', 'warning');
            return;
        }

        showLoading(true);

        const teacherId = document.querySelector('meta[name="current-user-id"]').content;

        let params = new URLSearchParams();
        params.append('teacherId', teacherId);
        params.append('semesterId', selectedSemesterId);

        if (currentView === 'day') {
            params.append('date', formatDateForAPI(currentDate));
            params.append('view', 'day');
        } else if (currentView === 'week') {
            const startDate = getStartOfWeek(currentDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);

            params.append('startDate', formatDateForAPI(startDate));
            params.append('endDate', formatDateForAPI(endDate));
            params.append('view', 'week');
        } else if (currentView === 'month') {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            params.append('startDate', formatDateForAPI(firstDay));
            params.append('endDate', formatDateForAPI(lastDay));
            params.append('view', 'month');
        }

        // Thêm các filter nếu có
        if (filters.subject) params.append('subjectId', filters.subject);
        if (filters.classSession) params.append('classSessionId', filters.classSession);
        if (filters.room) params.append('roomId', filters.room);

        fetch(`/teacher/api/schedule?${params}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Cập nhật dữ liệu lịch
                    allSchedules = data.schedules || [];
                    filteredSchedules = [...allSchedules];

                    // Cập nhật thông tin học kỳ đang hoạt động
                    if (data.activeSemesters) {
                        activeSemesters = data.activeSemesters;
                    }

                    // Kiểm tra nếu không có lịch nào
                    if (allSchedules.length === 0) {
                        // Hiển thị thông báo không có lịch học tương ứng với view hiện tại
                        showEmptyScheduleMessage(currentView);
                    } else {
                        // Ẩn thông báo không có lịch học
                        hideEmptyScheduleMessage(currentView);
                    }

                    // Hiển thị lịch
                    renderSchedule();
                } else {
                    console.error('Error loading schedules:', data.message);
                    showNotification(data.message || 'Không thể tải lịch dạy', 'error');
                    allSchedules = [];
                    filteredSchedules = [];
                    showEmptyScheduleMessage(currentView);
                    renderSchedule();
                }
            })
            .catch(error => {
                console.error('Error loading schedules:', error);
                showNotification('Đã xảy ra lỗi khi tải dữ liệu lịch dạy', 'error');
                allSchedules = [];
                filteredSchedules = [];
                showEmptyScheduleMessage(currentView);
                renderSchedule();
            })
            .finally(() => {
                // Ẩn màn hình loading
                showLoading(false);
            });
    }

    // Thêm hàm hiển thị thông báo không có lịch học
    function showEmptyScheduleMessage(view) {
        // Ẩn bảng lịch
        if (view === 'day') {
            document.getElementById('day-schedule-table').style.display = 'none';
            document.getElementById('day-view-empty').style.display = 'block';
        } else if (view === 'week') {
            const weekViewTabs = document.querySelector('#week-view .weekday-tabs');
            const weekViewTables = document.querySelector('#week-view .tab-content');

            if (weekViewTabs) weekViewTabs.style.display = 'none';
            if (weekViewTables) weekViewTables.style.display = 'none';

            document.getElementById('week-view-empty').style.display = 'block';
        } else if (view === 'month') {
            const monthViewCalendar = document.querySelector('#month-view .calendar-container');

            if (monthViewCalendar) monthViewCalendar.style.display = 'none';

            document.getElementById('month-view-empty').style.display = 'block';
        }
    }

    // Thêm hàm ẩn thông báo không có lịch học
    function hideEmptyScheduleMessage(view) {
        // Hiển thị bảng lịch
        if (view === 'day') {
            document.getElementById('day-schedule-table').style.display = 'block';
            document.getElementById('day-view-empty').style.display = 'none';
        } else if (view === 'week') {
            const weekViewTabs = document.querySelector('#week-view .weekday-tabs');
            const weekViewTables = document.querySelector('#week-view .tab-content');

            if (weekViewTabs) weekViewTabs.style.display = 'block';
            if (weekViewTables) weekViewTables.style.display = 'block';

            document.getElementById('week-view-empty').style.display = 'none';
        } else if (view === 'month') {
            const monthViewCalendar = document.querySelector('#month-view .calendar-container');

            if (monthViewCalendar) monthViewCalendar.style.display = 'block';

            document.getElementById('month-view-empty').style.display = 'none';
        }
    }

    // Cập nhật hàm renderSchedule để gọi đúng hàm render cho từng view
    function renderSchedule() {
        try {
            console.log(`Rendering schedule for ${currentView} view with ${filteredSchedules.length} events`);

            // Kiểm tra xem có lịch nào sau khi lọc không
            if (filteredSchedules.length === 0) {
                showEmptyScheduleMessage(currentView);
            } else {
                hideEmptyScheduleMessage(currentView);
            }

            // Gọi hàm render tương ứng với view hiện tại
            if (currentView === 'day') {
                renderDaySchedule();
            } else if (currentView === 'week') {
                renderWeekSchedule();
            } else if (currentView === 'month') {
                renderMonthSchedule();
            }
        } catch (error) {
            console.error('Error rendering schedule:', error);
            showNotification('Đã xảy ra lỗi khi hiển thị lịch. Vui lòng thử lại.', 'error');

            // Hiển thị thông báo lỗi trong giao diện
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.innerHTML = `
                <p><strong>Đã xảy ra lỗi:</strong> ${error.message}</p>
                <p>Vui lòng tải lại trang hoặc liên hệ với quản trị viên.</p>
            `;

            // Chèn thông báo vào view hiện tại
            const currentViewElement = document.getElementById(`${currentView}-view`);
            if (currentViewElement) {
                currentViewElement.innerHTML = '';
                currentViewElement.appendChild(errorMessage);
            }
        }
    }

    // Hiển thị lịch ngày
    function renderDaySchedule() {
        // Thử tìm phần tử với một số selector khác nhau
        const tableBody = document.getElementById('day-schedule-events') ||
            document.querySelector('#day-view table tbody') ||
            document.querySelector('#day-schedule-table tbody');

        if (!tableBody) {
            console.error('Element for day schedule table body not found. Checking DOM structure...');

            // Log cấu trúc DOM của day-view để debug
            const dayView = document.getElementById('day-view');
            if (dayView) {
                console.log('day-view structure:', dayView.innerHTML);
            } else {
                console.error('day-view element not found either');
            }

            // Thử tạo phần tử tbody nếu tồn tại bảng nhưng không có tbody
            const dayTable = document.querySelector('#day-view table') ||
                document.getElementById('day-schedule-table');

            if (dayTable) {
                console.log('Found day table, creating tbody if needed');
                let tbody = dayTable.querySelector('tbody');

                if (!tbody) {
                    tbody = document.createElement('tbody');
                    tbody.id = 'day-schedule-events';
                    dayTable.appendChild(tbody);
                    console.log('Created new tbody element with id day-schedule-events');
                }

                renderDayEvents(tbody);
            } else {
                showNotification('Không thể hiển thị lịch ngày do lỗi cấu trúc DOM', 'error');
            }

            return;
        }

        renderDayEvents(tableBody);
    }

    // Tách logic render events ra một hàm riêng
    function renderDayEvents(tableBody) {
        // Xóa nội dung cũ
        tableBody.innerHTML = '';

        // Lọc sự kiện theo ngày hiện tại 
        const dateStr = formatDateForAPI(currentDate);
        console.log('Looking for events on date:', dateStr);

        const dayEvents = filteredSchedules.filter(event => {
            // So sánh trực tiếp chuỗi date từ API
            return event.date === dateStr;
        });

        console.log('Day Events:', dayEvents);

        // Nếu không có lịch nào
        if (!dayEvents || dayEvents.length === 0) {
            showEmptyScheduleMessage('day');
            return;
        }

        // Hiển thị bảng lịch và ẩn thông báo không có lịch học
        hideEmptyScheduleMessage('day');

        // Sắp xếp lịch theo thời gian
        dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Hiển thị lịch
        dayEvents.forEach((event, index) => {
            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.id = event.id;

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            row.addEventListener('click', () => showEventDetails(event));
            tableBody.appendChild(row);
        });
    }

    // Hiển thị lịch tuần
    function renderWeekSchedule() {
        const tableBody = document.getElementById('week-schedule-body');
        if (!tableBody) {
            console.error('Element week-schedule-body not found');
            return;
        }

        tableBody.innerHTML = '';

        // Tính ngày đầu và cuối tuần
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        // Cập nhật tiêu đề tuần
        const weekRangeElement = document.getElementById('week-range');
        if (weekRangeElement) {
            weekRangeElement.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
        }

        // Lọc sự kiện trong tuần
        const weekEvents = filteredSchedules.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });

        // Log để debug
        console.log('Week Events:', weekEvents);
        console.log('Week Range:', startOfWeek, '-', endOfWeek);

        // Nếu không có lịch nào
        if (!weekEvents || weekEvents.length === 0) {
            showEmptyScheduleMessage('week');
            return;
        }

        // Hiển thị bảng lịch và ẩn thông báo không có lịch học
        hideEmptyScheduleMessage('week');

        // Sắp xếp theo ngày và thời gian
        weekEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        // Hiển thị các sự kiện
        weekEvents.forEach((event, index) => {
            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayIndex = weekday === 0 ? 7 : weekday;

            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.id = event.id;
            row.dataset.weekday = weekdayNames[weekdayIndex];

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${weekdayNames[weekdayIndex]}</td>
                <td>${formatDate(eventDate)}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            row.addEventListener('click', () => showEventDetails(event));
            tableBody.appendChild(row);
        });

        // Thiết lập tab thứ trong tuần
        setupWeekdayTabs();
    }

    // Hiển thị lịch tháng
    function renderMonthSchedule() {
        try {
            // Cập nhật tiêu đề tháng
            const monthTitleElement = document.getElementById('month-title');
            if (monthTitleElement) {
                const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                monthTitleElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            }

            // Lấy ngày đầu tiên và cuối cùng của tháng
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Lọc sự kiện trong tháng
            const monthEvents = filteredSchedules.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= firstDay && eventDate <= lastDay;
            });

            // Nếu không có lịch nào trong tháng
            if (!monthEvents || monthEvents.length === 0) {
                showEmptyScheduleMessage('month');
                return;
            }

            // Hiển thị bảng lịch và ẩn thông báo không có lịch học
            hideEmptyScheduleMessage('month');

            // Render lưới lịch
            renderCalendarGrid();

            // Hiển thị tất cả các sự kiện trong tháng
            renderMonthEvents();
        } catch (error) {
            console.error('Error rendering month view:', error);
            // Hiển thị thông báo lỗi trên giao diện
            showMonthViewError(error);
        }
    }

    // Render lưới lịch tháng
    function renderCalendarGrid() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) {
            console.error('Element calendar-grid not found');
            return;
        }

        calendarGrid.innerHTML = '';

        // Lấy ngày đầu tiên và cuối cùng của tháng
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Tính ngày đầu tiên của lưới (thứ 2 của tuần chứa ngày đầu tiên của tháng)
        let startDate = getStartOfWeek(firstDay);

        // Tính ngày cuối cùng của lưới
        let endDate = new Date(lastDay);
        const lastDayOfWeek = endDate.getDay();
        if (lastDayOfWeek !== 0) {
            endDate.setDate(endDate.getDate() + (7 - lastDayOfWeek));
        }

        // Log để debug
        console.log('Calendar Range:', startDate, '-', endDate);

        // Tìm các ngày có sự kiện
        const eventDates = {};
        filteredSchedules.forEach(event => {
            if (!eventDates[event.date]) {
                eventDates[event.date] = [];
            }
            eventDates[event.date].push(event);
        });

        // Tạo các ô lịch - QUAN TRỌNG: dùng tempDate thay vì currentDate
        let tempDate = new Date(startDate);
        while (tempDate <= endDate) {
            const dateStr = formatDateForAPI(tempDate);
            const isCurrentMonth = tempDate.getMonth() === firstDay.getMonth();
            const isToday = isSameDay(tempDate, new Date());
            const hasEvents = eventDates[dateStr] && eventDates[dateStr].length > 0;

            const dayCell = document.createElement('div');
            dayCell.className = `calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`;
            dayCell.dataset.date = dateStr;

            // Thêm số ngày
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = tempDate.getDate();
            dayCell.appendChild(dayNumber);

            // Thêm chỉ báo sự kiện nếu có
            if (hasEvents) {
                const events = eventDates[dateStr];

                // Hiển thị tối đa 3 chỉ báo sự kiện
                const maxEvents = 3;
                for (let i = 0; i < Math.min(events.length, maxEvents); i++) {
                    const eventIndicator = document.createElement('div');
                    eventIndicator.className = 'event-indicator';
                    dayCell.appendChild(eventIndicator);
                }

                // Nếu có nhiều hơn 3 sự kiện, hiển thị số còn lại
                if (events.length > maxEvents) {
                    const moreEvents = document.createElement('div');
                    moreEvents.className = 'event-more';
                    moreEvents.textContent = `+${events.length - maxEvents} sự kiện`;
                    dayCell.appendChild(moreEvents);
                }

                // Thêm sự kiện click
                dayCell.addEventListener('click', () => {
                    // Bỏ selected khỏi tất cả các ô
                    document.querySelectorAll('.calendar-day').forEach(cell => {
                        cell.classList.remove('selected');
                    });

                    // Thêm selected cho ô hiện tại
                    dayCell.classList.add('selected');

                    // Lọc sự kiện cho ngày này
                    filterMonthEvents(dateStr);
                });
            }

            calendarGrid.appendChild(dayCell);

            // Tăng ngày lên 1 - QUAN TRỌNG: sử dụng một biến tempDate riêng
            const nextDate = new Date(tempDate);
            nextDate.setDate(tempDate.getDate() + 1);
            tempDate = nextDate;
        }
    }

    // Render danh sách sự kiện trong tháng
    function renderMonthEvents() {
        const tableBody = document.getElementById('month-events-list');
        if (!tableBody) {
            console.error('Element month-events-list not found');
            return;
        }

        tableBody.innerHTML = '';

        // Lấy ngày đầu tiên và cuối cùng của tháng
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Lọc sự kiện trong tháng
        const monthEvents = filteredSchedules.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= firstDay && eventDate <= lastDay;
        });

        // Log để debug
        console.log('Month Events:', monthEvents);

        // Nếu không có lịch nào
        if (!monthEvents || monthEvents.length === 0) {
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

        // Sắp xếp theo ngày và thời gian
        monthEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        // Hiển thị các sự kiện
        monthEvents.forEach((event, index) => {
            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayIndex = weekday === 0 ? 7 : weekday;

            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.id = event.id;

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${weekdayNames[weekdayIndex]}</td>
                <td>${formatDate(eventDate)}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            row.addEventListener('click', () => showEventDetails(event));
            tableBody.appendChild(row);
        });
    }

    // Hiển thị lỗi trong giao diện view tháng
    function showMonthViewError(error) {
        const monthView = document.getElementById('month-view');
        if (!monthView) return;

        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-danger';
        errorMsg.innerHTML = `
            <p><strong>Đã xảy ra lỗi:</strong> ${error.message}</p>
            <p>Vui lòng tải lại trang hoặc liên hệ với quản trị viên.</p>
        `;

        // Xóa nội dung hiện tại và thêm thông báo lỗi
        monthView.innerHTML = '';
        monthView.appendChild(errorMsg);
    }

    // Hàm lọc sự kiện theo ngày trong view tháng
    function filterMonthEvents(date) {
        const tableBody = document.getElementById('month-events-list');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        // Lọc sự kiện theo ngày được chọn
        const selectedEvents = filteredSchedules.filter(event => event.date === date);

        // Nếu không có lịch nào
        if (!selectedEvents || selectedEvents.length === 0) {
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

        // Sắp xếp theo thời gian
        selectedEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Hiển thị các sự kiện
        selectedEvents.forEach((event, index) => {
            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayIndex = weekday === 0 ? 7 : weekday;

            const row = document.createElement('tr');
            row.className = 'event-row';
            row.dataset.id = event.id;

            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${weekdayNames[weekdayIndex]}</td>
                <td>${formatDate(eventDate)}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td>${event.classSession?.name || 'N/A'}</td>
                <td>${event.subject?.name || 'N/A'}</td>
                <td>${event.class?.room_code || 'N/A'}</td>
            `;

            row.addEventListener('click', () => showEventDetails(event));
            tableBody.appendChild(row);
        });
    }

    // Hàm lấy ngày đầu tiên của tuần (thứ 2)
    function getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = day === 0 ? 6 : day - 1; // Điều chỉnh để lấy thứ 2
        result.setDate(result.getDate() - diff);
        return result;
    }

    // Hàm định dạng ngày thành định dạng dd/mm/yyyy
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            console.error('Invalid date:', date);
            return 'Invalid date';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Hàm định dạng ngày cho API (yyyy-mm-dd)
    function formatDateForAPI(date) {
        try {
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                console.error('Invalid date for API:', date);
                return formatDateForAPI(new Date()); // Sử dụng ngày hiện tại làm backup
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error in formatDateForAPI:', error);
            // Trả về ngày hôm nay nếu lỗi
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
    }

    // Hàm định dạng ngày tối ưu hơn
    function formatDateDisplay(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date for display:', date);
            return 'Invalid date';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        // Thêm tên thứ
        const weekday = date.getDay();
        const weekdayIndex = weekday === 0 ? 7 : weekday;
        const weekdayName = weekdayNames[weekdayIndex];

        // Định dạng: Thứ Hai, 16/05/2025
        return `${weekdayName}, ${day}/${month}/${year}`;
    }

    // Hàm so sánh hai ngày xem có cùng ngày không
    function isSameDay(date1, date2) {
        if (!(date1 instanceof Date) || !(date2 instanceof Date) || isNaN(date1) || isNaN(date2)) {
            return false;
        }

        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    // Thiết lập tab thứ trong tuần
    function setupWeekdayTabs() {
        try {
            const tabs = document.querySelectorAll('.nav-link');
            if (!tabs || tabs.length === 0) {
                console.warn('No tabs found with selector .nav-link');
                return;
            }

            // Xóa tất cả event listener hiện có
            tabs.forEach(tab => {
                // Sử dụng một hàm có tên để có thể xóa sau này
                tab.removeEventListener('click', tabClickHandler);
            });

            // Thêm event listener mới
            tabs.forEach(tab => {
                tab.addEventListener('click', tabClickHandler);
            });
        } catch (error) {
            console.error('Error setting up weekday tabs:', error);
        }
    }

    // Tách hàm xử lý click ra riêng để có thể xóa
    function tabClickHandler(e) {
        e.preventDefault();

        document.querySelectorAll('.nav-link').forEach(t => {
            t.classList.remove('active');
        });

        this.classList.add('active');

        const day = this.getAttribute('data-day');
        filterWeekEvents(day);
    }

    // Lọc sự kiện theo thứ trong tuần
    function filterWeekEvents(day) {
        const tableBody = document.getElementById('week-schedule-body');
        if (!tableBody) return;

        // Lấy tất cả các hàng
        const rows = tableBody.querySelectorAll('tr');

        // Nếu chọn "Tất cả", hiển thị tất cả các hàng
        if (day === 'all') {
            rows.forEach(row => {
                row.style.display = '';
            });
            return;
        }

        // Nếu không, chỉ hiển thị hàng phù hợp với thứ đã chọn
        rows.forEach(row => {
            if (row.dataset.weekday === day) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Kiểm tra nếu không có sự kiện nào được hiển thị, hiển thị thông báo
        let hasVisibleRows = false;
        rows.forEach(row => {
            if (row.style.display !== 'none') {
                hasVisibleRows = true;
            }
        });

        if (!hasVisibleRows) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="no-data-cell">
                    <div class="no-events">
                        <p>Không có buổi học nào vào ${day}</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
        }
    }

    // Hiển thị chi tiết sự kiện
    function showEventDetails(event) {
        try {
            // Cập nhật thông tin trong modal
            document.getElementById('detail-class-name').textContent = event.classSession?.name || 'N/A';
            document.getElementById('detail-subject').textContent = event.subject?.name || 'N/A';
            document.getElementById('detail-time').textContent = `${event.startTime} - ${event.endTime}`;

            const eventDate = new Date(event.date);
            const weekday = eventDate.getDay();
            const weekdayIndex = weekday === 0 ? 7 : weekday;

            document.getElementById('detail-date').textContent = `${weekdayNames[weekdayIndex]}, ${formatDate(eventDate)}`;
            document.getElementById('detail-room').textContent = event.class?.room_code || 'N/A';

            // Hiển thị modal
            const modal = document.getElementById('class-detail-modal');
            modal.style.display = 'block';

            // Lắng nghe sự kiện đóng modal
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            });

            // Đóng modal khi nhấp bên ngoài
            window.addEventListener('click', function (e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('Error showing event details:', error);
            showNotification('Không thể hiển thị chi tiết sự kiện', 'error');
        }
    }

    // Đóng modal chi tiết
    function closeModalDetail() {
        document.getElementById('class-detail-modal').style.display = 'none';
    }

    // Bắt đầu điểm danh
    function startAttendance() {
        const scheduleId = this.dataset.id;
        if (!scheduleId) {
            showNotification('Không thể xác định lịch dạy', 'error');
            return;
        }

        // Chuyển hướng đến trang điểm danh
        window.location.href = `/teacher/attendance/start?scheduleId=${scheduleId}`;
    }

    // Thêm hàm hiển thị thông tin học kỳ
    function updateSemesterInfoDisplay() {
        let infoElement = document.getElementById('semester-info-display');

        // Nếu chưa có element thông tin học kỳ, tạo mới
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'semester-info-display';
            infoElement.className = 'alert alert-info mt-2 mb-3';

            // Chèn sau phần filter-info
            const filterInfo = document.getElementById('filter-results-info');
            if (filterInfo) {
                filterInfo.parentNode.insertBefore(infoElement, filterInfo.nextSibling);
            }
        }

        // Nếu có học kỳ đang diễn ra
        if (activeSemesters && activeSemesters.length > 0) {
            let semesterText = '<strong>Học kỳ đang diễn ra:</strong> ';

            semesterText += activeSemesters.map(sem =>
                `${sem.name} (${formatDate(new Date(sem.startDate))} - ${formatDate(new Date(sem.endDate))})`
            ).join(', ');

            infoElement.innerHTML = semesterText;
            infoElement.style.display = 'block';
        } else {
            // Nếu không có học kỳ nào
            infoElement.innerHTML = '<strong>Lưu ý:</strong> Không có học kỳ nào đang diễn ra trong khoảng thời gian này';
            infoElement.style.display = 'block';
        }
    }

    // Hàm thay đổi ngày
    function changeDate(amount) {
        if (currentView === 'day') {
            // Thay đổi ngày
            currentDate.setDate(currentDate.getDate() + amount);
        } else if (currentView === 'week') {
            // Thay đổi tuần
            currentDate.setDate(currentDate.getDate() + (amount * 7));
        } else if (currentView === 'month') {
            // Thay đổi tháng
            currentDate.setMonth(currentDate.getMonth() + amount);
        }

        // Cập nhật hiển thị ngày và tải dữ liệu mới
        updateCurrentDateDisplay();
        loadSchedules();
    }

    // Hàm chuyển đổi view
    function changeView(view) {
        if (!selectedSemesterId) {
            showNotification('Vui lòng chọn học kỳ trước khi thay đổi chế độ xem', 'warning');
            return;
        }

        currentView = view;

        // Ẩn tất cả các view
        document.querySelectorAll('.schedule-view').forEach(el => {
            el.classList.remove('active');
        });

        // Hiển thị view được chọn
        document.getElementById(`${view}-view`).classList.add('active');

        // Cập nhật hiển thị ngày
        updateCurrentDateDisplay();

        // Tải lịch mới
        loadSchedules();
    }

    // Hàm hiển thị thông báo
    function showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');

        if (!notificationContainer) {
            console.warn('Notification container not found');
            alert(message); // Fallback to alert
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type === 'error' ? 'Lỗi' : type === 'warning' ? 'Cảnh báo' : 'Thông báo'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;

        // Thêm sự kiện đóng
        notification.querySelector('.notification-close').addEventListener('click', function () {
            notification.remove();
        });

        // Thêm vào container
        notificationContainer.appendChild(notification);

        // Tự động đóng sau 5 giây
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // Hiển thị loading 
    function showLoading(show) {
        const loader = document.getElementById('loading-overlay');
        if (!loader) {
            if (show) {
                // Tạo mới nếu chưa có
                const loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loading-overlay';
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loadingOverlay);
            }
        } else {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
});