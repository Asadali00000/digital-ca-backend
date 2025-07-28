```markdown
# Digital CA Platform
Express.js backend for a digital CA (Chartered Accountant) platform using Prisma and MySQL.

## 🛠 Prerequisites
- Node.js (v14+)
- npm/yarn
- MySQL database

## ⚙️ Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
Create `.env` file:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=5000
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12
```

3. **Database setup**
```bash
npx prisma migrate deploy
npx prisma generate
```

## Running the Server
**Development:**
```bash
npm run dev
```
**Production:**

```bash
Access at: `http://localhost:5000`
```
