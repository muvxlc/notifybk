# Deployment Guide

วิธีนำโปรเจกต์นี้ไปรันบนเครื่องอื่น (Move to another machine)

> **สำหรับ Komodo Users:** ดูวิธี Deploy ผ่าน Komodo ได้ที่ [KOMODO_DEPLOY.md](./KOMODO_DEPLOY.md)

## สิ่งที่ต้องมี (Prerequisites)
บนเครื่องปลายทางต้องติดตั้ง:
1.  **Docker** และ **Docker Compose**
2.  **Make** (Optional: สำหรับใช้คำสั่งลัด)
    - Debian/Ubuntu: `sudo apt install make`
    - CentOS/RHEL: `sudo yum install make`

## ขั้นตอนการย้าย (Migration Steps)

### 1. สร้างไฟล์ติดตั้ง (บนเครื่องเก่า)
รันคำสั่งนี้เพื่อสร้างไฟล์ ZIP ที่รวมโค้ดและข้อมูล Database ล่าสุด:
```bash
./package_for_migration.sh
```
ระบบจะสร้างไฟล์ชื่อ `elysia-dashboard-migration.zip` ขึ้นมา

### 2. ย้ายไฟล์ไปยังเครื่องใหม่
ให้ Copy ไฟล์ `elysia-dashboard-migration.zip` ไปยังเครื่องใหม่
แล้วทำการแตกไฟล์:
```bash
unzip elysia-dashboard-migration.zip -d elysia-dashboard
cd elysia-dashboard
```

### 3. ตั้งค่าความปลอดภัย (สำคัญ)
รันคำสั่งนี้เพื่อสร้างรหัสผ่านและ Key ต่างๆ แบบสุ่มที่ปลอดภัย:
```bash
./setup_env.sh
```
(ระบบจะสร้างไฟล์ `.env` ให้อัตโนมัติ)

### 4. รันบนเครื่องใหม่
เปิด Terminal บนเครื่องใหม่ เข้าไปที่โฟลเดอร์โปรเจกต์ แล้วรัน:

**Option A: ใช้ Make (แนะนำ)**
ต้องติดตั้ง make ก่อน (`sudo apt install make`)
```bash
make build
```

**Option B: ใช้ Docker Compose โดยตรง**
ถ้าไม่มี make ให้ใช้คำสั่งนี้แทน:
```bash
docker compose up -d --build
```

### 5. Restore ข้อมูล (บนเครื่องใหม่)
เมื่อ Container รันเสร็จแล้ว ให้รันคำสั่ง Restore โดยระบุชื่อไฟล์ Backup ที่ต้องการ:
```bash
./restore.sh backups/backup_xxxx.sql
```

---

## การจัดการด้วย Make (ทางลัด)
ในโปรเจกต์มีไฟล์ `Makefile` เตรียมไว้ให้แล้ว สามารถใช้คำสั่งสั้นๆ ได้ดังนี้:

- **เริ่มระบบ**: `make up`
- **หยุดระบบ**: `make down`
- **เริ่มระบบใหม่ (Restart)**: `make restart`
- **ดู Logs**: `make logs`
- **อัปเดต/สร้าง Container ใหม่**: `make build`
