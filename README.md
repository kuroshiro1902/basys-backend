# BASYS

### Rules

- **Layer Flow Ideal**: HTTP -> Controller Request -> Input (query, param, body) -> Validate (ZSchema) -> Service -> Model (prisma, ZSchema) -> ServiceResponse -> Controller Response.
- Model generated từ lib (như prisma) chỉ được phép sử dụng trong \*.model.ts.
- Tầng _controller_ không được giao tiếp với nhau hay gọi service từ module khác, chỉ được gọi tới service từ module hiện tại.
- Hạn chế khai báo kiểu dữ liệu trực tiếp như `number`, `string`, ... Mà nên sử dụng từ _model_: `TUser[id]`.
