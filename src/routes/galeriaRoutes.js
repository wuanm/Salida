import express from 'express';
import { MensajeController } from '../controllers/galeriaController.js';
import * as fotosController from   '../controllers/fotosController.js'

const router = express.Router();

// mensajes
router.post('/publicaciones', MensajeController.guardarMensaje);


// Escucha: GET http://localhost:3000/api/publicaciones?page=1&limit=10
router.get('/publicaciones', MensajeController.listarMensajes);

router.delete(`/publicaciones/mensajes/:id`,MensajeController.eliminarMensaje);




// fotos
router.post('/fotos',fotosController.subirFoto);
router.get('/fotos',fotosController.traerFotos);
router.delete('/fotos/:id/eliminar',fotosController.eliminarFotos);

router.get('/fotos/admin/album', fotosController.descargarZip);











export default router;