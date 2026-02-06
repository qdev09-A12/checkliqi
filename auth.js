/* auth.js - Kết nối tới Python Server */

const API_URL = 'http://127.0.0.1:5000/api'; // Địa chỉ của Server Python

let generatedCode = null;
let codeExpiry = null;
let isCodeVerified = false;

// Chuyển Tab
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// Kiểm tra Pass & Email để mở nút gửi OTP
function checkInputs() {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const btnSend = document.getElementById('btnSendCode');
    const passMsg = document.getElementById('passMsg');

    const passRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isPassOk = passRegex.test(pass);
    const isEmailOk = emailRegex.test(email);

    if (isPassOk) {
        document.getElementById('regPass').classList.add('valid');
        passMsg.innerText = "✓ Mật khẩu cực mạnh";
        passMsg.classList.add('valid');
    } else {
        document.getElementById('regPass').classList.remove('valid');
        passMsg.innerText = "Yêu cầu: Chữ hoa, thường và ký tự đặc biệt (@#$...)";
        passMsg.classList.remove('valid');
    }

    if (isPassOk && isEmailOk) {
        btnSend.classList.add('active');
        btnSend.disabled = false;
    } else {
        btnSend.classList.remove('active');
        btnSend.disabled = true;
    }
}

// Giả lập gửi OTP (Client) -> Thực tế nên làm ở Server
function sendCode() {
    const btnSend = document.getElementById('btnSendCode');
    generatedCode = null;
    isCodeVerified = false;

    btnSend.innerText = "ĐANG GỬI...";
    btnSend.disabled = true;

    setTimeout(() => {
        generatedCode = Math.floor(10000 + Math.random() * 90000).toString();
        codeExpiry = Date.now() + 2 * 60 * 1000; // 2 phút
        
        // Alert mã OTP để test
        alert(`[OTP SYSTEM]\nMã xác thực của bạn: ${generatedCode}`);
        
        btnSend.innerText = "GỬI LẠI";
        btnSend.disabled = false;
    }, 1500);
}

// Kiểm tra OTP
function verifyOtp() {
    const inputOtp = document.getElementById('regOtp');
    const btnReg = document.getElementById('btnRegister');
    const otpMsg = document.getElementById('otpMsg');
    const val = inputOtp.value;

    if (val.length === 5) {
        if (Date.now() > codeExpiry) {
            inputOtp.classList.add('invalid');
            otpMsg.innerText = "❌ Mã đã hết hạn";
            isCodeVerified = false;
        } else if (val === generatedCode) {
            inputOtp.classList.remove('invalid');
            inputOtp.classList.add('valid');
            otpMsg.innerText = "✓ Mã chính xác";
            otpMsg.classList.add('valid');
            isCodeVerified = true;
        } else {
            inputOtp.classList.add('invalid');
            otpMsg.innerText = "❌ Mã sai";
            isCodeVerified = false;
        }
    } else {
        isCodeVerified = false;
    }
    
    // Bật nút đăng ký nếu OTP đúng
    if (isCodeVerified) {
        btnReg.classList.add('active');
        btnReg.disabled = false;
    } else {
        btnReg.classList.remove('active');
        btnReg.disabled = true;
    }
}

// GỌI API ĐĂNG KÝ
async function doRegister() {
    if (!isCodeVerified) return;

    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const btnReg = document.getElementById('btnRegister');

    btnReg.innerText = "ĐANG LƯU SERVER...";

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            alert("🎉 Đăng ký thành công! Bot đã lưu Database.");
            switchTab('login');
            document.getElementById('loginEmail').value = email;
        } else {
            alert("❌ Lỗi: " + result.msg);
        }
    } catch (e) {
        alert("❌ Không thể kết nối Server Python! (Chạy file server.py chưa?)");
    } finally {
        btnReg.innerText = "ĐĂNG KÝ USER";
    }
}

// GỌI API ĐĂNG NHẬP
async function doLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const btn = document.querySelector('#loginForm .btn-submit');

    btn.innerText = "ĐANG KIỂM TRA...";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });

        const result = await response.json();

        if (result.status === 'success') {
            btn.innerText = "THÀNH CÔNG!";
            btn.style.background = "var(--success)";
            btn.style.color = "#000";
            
            // Lưu thông tin người dùng vào Session (Bộ nhớ tạm của trình duyệt)
            // Để trang index.html biết ai đang dùng
            sessionStorage.setItem('ULTIMA_CURRENT_USER', JSON.stringify(result.data));

            setTimeout(() => {
                window.location.href = "index.html"; // Chuyển hướng sang Tool
            }, 1000);
        } else {
            alert("❌ " + result.msg);
            btn.innerText = "TRUY CẬP HỆ THỐNG";
            btn.style.background = "#333";
            btn.style.color = "#666";
        }
    } catch (e) {
        alert("❌ Lỗi kết nối Server! Vui lòng bật file Python.");
        btn.innerText = "TRUY CẬP HỆ THỐNG";
    }
}