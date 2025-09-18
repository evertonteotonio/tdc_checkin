require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const participantRoutes = require('./routes/participants');
const checkinRoutes = require('./routes/checkin');
const adminRoutes = require('./routes/admin');
const conversationalRoutes = require('./routes/conversationalRegistration');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do multer para upload de imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

// Routes
app.use('/api/participants', upload.single('photo'), participantRoutes);
app.use('/api/checkin', upload.single('photo'), checkinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat-registration', conversationalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 AWS Endpoint: ${process.env.AWS_ENDPOINT_URL}`);
});
