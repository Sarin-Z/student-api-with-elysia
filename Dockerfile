FROM oven/bun:latest

WORKDIR /app

# คัดลอก package.json และ prisma
COPY package.json bun.lockb* ./
COPY prisma ./prisma/

# ติดตั้ง dependencies และ generate Prisma Client
RUN bun install
RUN bun x prisma generate

# คัดลอกโค้ดทั้งหมด
COPY . .

# เปิด port สำหรับ Elysia
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]