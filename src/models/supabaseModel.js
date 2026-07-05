import { createClient } from "@supabase/supabase-js";




const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


export const MensajeModel = {

    async crear({nombre,mensaje}){
        const {data,error} = await supabase
        .from('mensajes')
        .insert([{nombre, mensaje}])
        .select();

        if (error) throw error;

        return data[0];
    },



    async obtenerPaginados(from,to) {
        const {data,error} = await supabase
        .from('mensajes')
        .select('*')
        .order('created_at', {ascending:false})
        .range(from,to)

        if( error) throw error;
        return data;
    },


    async  eliminarMensajeModel(id) {
        const{data,error} = await supabase
        .from('mensajes')
        .delete()
        .eq('id',id);

        if(error) throw new Error(error.message);

        return data;
           
    }

};

// ── models/supabaseModel.js ──────────────────────────────────────────────

export const FotosModel = {

    async guardarFoto(archivo) {
        try {
            const fileName = `fotos/${Date.now()}_${archivo.name}`;
            

            // 1. Subir a Supabase Storage
            const uploadResponse = await supabase.storage
                .from('fotos-album')
                .upload(fileName, archivo.data, {
                    contentType: archivo.mimetype,
                    cacheControl: '3600'
                });

            if (uploadResponse.error) {
                console.error(' Error en Storage:', uploadResponse.error);
                throw uploadResponse.error;
            }


            // 2. Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('fotos-album')
                .getPublicUrl(fileName);
            
            const urlFoto = urlData.publicUrl;

            const dbResponse = await supabase
                .from('fotos')
                .insert([{ foto_url: urlFoto }])
                .select();

            if (dbResponse.error) {
                console.error('❌ Error en BD:', dbResponse.error);
                throw dbResponse.error;
            }


            // 4. Devolver el objeto con nombre genérico
            return {
                id: dbResponse.data[0].id,
                foto_url: urlFoto,
                nombre: 'Invitado', 
                created_at: dbResponse.data[0].created_at
            };

        } catch (error) {
            console.error('❌ Error en guardarFoto:', error);
            throw error;
        }
    },

    /*
    Traer todas las fotos de la base de datos 
    Ordenadas de más reciente a maś antigua
    */

    async traerFotosModel(from, to){
        try {

            let query = supabase
                .from('fotos')
                .select('*',{count:'exact'})
                .order('created_at',{ascending:false});

            // Si se recibe rango, paginamos. Si no (ej. para el ZIP del álbum
            // completo), traemos todas las fotos como antes.
            if (typeof from === 'number' && typeof to === 'number') {
                query = query.range(from, to);
            }

            const  {data,error, count} = await query;

            if (error){
                console.error('Error en consulta: ', error);
                throw error;
            }

            return { data, count };
            
        } catch (error) {
            console.error ('Error en traerFotosModel:',error);
            throw error;
            
        }
    },




    /**
     * ELIMINAR FOTO - Estrategia: Storage primero, luego BD
     * 1. Obtener la URL de la foto
     * 2. Eliminar de Storage (si falla, se detiene todo)
     * 3. Eliminar de la base de datos (solo si Storage funcionó)
     */
  


    async eliminacionFotoModel(id){
        try {
            

            // 1. Obtener el path/URL de la foto
            const { data: foto, error: getError } = await supabase
                .from('fotos')
                .select('foto_url, foto_path')
                .eq('id', id)
                .single();

            if (getError) {
                throw new Error(`Foto no encontrada: ${getError.message}`);
            }

            if (!foto || (!foto.foto_path && !foto.foto_url)) {
                throw new Error('La foto no tiene URL ni path');
            }

            // 2. Usar el path exacto guardado en la BD. Si es un registro viejo
            //    que no tiene foto_path (subido antes de este fix), lo
            //    reconstruimos decodificando la URL como respaldo.
            const filePath = foto.foto_path
                ? foto.foto_path
                : `fotos/${decodeURIComponent(foto.foto_url.split('/').pop())}`;

            

            // 3. Eliminar de Storage
            const { data: removeData, error: storageError } = await supabase.storage
                .from('fotos-album')
                .remove([filePath]);

            if (storageError) {
                console.error('❌ Error en Storage:', storageError);
                throw new Error(`Error en Storage: ${storageError.message}`);
            }

            // remove() no da error si el archivo no existía; lo detectamos
            // revisando si realmente devolvió algo borrado.
            // if (!removeData || removeData.length === 0) {
            //     console.warn('⚠️ Storage no encontró el archivo en:', filePath, '(puede que ya no exista, se continúa con el borrado en BD)');
            // } else {
            //     console.log('✅ Foto eliminada de Storage');
            // }

            // 4. Eliminar la fila de la base de datos (antes esto NO se hacía,
            //    por eso la foto "reaparecía" al recargar la galería)
            const { error: dbError } = await supabase
                .from('fotos')
                .delete()
                .eq('id', id);

            if (dbError) {
                console.error('❌ Error eliminando fila en BD:', dbError);
                throw new Error(`Error en BD: ${dbError.message}`);
            }

        

            return {
                success: true,
                mensaje: 'Foto eliminada de Storage y BD',
                foto_url: foto.foto_url
            };

        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    },


 




};