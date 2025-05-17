$("#signup").click(function () {
    $("#first").fadeOut("fast", function () {
        $("#second").fadeIn("fast");
    });
});

$("#signin").click(function () {
    $("#second").fadeOut("fast", function () {
        $("#first").fadeIn("fast");
    });
});

$(function () {
    $("form[name='login']").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
            }
        },
        messages: {
            email: "⚠️Nhập email",

            password: {
                required: "⚠️Nhập mật khẩu",
            }
        },
        submitHandler: function (form) {
            form.submit();
        }
    });
});

$(document).ready(function () {
    // Xử lý sự kiện submit form
    $("#loginForm").submit(function (event) {
        event.preventDefault(); // Ngăn form submit theo cách thông thường

        // Lấy giá trị input
        const email = $("#username").val().trim();
        const password = $("#password").val().trim();
        const remember = $("#remember").is(":checked");

        // Validate form
        if (!email || !password) {
            showAlert("danger", "Vui lòng nhập đầy đủ thông tin đăng nhập");
            return;
        }

        // Disable nút đăng nhập và hiển thị loading
        const submitBtn = $(this).find("button[type='submit']");
        const originalText = submitBtn.text();
        submitBtn.prop("disabled", true).text("Đang xử lý...");

        // Gửi request đăng nhập
        $.ajax({
            url: "/login",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                username: email,
                password: password,
                remember: remember
            }),
            success: function (response) {
                if (response.success) {
                    showAlert("success", "Đăng nhập thành công! Đang chuyển hướng...");

                    // Chuyển hướng dựa trên vai trò
                    setTimeout(function () {
                        if (response.role === "admin") {
                            window.location.href = "/admin/dashboard";
                        } else if (response.role === "teacher") {
                            window.location.href = "/teacher/dashboard";
                        } else {
                            window.location.href = "/student/dashboard";
                        }
                    }, 1000);
                } else {
                    showAlert("danger", response.message || "Đăng nhập thất bại");
                    submitBtn.prop("disabled", false).text(originalText);
                }
            },
            error: function (xhr) {
                let errorMessage = "Lỗi khi đăng nhập";

                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }

                showAlert("danger", errorMessage);
                submitBtn.prop("disabled", false).text(originalText);
            }
        });
    });

    // Hàm hiển thị thông báo
    function showAlert(type, message) {
        const alertBox = $("#login-alert");
        alertBox.removeClass("d-none alert-success alert-danger")
            .addClass(`alert-${type}`)
            .text(message)
            .show();

        if (type === "success") {
            setTimeout(function () {
                alertBox.fadeOut();
            }, 2000);
        }
    }
});

