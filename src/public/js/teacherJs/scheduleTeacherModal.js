document.addEventListener('DOMContentLoaded', function () {
    // ===== BIẾN TOÀN CỤC =====
    let currentDate = new Date();
    let currentView = 'day';
    let allSchedules = [];
    let filteredSchedules = [];
    let activeSemesters = []; // Thêm biến này nếu chưa có

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
    loadData();

    // ===== FUNCTIONS =====

    // Thiết lập các sự kiện
    function setupEventListeners() {
        // Nút chuyển đổi chế độ xem
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function () {
                const view = this.dataset.view;

                // Cập nhật trạng thái active
                document.querySelectorAll('.view-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');

                changeView(view);
            });
        });

        // Điều hướng ngày - Sửa đoạn này
        document.getElementById('prev-date').addEventListener('click', () => changeDate(-1));
        document.getElementById('next-date').addEventListener('click', () => changeDate(1));
        document.getElementById('today-btn').addEventListener('click', () => {
            currentDate = new Date();
            updateCurrentDateDisplay();
            loadSchedules();
        });

        // Bộ lọc
        // document.querySelector('.close-filter-modal').addEventListener('click', closeFilterModal);
        // document.getElementById('apply-filter').addEventListener('click', applyFilters);
        // document.getElementById('reset-filter').addEventListener('click', resetFilters);
        // document.getElementById('clear-filter').addEventListener('click', resetFilters);

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
        showLoading(true);

        const teacherId = document.querySelector('meta[name="current-user-id"]').content;

        let params = new URLSearchParams();
        params.append('teacherId', teacherId);

        if (currentView === 'day') {
            params.append('date', formatDateForAPI(currentDate));
        } else {
            const startDate = getStartDateForView();
            const endDate = getEndDateForView();
            params.append('startDate', formatDateForAPI(startDate));
            params.append('endDate', formatDateForAPI(endDate));
            params.append('view', currentView);
        }

        // Sửa: Sử dụng đối tượng filters thay vì biến không tồn tại
        if (filters.subject) params.append('subjectId', filters.subject);
        if (filters.classSession) params.append('classSessionId', filters.classSession);
        if (filters.room) params.append('roomId', filters.room);

        fetch(`/teacher/api/schedule?${params}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allSchedules = data.schedules || [];
                    filteredSchedules = [...allSchedules];

                    // Lưu thông tin học kỳ đang hoạt động
                    activeSemesters = data.activeSemesters || [];

                    // Hiển thị cảnh báo khi không có học kỳ
                    if (data.noSemesterFound) {
                        showNoSemesterWarning();
                    } else {
                        hideNoSemesterWarning();
                    }

                    renderSchedule();
                } else {
                    console.error('Error:', data.message);
                    showNotification(data.message || 'Không thể tải lịch dạy', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading schedules:', error);
                // Tạo dữ liệu mẫu khi API bị lỗi
                createSampleData();
                renderSchedule();
            })
            .finally(() => {
                // Ẩn màn hình loading
                showLoading(false);
            });
    }

    // Thêm hàm hiển thị cảnh báo khi không có học kỳ
    function showNoSemesterWarning() {
        // Kiểm tra nếu đã có cảnh báo thì không tạo mới
        if (document.getElementById('no-semester-warning')) return;

        const warningElement = document.createElement('div');
        warningElement.id = 'no-semester-warning';
        warningElement.className = 'alert alert-warning mt-3';
        warningElement.innerHTML = `
            <strong>Lưu ý:</strong> Không có học kỳ nào được tìm thấy trong khoảng thời gian này. 
            Vui lòng chọn thời gian khác hoặc liên hệ quản trị viên để biết thêm thông tin.
        `;

        // Thêm vào tất cả các view
        ['day-view', 'week-view', 'month-view'].forEach(viewId => {
            const viewElement = document.getElementById(viewId);
            if (viewElement) {
                // Chèn cảnh báo vào đầu phần nội dung
                const firstChild = viewElement.firstChild;
                if (firstChild) {
                    viewElement.insertBefore(warningElement.cloneNode(true), firstChild);
                } else {
                    viewElement.appendChild(warningElement.cloneNode(true));
                }
            }
        });
    }

    // Thêm hàm ẩn cảnh báo khi có học kỳ
    function hideNoSemesterWarning() {
        document.querySelectorAll('#no-semester-warning').forEach(warning => {
            warning.remove();
        });
    }

    // Thêm hàm lấy ngày bắt đầu cho view hiện tại
    function getStartDateForView() {
        if (currentView === 'week') {
            return getStartOfWeek(currentDate);
        } else if (currentView === 'month') {
            return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        }
        return new Date(currentDate);
    }

    // Thêm hàm lấy ngày kết thúc cho view hiện tại
    function getEndDateForView() {
        if (currentView === 'week') {
            const endOfWeek = new Date(getStartOfWeek(currentDate));
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return endOfWeek;
        } else if (currentView === 'month') {
            return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }
        return new Date(currentDate);
    }

    // Hàm tạo mẫu dữ liệu để test khi API bị lỗi
    function createSampleData() {
        try {
            // Tạo học kỳ mẫu
            activeSemesters = [
                {
                    id: 1,
                    name: 'Học kỳ hiện tại',
                    startDate: formatDateForAPI(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)),
                    endDate: formatDateForAPI(new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0))
                }
            ];

            // Xác định khoảng thời gian dựa trên view
            let startDate, endDate;

            if (currentView === 'day') {
                startDate = new Date(currentDate);
                endDate = new Date(currentDate);
            } else if (currentView === 'week') {
                startDate = getStartOfWeek(currentDate);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
            } else if (currentView === 'month') {
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            }

            // Chỉ tạo dữ liệu trong khoảng thời gian của học kỳ
            const semStartDate = new Date(activeSemesters[0].startDate);
            const semEndDate = new Date(activeSemesters[0].endDate);

            if (endDate < semStartDate || startDate > semEndDate) {
                // Nếu khoảng thời gian đang xem không nằm trong học kỳ
                allSchedules = [];
                filteredSchedules = [];
                showNoSemesterWarning();
                return;
            }

            // Giới hạn khoảng thời gian trong học kỳ
            if (startDate < semStartDate) startDate = new Date(semStartDate);
            if (endDate > semEndDate) endDate = new Date(semEndDate);

            // Tạo ngẫu nhiên 10 lịch trong khoảng thời gian
            allSchedules = [];

            // Lấy danh sách ngày trong khoảng
            const dateRange = getDatesInRange(startDate, endDate);

            // Tạo một số lịch ngẫu nhiên trong khoảng thời gian
            for (let i = 1; i <= 10; i++) {
                const randomIndex = Math.floor(Math.random() * dateRange.length);
                const eventDate = dateRange[randomIndex];

                if (!isNaN(eventDate.getTime())) {
                    allSchedules.push({
                        id: i,
                        date: formatDateForAPI(eventDate),
                        weekday: eventDate.getDay() === 0 ? 7 : eventDate.getDay(),
                        startTime: '08:00',
                        endTime: '09:30',
                        classSession: {
                            id: i,
                            name: `Nhóm ${i}`,
                            class_code: `N${i}`
                        },
                        subject: {
                            id: Math.ceil(i / 2),
                            name: `Môn học ${Math.ceil(i / 2)}`
                        },
                        class: {
                            id: i,
                            room_code: `A${100 + i}`
                        }
                    });
                }
            }

            // Sort by date
            allSchedules.sort((a, b) => a.date.localeCompare(b.date));

            // Áp dụng dữ liệu mẫu
            filteredSchedules = [...allSchedules];

            console.log('Created sample data:', allSchedules);
        } catch (error) {
            console.error('Error creating sample data:', error);
            allSchedules = [];
            filteredSchedules = [];
        }
    }

    // Hàm hiển thị/ẩn màn hình loading
    function showLoading(show) {
        // Ở đây bạn có thể thêm code để hiển thị hoặc ẩn biểu tượng loading
        // Ví dụ:
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.7);display:flex;justify-content:center;align-items:center;z-index:9999;';
        loadingIndicator.innerHTML = '<div class="spinner" style="border:5px solid #f3f3f3;border-top:5px solid #3498db;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;"></div>';

        // Thêm style animation
        if (!document.getElementById('loading-style')) {
            const style = document.createElement('style');
            style.id = 'loading-style';
            style.textContent = '@keyframes spin {0% {transform:rotate(0deg);} 100% {transform:rotate(360deg);}}';
            document.head.appendChild(style);
        }

        if (show) {
            // Kiểm tra xem đã có loadingIndicator chưa
            if (!document.getElementById('loading-indicator')) {
                document.body.appendChild(loadingIndicator);
            }
        } else {
            // Xóa loadingIndicator nếu có
            const existingIndicator = document.getElementById('loading-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }
    }

    // Thay đổi view (ngày/tuần/tháng)
    function changeView(view) {
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

    // Điều hướng ngày
    function changeDate(direction) {
        try {
            // Lưu ngày hiện tại để so sánh sau khi thay đổi
            const previousDate = new Date(currentDate);

            // Thay đổi ngày theo hướng và view hiện tại
            if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + direction);
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + (7 * direction));
            } else if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() + direction);
            }

            // Log để debug
            console.log(`Changed date from ${formatDate(previousDate)} to ${formatDate(currentDate)}`);

            // Cập nhật hiển thị ngày
            updateCurrentDateDisplay();

            // Nếu đi quá xa trong tương lai (ví dụ: hơn 2 năm), hiển thị cảnh báo
            const twoYearsLater = new Date();
            twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

            if (currentDate > twoYearsLater) {
                showNotification('Đang xem lịch quá xa trong tương lai, có thể không có dữ liệu học kỳ', 'warning');
            }

            // Tải lại lịch với ngày mới
            loadSchedules();
        } catch (error) {
            console.error('Error changing date:', error);
            showNotification('Đã xảy ra lỗi khi chuyển đổi ngày', 'error');

            // Khôi phục ngày nếu có lỗi
            currentDate = new Date();
            updateCurrentDateDisplay();
            loadSchedules();
        }
    }

    // Phối hợp hai hàm
    function navigateDate(direction) {
        console.log('navigateDate called with direction:', direction);

        if (direction === 'prev') {
            changeDate(-1);
        } else if (direction === 'next') {
            changeDate(1);
        } else if (direction === 'today') {
            currentDate = new Date();
            updateCurrentDateDisplay();
            loadSchedules();
        } else {
            // Nếu direction là một số
            changeDate(direction);
        }
    }

    // Hiển thị bộ lọc
    function showFilterModal() {
        document.getElementById('filter-modal').style.display = 'block';
    }

    // Đóng bộ lọc
    function closeFilterModal() {
        document.getElementById('filter-modal').style.display = 'none';
    }

    // Áp dụng bộ lọc
    function applyFilters() {
        filters.subject = document.getElementById('filter-subject').value;
        filters.classSession = document.getElementById('filter-class-session').value;
        filters.room = document.getElementById('filter-room').value;

        // Áp dụng bộ lọc vào danh sách
        filteredSchedules = allSchedules.filter(schedule => {
            let match = true;

            if (filters.subject && schedule.subject) {
                match = match && schedule.subject.id == filters.subject;
            }

            if (filters.classSession && schedule.classSession) {
                match = match && schedule.classSession.id == filters.classSession;
            }

            if (filters.room && schedule.class) {
                match = match && schedule.class.id == filters.room;
            }

            return match;
        });

        renderSchedule();
        updateFilterStatus();
        closeFilterModal();
    }

    // Reset bộ lọc
    function resetFilters() {
        filters = {
            subject: '',
            classSession: '',
            room: ''
        };

        document.getElementById('filter-subject').value = '';
        document.getElementById('filter-class-session').value = '';
        document.getElementById('filter-room').value = '';

        filteredSchedules = [...allSchedules];
        renderSchedule();
        document.getElementById('filter-results-info').style.display = 'none';
    }

    // Cập nhật hiển thị trạng thái lọc
    function updateFilterStatus() {
        const filterInfo = document.getElementById('filter-results-info');
        const filterSummary = document.getElementById('filter-summary');

        // Kiểm tra xem có bộ lọc nào đang được áp dụng không
        const hasFilter = filters.subject || filters.classSession || filters.room;

        if (hasFilter) {
            // Tạo thông tin tóm tắt bộ lọc
            let summaryText = [];

            if (filters.subject) {
                const subjectName = document.querySelector(`#filter-subject option[value="${filters.subject}"]`).textContent;
                summaryText.push(`Môn học: ${subjectName}`);
            }

            if (filters.classSession) {
                const className = document.querySelector(`#filter-class-session option[value="${filters.classSession}"]`).textContent;
                summaryText.push(`Lớp học phần: ${className}`);
            }

            if (filters.room) {
                const roomName = document.querySelector(`#filter-room option[value="${filters.room}"]`).textContent;
                summaryText.push(`Phòng: ${roomName}`);
            }

            filterSummary.textContent = summaryText.join(' | ');
            filterInfo.style.display = 'block';
        } else {
            filterInfo.style.display = 'none';
        }
    }

    // Hàm cập nhật hiển thị lịch dạy dựa trên view hiện tại
    function renderSchedule() {
        try {
            console.log(`Rendering schedule for ${currentView} view with ${filteredSchedules.length} events`);

            // Ẩn tất cả các view
            document.querySelectorAll('.schedule-view').forEach(view => {
                view.classList.remove('active');
            });

            // Hiển thị view hiện tại
            const currentViewElement = document.getElementById(`${currentView}-view`);
            if (currentViewElement) {
                currentViewElement.classList.add('active');
            } else {
                console.error(`Element with id "${currentView}-view" not found`);
                showNotification(`Không tìm thấy view "${currentView}"`, 'error');
                return;
            }

            // Render view tương ứng
            if (currentView === 'day') {
                renderDayView();
            } else if (currentView === 'week') {
                renderWeekView();
            } else if (currentView === 'month') {
                renderMonthView();
            } else if (currentView === 'semester') {
                // Học kỳ được tải riêng khi người dùng nhấn nút "Xem lịch"
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

    // Hiển thị lịch dạy theo ngày
    function renderDayView() {
        const tableBody = document.getElementById('day-schedule-events');
        if (!tableBody) {
            console.error('Element day-schedule-events not found');
            return;
        }

        tableBody.innerHTML = '';

        // Lọc sự kiện theo ngày hiện tại - phải định nghĩa trước khi sử dụng
        const dayEvents = filteredSchedules.filter(event => {
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, currentDate);
        });

        // Log để debug
        console.log('Day Events:', dayEvents);
        console.log('Current Date:', currentDate);

        // Nếu không có lịch nào
        if (!dayEvents || dayEvents.length === 0) {
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

    // Thêm hàm kiểm tra xem ngày có trong học kỳ nào không
    function checkDateInAnySemester(date) {
        if (!activeSemesters || activeSemesters.length === 0) return false;

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return activeSemesters.some(sem => {
            const startDate = new Date(sem.startDate);
            const endDate = new Date(sem.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            return checkDate >= startDate && checkDate <= endDate;
        });
    }

    // Hiển thị lịch dạy theo tuần
    function renderWeekView() {
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
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="no-data-cell">
                    <div class="no-events">
                        <p>Không có buổi học nào trong tuần này</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }

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

    // Hiển thị lịch dạy theo tháng
    function renderMonthView() {
        try {
            // Cập nhật tiêu đề tháng
            const monthTitleElement = document.getElementById('month-title');
            if (monthTitleElement) {
                const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                monthTitleElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            }

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
    // Sửa hàm formatDateForAPI để đảm bảo luôn trả về giá trị hợp lệ
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

    // Đặt lại sự kiện cho các nút điều hướng
    document.addEventListener('DOMContentLoaded', function () {
        // Đảm bảo các nút điều hướng hoạt động
        const prevButton = document.getElementById('prev-date');
        const nextButton = document.getElementById('next-date');
        const todayButton = document.getElementById('today-btn');

        if (prevButton) {
            prevButton.onclick = function () {
                console.log('Previous button clicked');
                changeDate(-1);
            };
        }

        if (nextButton) {
            nextButton.onclick = function () {
                console.log('Next button clicked');
                changeDate(1);
            };
        }

        if (todayButton) {
            todayButton.onclick = function () {
                console.log('Today button clicked');
                currentDate = new Date();
                updateCurrentDateDisplay();
                loadSchedules();
            };
        }
    });

    // Thêm hàm formatDateDisplay nếu bạn muốn định dạng ngày theo cách khác
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

    // Thêm vào file JS hoặc inline script
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle'); // Button để toggle sidebar

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');

            // Lưu trạng thái sidebar vào localStorage (tùy chọn)
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });

        // Khôi phục trạng thái sidebar từ localStorage (tùy chọn)
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // Xử lý responsive cho mobile
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('expanded');
        });
    }

    // Xử lý sidebar
    document.addEventListener('DOMContentLoaded', function () {
        // Kiểm tra trạng thái ban đầu của checkbox
        const openCheckbox = document.getElementById('open');
        if (openCheckbox) {
            // Lấy trạng thái đã lưu (nếu có)
            const savedState = localStorage.getItem('sidebarOpen');
            if (savedState === 'true') {
                openCheckbox.checked = true;
            }

            // Lưu trạng thái khi thay đổi
            openCheckbox.addEventListener('change', function () {
                localStorage.setItem('sidebarOpen', this.checked);

                // Cập nhật class cho body để CSS hoạt động
                if (this.checked) {
                    document.body.classList.add('sidebar-open');
                } else {
                    document.body.classList.remove('sidebar-open');
                }

                // Kích hoạt sự kiện resize để các component khác có thể điều chỉnh
                window.dispatchEvent(new Event('resize'));
            });

            // Kích hoạt sự kiện thay đổi ban đầu
            const event = new Event('change');
            openCheckbox.dispatchEvent(event);
        }
    });
});