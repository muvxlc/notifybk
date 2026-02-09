# Deploying to Komodo (Docker Fleet Manager)

Guide สำหรับการ Deploy โปรเจกต์นี้ไปยัง [Komodo](https://komodo.io/) หรือ Community Edition (mbecker/komodo).

## 1. Prerequisites (สิ่งที่ต้องมี)

1.  **Komodo Instance**: server ที่รัน Komodo อยู่และพร้อมใช้งาน
2.  **Git Repository**: โปรเจกต์นี้ต้องถูก push ขึ้น Git provider (เช่น GitHub, GitLab, Gitea) ที่ Komodo สามารถเข้าถึงได้
3.  **Server Resource**: เครื่องที่ Komodo จัดการต้องมี resources เพียงพอ (RAM 1GB+ แนะนำ)

## 2. Prepare Environment Variables (เตรียมค่าตัวแปร)

ก่อนเริ่ม Deploy บน Komodo คุณต้องมีค่า Environment Variables ที่ปลอดภัย
ให้รันคำสั่งนี้บนเครื่อง Local ของคุณเพื่อ generate ค่าต่างๆ:

```bash
./setup_env.sh
```

จากนั้นเปิดไฟล์ `.env` ที่ได้ แล้ว copy เนื้อหาทั้งหมดเก็บไว้:
```bash
cat .env
# Copy output ทั้งหมด
```

## 3. Create Stack in Komodo

1.  ไปที่หน้า **Stacks** ใน Komodo
2.  กด **Create Stack** (หรือ "Add Stack")
3.  เลือกประเภทเป็น **Git Repository** (หรือ Compose)
4.  กรอกข้อมูล:
    -   **Name**: `elysia-dashboard` (หรือชื่อที่ต้องการ)
    -   **Repository URL**: ใส่ URL ของ Git repo ปัจจุบัน
    -   **Branch**: `main` (หรือ branch ที่ต้องการ deploy)
    -   **Compose File**: `docker-compose.yml` (default)

## 4. Configure Environment

ในหน้าตั้งค่า Stack หรือ Service ของ Komodo:

1.  หาเมนู **Environment Variables**
2.  นำค่าจากไฟล์ `.env` (ในข้อ 2) มาวาง
    > **Note:** ตรวจสอบให้แน่ใจว่าค่า `DATABASE_URL` ถูกต้องตาม format:
    > `mysql://<user>:<password>@mysql:3306/<database>`
    > *สังเกตว่า host ต้องเป็น `mysql` (ชื่อ service ใน docker-compose)*

## 5. Deploy

1.  กด **Deploy** หรือ **Build & Deploy**
2.  รอจนกว่าสถานะเป็น **Running** (สีเขียว)
3.  ดู Logs เพื่อตรวจสอบว่า Backend และ Database เชื่อมต่อกันได้ปกติ

## Troubleshooting

-   **Database Connection Failed**:
    -   เช็คว่า `MYSQL_USER`, `MYSQL_PASSWORD` และ `DATABASE_URL` ตรงกัน
    -   เช็คว่า service name ใน `docker-compose.yml` คือ `mysql`
-   **Build Failed**:
    -   ดู Build Logs ใน Komodo
    -   ตรวจสอบว่าไฟล์ `Dockerfile` ใน `backend/` และ `frontend/` ถูกต้อง
