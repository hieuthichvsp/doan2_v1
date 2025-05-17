document.addEventListener('DOMContentLoaded', function () {
    // Lấy checkbox điều khiển menu
    const menuToggle = document.getElementById('open');
    const content = document.querySelector('.content');

    if (menuToggle && content) {
        // Thêm sự kiện change cho checkbox
        menuToggle.addEventListener('change', function () {
            if (this.checked) {
                // Khi sidebar mở
                document.body.classList.add('has-sidebar-open');
            } else {
                // Khi sidebar đóng
                document.body.classList.remove('has-sidebar-open');
            }
        });

        // Thêm sự kiện click bên ngoài để đóng sidebar trên màn hình nhỏ
        if (window.innerWidth <= 768) {
            content.addEventListener('click', function () {
                if (menuToggle.checked) {
                    menuToggle.checked = false;
                    document.body.classList.remove('has-sidebar-open');
                }
            });
        }
    }

    // Xử lý responsive
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 768) {
            // Thêm event listener cho content khi resize xuống kích thước mobile
            if (content) {
                content.addEventListener('click', function () {
                    if (menuToggle && menuToggle.checked) {
                        menuToggle.checked = false;
                        document.body.classList.remove('has-sidebar-open');
                    }
                });
            }
        }
    });
});