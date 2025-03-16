# 📌 Cơ chế Refresh Token

## 1️⃣ **Mục tiêu**

- Cho phép người dùng lấy **Access Token mới** mà không cần đăng nhập lại.
- Ngăn chặn **reuse attack** khi token bị đánh cắp.
- Hạn chế rủi ro **token bị lạm dụng** trên nhiều thiết bị.

---

## 2️⃣ **Luồng hoạt động**

### 🏁 **1. Đăng nhập ban đầu**

1. Người dùng nhập **username & password**.
2. Hệ thống tạo ra:
   - **Access Token** (ngắn hạn, dùng để truy cập API).
   - **Refresh Token** (dài hạn, dùng để lấy Access Token mới).
3. Lưu **refresh token vào DB**, gán với `user_id`.
4. Trả về **Access Token + Refresh Token** cho client.

### 🔄 **2. Refresh Access Token**

1. Client gửi **refresh token** lên server.
2. Hệ thống kiểm tra:
   - ✅ **Hợp lệ & chưa hết hạn** → Cấp lại token mới.
   - ❌ **Không hợp lệ hoặc đã bị xóa** → Phát hiện **reuse attack** → Xóa toàn bộ refresh tokens.

### 🚨 **3. Phát hiện token bị reuse**

- Nếu **refresh token hợp lệ nhưng không còn trong DB** → Đây là **token bị đánh cắp**.
- **Giải pháp:** Xóa toàn bộ refresh tokens của user → Buộc user đăng nhập lại.

---

## 3️⃣ **Triển khai chi tiết**

### 🔎 **Xác thực refresh token**

1. **Giải mã token** để lấy `user_id`.
2. **Tìm user theo ID**:
   - Không tìm thấy → Token không hợp lệ.
3. **Kiểm tra token có trong danh sách của user không**:
   - ✅ **Có** → Hợp lệ → Cấp token mới.
   - ❌ **Không** → **Reuse attack** → Xóa toàn bộ refresh tokens.

### 🔄 **Cập nhật refresh token**

- Khi cấp token mới, **thay thế refresh token cũ** bằng token mới trên đúng thiết bị đó.
- Không lưu trữ vô hạn token để tránh spam.

---

## 4️⃣ **Tóm tắt**

| **Vấn đề**                   | **Cách cũ (Tìm user bằng refresh token)** | **Cách mới (Tìm user bằng user ID)**         |
| ---------------------------- | ----------------------------------------- | -------------------------------------------- |
| **Phát hiện token bị reuse** | Không thể detect                          | Có thể detect reuse attack                   |
| **Bảo mật**                  | Kẻ tấn công có thể tiếp tục thử           | Vô hiệu hóa toàn bộ sessions khi bị đánh cắp |
| **Ảnh hưởng đến user thật**  | User bị đăng xuất trên tất cả thiết bị    | User chỉ mất session của token bị đánh cắp   |

---

## 5️⃣ **Lợi ích**

✅ Giảm thiểu rủi ro token bị đánh cắp.
✅ Bảo vệ user khỏi reuse attack.
✅ Cơ chế đơn giản, hiệu quả, dễ kiểm soát.
