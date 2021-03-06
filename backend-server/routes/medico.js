// ==========================================
//		Rutas de medico
// ==========================================

var express = require('express');
var mdAutenticacion = require('./../middlewares/autenticacion');

var app = express();  // variable del servidor

// se importa el modelo
var Medico = require('../models/medico');

// ==========================================
//		Obtiene todos los medicos
// ==========================================
app.get('/', (request, response, next) => {

    var desde = request.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((error, medicos) => {

            if (error) {
                return response.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando los medicos',
                    errors: error
                });
            }

            Medico.count({}, (error, conteo) => {

                if (error) {
                    return response.status(500).json({
                        ok: false,
                        mensaje: 'Error contando los medicos',
                        errors: error
                    });
                }

                // OK => peticion correcta.
                response.status(200).json({
                    ok: true,
                    medicos: medicos,
                    totalRegistros: conteo
                });
            });
        });
});

// ==========================================
//		Crea un registro de un medico
// ==========================================

app.post('/', mdAutenticacion.verificarToken, (request, response) => {

    // recibe la informacion del formulario
    var body = request.body

    // crea el registro
    var medico = new Medico({
        nombre: body.nombre,
        hospital: body.hospital,
        usuario: request.usuario._id
    });

    medico.save((error, medicoGuardado) => {

        if (error) {
            return response.status(500).json({
                ok: false,
                mensaje: 'Error al crear medico',
                errors: error
            });
        }

        // recurso creado => OK
        response.status(201).json({
            ok: true,
            medico: medicoGuardado
        });
    });
});

// ==========================================
//		Obtener medico
// ==========================================

app.get('/:id', ( request, response ) => {

    var id = request.params.id;
    
    Medico.findById( id )
        .populate('usuario', 'nombre email img')
        .populate('hospital')
        .exec( (error, medico) => {

            //verifica si esta en la BD
            if (error) {
                return response.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar al medico',
                    errors: error
                });
            }

            // si no existe el registro
            if (!medico) {
                return response.status(400).json({
                    ok: false,
                    mensaje: 'El medico con el id: ' + id + ' no existe.',
                    error: { message: 'no existe un medico con ese ID' }
                });
            }

            response.status(200).json({
                ok: true,
                medico: medico
            });
        });
});

// ==========================================
//		Actualiza el registro
// ==========================================

app.patch('/:id', mdAutenticacion.verificarToken, (request, response) => {

    var id = request.params.id;
    var body = request.body;

    Medico.findById(id, (error, medico) => {

        //verifica si esta en la BD
        if (error) {
            return response.status(500).json({
                ok: false,
                mensaje: 'Error al buscar al medico',
                errors: error
            });
        }

        // si no existe el registro
        if (!medico) {
            return response.status(400).json({
                ok: false,
                mensaje: 'El medico con el id: ' + id + ' no existe.',
                error: { message: 'no existe un medico con ese ID' }
            });
        }

        // asigna los valores
        medico.nombre = body.nombre;
        medico.usuario = request.usuario._id;
        medico.hospital = body.hospital;

        //salva los cambios
        medico.save((error, medicoGuardado) => {
            
            if (error) {
                return response.status(400).json({
                    ok: false,
                    mensaje: 'error al actualizar al medico',
                    errors: error
                });
            }

            // recurso actulizado => OK
            response.status(200).json({
                ok: true,
                medico: medicoGuardado
            });
        });
    });

});

// ==========================================
//		Elimina un registro
// ==========================================

app.delete('/:id', mdAutenticacion.verificarToken, (request, response) => {

    var id = request.params.id;

    Medico.findByIdAndRemove(id, (error, medicoBorrado) => {

        if (error) {
            return response.status(500).json({
                ok: false,
                mensaje: 'Error al borrar medico',
                errors : error
            });
        }

        if (!medicoBorrado) {
            return response.status(400).json({
                ok: false,
                mensaje: 'No existe un medico con ese id',
                errors: { message: 'No existe un medico con ese id' }
            });
        }

        // recurso eliminado => OK
        response.status(200).json({
            ok: true,
            medico: medicoBorrado
        });
    });
});

// EXPORTAR EL ARCHIVO
module.exports = app;