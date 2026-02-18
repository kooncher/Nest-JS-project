# NestJS Crypto Service

บริการตัวอย่างด้วย NestJS สำหรับเข้ารหัส/ถอดรหัสตามสเปค

- Swagger: `/api-docs`
- เอ็นพอยต์
  - POST `/get-encrypt-data`
  - POST `/get-decrypt-data`

## Requirements

- Node.js 18+

## Install

```bash
npm install
```

## Run (Mock Mode)

รันได้ทันทีโดยไม่ต้องมีคีย์ RSA:

```bash
npm run build
npm run start:mock
```

เปิดเอกสาร: http://localhost:3000/api-docs

## Run (Real Keys)

เตรียมคีย์จากเครื่องมือสร้าง RSA หรือ OpenSSL แล้วตั้งค่า environment:

PowerShell:

```powershell
$env:PRIVATE_KEY_PATH = ".\keys\private.pem" # หรือ absolute path
$env:PUBLIC_KEY_PATH = ".\keys\public.pem"   # หรือ absolute path
npm run build
npm start
```

หรือกำหนดเนื้อคีย์ PEM ตรงๆ:

```powershell
$env:RSA_PRIVATE_KEY = "<BEGIN RSA PRIVATE KEY ... END RSA PRIVATE KEY>"
$env:RSA_PUBLIC_KEY = "<BEGIN PUBLIC KEY ... END PUBLIC KEY>"
```

หรือใช้ไฟล์ `.env` (โหลดอัตโนมัติ):

1) คัดลอกเทมเพลต
```powershell
Copy-Item .env.sample .env
```
2) แก้ค่าที่ต้องการใน `.env` เช่น
```
PRIVATE_KEY_PATH=./keys/private.pem
PUBLIC_KEY_PATH=./keys/public.pem
# หรือใช้ RSA_PRIVATE_KEY/RSA_PUBLIC_KEY
```
3) รัน
```powershell
npm run build
npm start
```

## API Spec

- POST `/get-encrypt-data`
  - Request
    ```json
    { "payload": "string, required, 0-2000 chars" }
    ```
  - Response
    ```json
    {
      "successful": true,
      "error_code": "",
      "data": { "data1": "string", "data2": "string" }
    }
    ```

- POST `/get-decrypt-data`
  - Request
    ```json
    { "data1": "string", "data2": "string" }
    ```
  - Response
    ```json
    {
      "successful": true,
      "error_code": "",
      "data": { "payload": "string" }
    }
    ```

เมื่อเกิดข้อผิดพลาด ระบบจะตอบ:
```json
{ "successful": false, "error_code": "<message>", "data": null }
```

## Test

```bash
npm test
npm run typecheck
```

## Notes

- โหมดปกติทำตามสตอรี: เข้ารหัส AES key ด้วย RSA privateEncrypt และถอดด้วย publicDecrypt
- โหมด Mock ใช้ `MOCK_MODE=true` ภายในสคริปต์ `start:mock` เพื่อให้ทดสอบได้โดยไม่ต้องเตรียมคีย์
