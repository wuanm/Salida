
import { MensajeModel } from '../models/supabaseModel.js';

export const MensajeController = {
  
  /**
   * Maneja la creación de un nuevo mensaje
   */
  async guardarMensaje(req, res) {
    try {
      const { nombre, mensaje } = req.body;

      // VALIDACIÓN: Limpiamos espacios en blanco y verificamos que no estén vacíos
      if (!nombre || !nombre.trim() || !mensaje || !mensaje.trim()) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: 'El nombre y la dedicatoria son campos obligatorios.' 
        });
      }

      // ACCIÓN: Le pasamos los datos limpios al modelo para que los guarde en Supabase
      const nuevoMensaje = await MensajeModel.crear({
        nombre: nombre.trim(),
        mensaje: mensaje.trim()
      });

      // RESPUESTA: Devolvemos un código 21 (Created) junto con el registro de la BD
      return res.status(201).json({ 
        ok: true, 
        data: nuevoMensaje 
      });

    } catch (error) {
      console.error('Error en MensajeController.guardarMensaje:', error.message);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'No se pudo guardar tu dedicatoria en el sistema.' 
      });
    }
  },


  async listarMensajes(req, res) {
    try {
     
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const mensajes = await MensajeModel.obtenerPaginados(from, to);

   
      return res.status(200).json({ 
        ok: true, 
        data: mensajes 
      });

    } catch (error) {
      console.error('Error en MensajeController.listarMensajes:', error.message);
      return res.status(500).json({ 
        ok: false, 
        mensaje: 'Error al recuperar las dedicatorias de la base de datos.' 
      });
    }
  } ,



async eliminarMensaje(req,res) {
  const id = req.params.id;

  try {
     if(!id) {
      return res.status(400).json({
        ok: false,
        mensaje: 'ID de mensaje no proporcionado'
      })
     };

     const  resultadoEliminacion = await MensajeModel.eliminarMensajeModel(id);

     res.status(200).json({
      ok:true,
      mensaje: 'Mensaje eliminado correctamente',
      data: resultadoEliminacion
     })
    
  } catch (error) {
    res.status(500).json({
     success: true,
      mensaje: error.message
    })
  }
  
},










};