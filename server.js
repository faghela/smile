// server.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
const path         = require('path');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const productRoutes  = require('./src/features/products/product.routes');
const orderRoutes    = require('./src/features/orders/order.routes');
const adminRoutes    = require('./src/features/admin/admin.routes');
const uploadRoutes   = require('./src/features/upload/upload.routes');
const shippingRoutes = require('./src/features/shipping/shipping.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Logging Middleware ────────────────────────────────────────────
// تقييد الـ CORS
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      "img-src": ["'self'", "data:", "blob:", "http:", "https:"],
      "connect-src": ["'self'"],
    },
  }
}));

// تسجيل الطلبات (Logging)
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Rate Limiting (حماية من DDoS و Spam) ───────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 200, // 200 طلب كحد أقصى لكل IP
    message: { message: 'طلبات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smile_shop';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ تم الاتصال بقاعدة بيانات MongoDB'))
    .catch(err => console.error('❌ خطأ في الاتصال:', err.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/shipping',  shippingRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
    console.log(`🛍️  Store   → http://localhost:${PORT}/`);
    console.log(`⚙️  Admin   → http://localhost:${PORT}/admin.html`);
});