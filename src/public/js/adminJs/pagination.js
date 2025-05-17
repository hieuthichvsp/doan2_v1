document.addEventListener('DOMContentLoaded', function () {
    const pageNumbersContainer = document.getElementById('page-numbers');
    if (!pageNumbersContainer) return;

    // Lấy thông tin phân trang từ data attributes
    const currentPage = parseInt(document.getElementById('pagination-container').dataset.currentPage) || 1;
    const totalPages = parseInt(document.getElementById('pagination-container').dataset.totalPages) || 1;
    const searchCode = document.getElementById('pagination-container').dataset.searchCode || '';

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