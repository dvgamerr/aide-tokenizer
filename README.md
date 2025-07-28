# Aide Tokenizer

โปรเจคนี้ประกอบด้วย 2 ส่วนหลัก คือ `queue-sender` และ `queue-receiver` ที่ทำงานร่วมกันเพื่อจัดการระบบคิวข้อความและการประมวลผล

## การติดตั้งเริ่มต้น

### 1. เตรียมฐานข้อมูล

รันคำสั่งนี้เพื่อสร้างฐานข้อมูล:

```bash
bun drizzle-kit migrate
```

### 2. ตั้งค่า Cloudflare Tunnel

เข้าสู่ระบบและสร้าง tunnel:

```bash
cloudflared login
cloudflared tunnel create dev
cloudflared tunnel route dns dev proxy-3000.dvgamerr.app
```

### 3. สร้างไฟล์ config

สร้างไฟล์ `.cloudflared/config.yml` พร้อมเนื้อหาดังนี้:

```yaml
tunnel: ac9b5a64-72db-4e7f-9efd-e3020d6c0f95
credentials-file: ~/.cloudflared/ac9b5a64-72db-4e7f-9efd-e3020d6c0f95.json
ingress:
  - hostname: proxy-3000.dvgamerr.app
    service: http://localhost:3000
  - service: http_status:404
```

### 4. เริ่มต้น tunnel

```bash
cloudflared tunnel run dev
```

## ตัวแปรสภาพแวดล้อม

- `PORT`: พอร์ตที่เซิร์ฟเวอร์จะทำงาน (ค่าเริ่มต้น: 3000)

## วิธีการติดตั้งและใช้งาน

### ขั้นตอนการติดตั้ง:

1. ตรวจสอบให้แน่ใจว่าได้ติดตั้ง PostgreSQL แล้วและกำลังทำงานอยู่
2. สร้างตารางฐานข้อมูลโดยการรัน `queue-receiver`
3. เริ่มต้น `queue-sender` เพื่อเริ่มประมวลผลข้อความ
4. เริ่มต้นเซิร์ฟเวอร์ `queue-receiver` เพื่อรับข้อความที่เข้ามา

### วิธีใช้งาน:

- ส่ง POST request ไปที่ `/:channel/:bot_name` พร้อมข้อความที่ต้องการให้เข้าคิว
- ใช้คำสั่ง `/id` และ `/raw` ในข้อความเพื่อรับการตอบกลับแบบเฉพาะเจาะจง
