import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mensajeRoutes from './routes/galeriaRoutes.js'; 
import fileUpload from 'express-fileupload';



const app = express();
const PORT = process.env.PORT || 3000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Para manejar archivos (express-fileupload)
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
    abortOnLimit: true
}));

// Servir la carpeta pública
app.use(express.static(path.join(__dirname, '../public')));

// Enrutador bajo el prefijo /api
app.use('/api', mensajeRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
});