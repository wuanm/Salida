import { FotosModel, MensajeModel } from "../models/supabaseModel.js";
import { Readable } from 'stream';
import { ZipArchive } from 'archiver';







export const subirFoto = async (req, res) => {
    try {
        // Verificar archivo
        if (!req.files || !req.files.foto) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se envió ninguna foto'
            });
        }

        const archivo = req.files.foto;
        
        const resultado = await FotosModel.guardarFoto(archivo);

        res.status(200).json({
            ok: true,
            mensaje: 'Foto subida exitosamente',
            data: {
                id: resultado.id,
                foto_url: resultado.foto_url,
                nombre: 'Invitado',  // ← Nombre genérico
                created_at: resultado.created_at
            }
        });

    } catch (error) {
        console.error('❌ Error en subirFoto:', error);
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};


export const traerFotos = async (req,res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const from  = (page - 1) * limit;
        const to    = from + limit - 1;

        const { data: resultado, count } = await FotosModel.traerFotosModel(from, to);

         if (!resultado || resultado.length === 0) {
            return res.status(200).json({
                ok: true,
                mensaje: 'No hay fotos disponibles en la galería',
                data: [],
                total: count || 0,
                page,
                limit
            });
        }

        res.status(200).json({
            ok:true,
            mensaje: 'Fotos recuperadas exitosamente',
            data:resultado,
            total: count,
            page,
            limit

        })
        
    } catch (error) {
        console.log("Error al traer fotos controller", error);

         // 4. Manejar errores específicos de Supabase
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                ok: false,
                mensaje: 'No se encontraron fotos en la base de datos'
            });
        }
        

        res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor al recuperar las fotos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    };
};

export const eliminarFotos = async (req,res) => {
    const id = req.params.id;

    try {
        if(!id){
            return res.status(400).json({
                ok:false,
                mensaje: 'ID de la foton no proporcionado'
            })
        };

        const resultadoEliminacion = await FotosModel.eliminacionFotoModel(id);

        res.status(200).json({
            ok:true,
            mensaje: 'Foto eliminada correctamente',
            data: resultadoEliminacion
        })
        
    } catch (error) {
          console.log("Error al traer fotos controller", error);

         // 4. Manejar errores específicos de Supabase
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                ok: false,
                mensaje: 'No se encontraron fotos en la base de datos'
            });
        }
        

        res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor al eliminar foto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
        
    }

};



/**
 * DESCARGAR TODAS LAS FOTOS EN UN ZIP
 * GET /api/fotos/admin/album
 */




export const descargarZip = async (req, res) => {
    try {
        

        // 1. Obtener todas las fotos de la base de datos (sin paginar, para el ZIP completo)
        const { data: fotos } = await FotosModel.traerFotosModel();

        // 2. Verificar que hay fotos
        if (!fotos || fotos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'No hay fotos disponibles para descargar'
            });
        }


        // 3. Crear el archivo ZIP
        const archivoZip = new ZipArchive({
            zlib: { level: 9 }
        });

        // 4. Configurar la respuesta HTTP para descarga
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="album-recuerdos-grietell-${new Date().toISOString().split('T')[0]}.zip"`);

        // 5. Pipe del ZIP a la respuesta
        archivoZip.pipe(res);

        // 6. Agregar cada foto al ZIP
        let fotosAgregadas = 0;
        let errores = 0;

        for (const foto of fotos) {
            try {
                const url = foto.foto_url;
                if (!url) {
                    errores++;
                    continue;
                }

                const nombreArchivo = url.split('/').pop();
                const nombreLimpio = decodeURIComponent(nombreArchivo);

                

                const response = await fetch(url);
                
                if (!response.ok) {
                    console.warn(`⚠️ No se pudo descargar: ${nombreLimpio}`);
                    errores++;
                    continue;
                }

                const buffer = await response.arrayBuffer();
                const stream = Readable.from(Buffer.from(buffer));

                archivoZip.append(stream, { 
                    name: nombreLimpio,
                    date: new Date(foto.created_at)
                });
                
                fotosAgregadas++;

            } catch (error) {
                console.warn(`⚠️ Error al procesar foto ${foto.id}:`, error.message);
                errores++;
            }
        }

        
        
        if (errores > 0) {
            console.warn(`⚠️ ${errores} fotos no se pudieron procesar`);
        }

        // 7. Finalizar el ZIP
        archivoZip.finalize();

        // 8. Manejar errores en el ZIP
        archivoZip.on('error', (err) => {
            console.error('❌ Error al crear ZIP:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    ok: false,
                    mensaje: 'Error al crear el archivo ZIP'
                });
            }
        });

        // 9. Cuando el ZIP se completa
        archivoZip.on('end', () => {
            console.log('✅ ZIP generado y enviado correctamente');
            console.log(`📦 Tamaño: ${archivoZip.pointer()} bytes`);
        });

        // 10. Si el cliente cierra la conexión
        req.on('close', () => {
            if (!archivoZip.closed) {
                console.warn('⚠️ Cliente cerró la conexión antes de completar la descarga');
                archivoZip.abort();
            }
        });

    } catch (error) {
        console.error('❌ Error en descargarZip:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                ok: false,
                mensaje: error.message || 'Error interno del servidor'
            });
        }
    }
};