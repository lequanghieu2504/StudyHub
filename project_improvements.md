# KẾ HOẠCH KHẮC PHỤC & CẢI TIẾN DỰ ÁN STUDY HUB (SWP391)

Tài liệu này phân loại các công việc cần thực hiện theo 3 mức độ ưu tiên từ quan trọng nhất (bảo mật, sửa lỗi cơ bản) đến các nâng cấp tối ưu hóa hệ thống.

---

## 📌 MỨC ĐỘ 1: KHẮC PHỤC CÁC LỖI CƠ BẢN & BẢO MẬT (ƯU TIÊN CAO NHẤT)

Đây là những lỗi nghiêm trọng ảnh hưởng trực tiếp tới tính an toàn của hệ thống, bảo mật dữ liệu người dùng, hoặc có thể gây treo hệ thống (OOM) khi chạy thực tế.

### 1. Sửa lỗi IDOR (Truy cập chéo dữ liệu trái phép)
*   **Vấn đề:** 
    *   [ProjectServiceImpl.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/project/service/impl/ProjectServiceImpl.java#L131): Hàm `getById(UUID id)` lấy dữ liệu dự án mà không kiểm tra xem User hiện tại có phải chủ nhân dự án đó không.
    *   [ConversationServiceImpl.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/ConversationServiceImpl.java#L61): Hàm `getConversation` và `getConversationMessages` không kiểm chứng quyền sở hữu đoạn chat.
*   **Giải pháp:** 
    *   Lấy ID của user đang đăng nhập từ `SecurityContextHolder`.
    *   So sánh `currentUser.getId()` với `project.getOwner().getId()` hoặc `conversation.getUserId()`. Nếu không khớp, trả về lỗi `403 Forbidden`.

### 2. Sửa lỗi cấu hình Spring Security (Hở API nhạy cảm)
*   **Vấn đề:** 
    *   Trong [SecurityConfig.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/config/SecurityConfig.java#L84), dòng cấu hình `/api/courses/**` được set là `permitAll()` vô tình mở công khai toàn bộ các request POST/DELETE đến tài nguyên này (bao gồm cả API follow/unfollow môn học).
*   **Giải pháp:** 
    *   Xóa bỏ `/api/courses/**` ra khỏi danh sách `permitAll()`.
    *   Chỉ cho phép GET công khai:
        ```java
        .requestMatchers(HttpMethod.GET, "/api/courses", "/api/courses/**").permitAll()
        ```

### 3. Khắc phục rò rỉ bộ nhớ (Out of Memory - OOM) tại Flashcard Service
*   **Vấn đề:** 
    *   Trong [AiFlashcardService.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_flashcard/service/AiFlashcardService.java#L80), hàm `flashcardRepository.findAll()` được gọi để lấy tất cả flashcard trong hệ thống lên RAM của server Java, sau đó dùng filter stream để đếm hoặc lọc theo bộ set.
*   **Giải pháp:** 
    *   Không sử dụng `findAll()`.
    *   Khai báo các câu query tương ứng trong `FlashcardRepository`:
        ```java
        long countByFlashcardSetId(UUID setId);
        List<Flashcard> findByFlashcardSetId(UUID setId);
        ```

### 4. Chia tách OTP kích hoạt tài khoản và OTP Reset mật khẩu
*   **Vấn đề:** 
    *   [AuthService.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/auth/service/AuthService.java#L33): Cả hai luồng Signup OTP và Forgot Password OTP đều ghi đè chung một trường `resetToken` trong bảng User, đồng thời không giới hạn thời gian hiệu lực (OTP Expiration).
*   **Giải pháp:**
    *   Tách thực thể User thành hai trường: `signupOtp` và `resetPasswordOtp`.
    *   Thêm hai trường timestamp: `signupOtpExpiry` và `resetPasswordOtpExpiry`. Kiểm tra xem thời gian hiện tại đã vượt quá hạn dùng của OTP chưa trước khi thực hiện xác thực.

### 5. Cấu hình động URL chuyển hướng Google OAuth2
*   **Vấn đề:** 
    *   Trong [SecurityConfig.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/config/SecurityConfig.java#L159), URL điều hướng frontend sau khi đăng nhập Google thành công đang bị hardcode cứng là `http://localhost:5173/oauth2/callback`. Điều này sẽ làm lỗi tính năng đăng nhập khi deploy lên môi trường Production thực tế.
*   **Giải pháp:**
    *   Khai báo biến cấu hình trong `application.properties`: `app.frontend.url=http://localhost:5173`.
    *   Đọc biến này vào class cấu hình bảo mật bằng `@Value("${app.frontend.url}")` và tạo redirect URL động.

---

## 📌 MỨC ĐỘ 2: HOÀN THIỆN LOGIC NGHIỆP VỤ & TÁC VỤ (ƯU TIÊN TRUNG BÌNH)

Các cải tiến nhằm đảm bảo luồng nghiệp vụ hoạt động trơn tru, logic trả về dữ liệu chính xác và giao diện không bị giật lag/timeout.

### 1. Thay thế dữ liệu mock trong API lấy bộ Flashcards mới nhất
*   **Vấn đề:** 
    *   [AiFlashcardController.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_flashcard/controller/AiFlashcardController.java#L131): API `/sets/latest` đang trả về dữ liệu mock với UUID ngẫu nhiên, khiến frontend click vào bị lỗi 404.
*   **Giải pháp:** 
    *   Viết hàm JPA truy vấn bộ Flashcard được tạo mới nhất của user đang đăng nhập:
        ```java
        Optional<FlashcardSet> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
        ```

### 2. Sửa lỗi API "Tài liệu của tôi"
*   **Vấn đề:** 
    *   [DocumentController.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/document/controller/DocumentController.java#L158): API `/my-documents` lấy toàn bộ tài liệu hệ thống thay vì lọc theo cá nhân và đang bị hardcode tên môn học `"SWP391"`.
*   **Giải pháp:** 
    *   Sử dụng email người dùng từ context để gọi hàm lấy tài liệu đã upload của riêng họ.
    *   Lấy tên môn học thực tế từ thuộc tính `document.getCourse().getCode()` thay vì hardcode chuỗi ký tự.

### 3. Khắc phục lỗi Crash 500 khi tạo trùng lặp Sơ đồ tư duy (Mindmap)
*   **Vấn đề:** 
    *   [MindMapServiceImpl.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_mindmap/service/MindMapServiceImpl.java#L27): Cho phép sinh nhiều Mindmap trên cùng 1 `documentId`. Tuy nhiên khi load, hàm `findByDocumentId` lại trả về một đối tượng đơn lẻ (`Optional`), gây lỗi `NonUniqueResultException` khi có nhiều hơn 1 bản ghi.
*   **Giải pháp:**
    *   Trước khi lưu sơ đồ tư duy mới, kiểm tra xem đã tồn tại sơ đồ cho tài liệu đó chưa.
    *   Nếu đã tồn tại, tiến hành ghi đè cập nhật nội dung (Update) hoặc xóa bản cũ trước khi lưu bản mới.

### 4. Chuyển tác vụ parse văn bản trực tiếp sang Bất đồng bộ (Async)
*   **Vấn đề:** 
    *   Trong [AiFlashcardService.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_flashcard/service/AiFlashcardService.java#L198), khi người dùng tải file lên để tạo Flashcard tức thời, việc parse chữ từ file PDF/Word chạy đồng bộ trên thread chính của Tomcat, dễ gây timeout/lag khi file nặng.
*   **Giải pháp:** 
    *   Ứng dụng cơ chế bất đồng bộ `@Async` hoặc trả về kết quả `CompletableFuture` tương tự quy trình lưu và parse tài liệu chung ở `DocumentServiceImpl`.

---

## 📌 MỨC ĐỘ 3: TỐI ƯU HÓA HỆ THỐNG & NÂNG CẤP (ƯU TIÊN THẤP)

Những nâng cấp giúp tăng tốc độ xử lý, giảm chi phí gọi API bên ngoài (Groq, Jina) và giúp mã nguồn dễ bảo trì hơn.

### 1. Khắc phục lỗi JSON Injection trong Jina API Client
*   **Vấn đề:**
    *   [JinaEmbeddingClient.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_ask/client/JinaEmbeddingClient.java#L24): Chuỗi JSON gửi tới Jina API được nối bằng Text Block thủ công dạng String. Nếu text chứa các ký tự xuống dòng (`\n`) hoặc ký tự đặc biệt chưa được escape, Jina API sẽ trả về lỗi `400 Bad Request`.
*   **Giải pháp:**
    *   Sử dụng thư viện `ObjectMapper` của Jackson để chuyển đổi Map/Object thành JSON tự động:
        ```java
        Map<String, Object> requestBody = Map.of(
            "model", "jina-embeddings-v2-base-en",
            "input", List.of(text)
        );
        String json = objectMapper.writeValueAsString(requestBody);
        ```

### 2. Sử dụng Batch Embedding thay vì gọi REST API tuần tự
*   **Vấn đề:** 
    *   [DocumentParserService.java](file:///data/qtram/swp391-project/backend/src/main/java/com/example/keeper/systems/ai_ask/service/DocumentParserService.java#L131): Gọi API Jina AI tuần tự từng chunk một qua vòng lặp. Nếu tài liệu có 50 chunks, hệ thống gọi API 50 lần tuần tự.
*   **Giải pháp:** 
    *   Chuyển đầu vào `EmbeddingService` thành nhận một danh sách `List<String> texts`.
    *   Gửi một mảng chuỗi văn bản tới Jina AI trong một HTTP Request duy nhất, sau đó map kết quả danh sách vector trả về tương ứng.

### 3. Cấu hình động thông số phân mảnh tài liệu (Chunk Size)
*   **Vấn đề:** 
    *   Thông số `CHUNK_SIZE = 1000` và `CHUNK_OVERLAP = 200` đang bị định nghĩa cố định (hardcode) trong code.
*   **Giải pháp:** 
    *   Chuyển các giá trị này ra file `application.properties` để dễ dàng tinh chỉnh độ dài ngữ cảnh phù hợp cho mô hình AI mà không cần phải compile lại code.

### 4. Thêm cơ chế Rate Limiting cho API AI
*   **Vấn đề:** 
    *   Các endpoint sinh Quiz, Flashcard, Mindmap, Hỏi AI hoạt động miễn phí và không giới hạn lượt gọi, rất dễ bị người dùng spam làm cạn kiệt API key Groq/Jina.
*   **Giải pháp:**
    *   Tích hợp thư viện Bucket4j hoặc thiết lập giới hạn lượt gọi (Rate Limit) theo IP/User ID đối với các API liên quan đến dịch vụ AI.
