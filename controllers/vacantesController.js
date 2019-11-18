const mongoose = require('mongoose');
// Como mongoose lo importa
const Vacantes = mongoose.model('Vacantes');
const multer = require('multer');
const shortid = require('shortid');


exports.formularioNuevaVacante = (req, res) => {
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Rellena el formulario y public vacante',
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre
    })
}

//Añade las vacantes al BBDD
exports.agregarVacante = async (req, res) => {
    
    const vacante = new Vacantes(req.body);

    //Usuario autor
    vacante.autor = req.user._id;

    // crear arreglo de skills
    vacante.skills = req.body.skills.split(',');
 
    // SAVE IN ddbb
    const nuevaVacante = await vacante.save();

    res.redirect(`/vacantes/${nuevaVacante.url}`);

}

exports.mostrarVacante = async(req, res, next) => {
    const vacante = await Vacantes.findOne({ url: req.params.url }).populate('autor');

    //si no hay results
    if(!vacante) return next();

    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })
}

exports.formEditarVacante = async(req, res, next) => {
    const vacante = await Vacantes.findOne({ url: req.params.url })

    console.log(vacante);

    if(!vacante) return next();

    res.render('editar-vacante', {
        nombrePagina: `Editar - ${vacante.titulo}`,
        vacante,
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre,
    })
}

exports.editarVacante = async(req, res, next) => {
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    console.log(vacanteActualizada);

    const vacante = await Vacantes.findOneAndUpdate({url: req.params.url},
        vacanteActualizada, {
            new: true,
            runValidators: true
        })

    res.redirect(`/vacantes/${vacante.url}`);
}

//Validar y sanitizar los campos de nuevas vacantes
exports.validarVacante = (req, res, next) => {
    //sanitizar los campos

    req.sanitizeBody('titulo').escape();
    req.sanitizeBody('empresa').escape();
    req.sanitizeBody('ubicacion').escape();
    req.sanitizeBody('salario').escape();
    req.sanitizeBody('contrato').escape();
    req.sanitizeBody('skills').escape();

    //validar
    req.checkBody('titulo', 'Agrega un título').notEmpty();
    req.checkBody('empresa', 'Agrega una empresa').notEmpty();
    req.checkBody('ubicacion', 'Agrega una ubicación').notEmpty();
    req.checkBody('contrato', 'Agrega un contrato').notEmpty();
    req.checkBody('skills', 'Agrega una habilidad').notEmpty();

    const errores = req.validationErrors();

    if(errores) {
        //Recargar vista
        req.flash('error', errores.map(error => error.msg));

        res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Rellena el formulario y public vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })

    }

    next();
}

exports.eliminarVacante = async (req, res) => {
    const { id } = req.params;

    const vacante = await Vacantes.findById(id);

    if(verificarAutor(vacante, req.user)){
        // Todo bien, si es el usuario, eliminar
        vacante.remove();
        res.status(200).send('Vacante Eliminada Correctamente');
    } else {
        // no permitido
        res.status(403).send('Error')
    }    
}

const verificarAutor = (vacante = {}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)) {
        return false
    } 
    return true;
}

// Subir archivos en PDF
exports.subirCV  =  (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El archivo es muy grande: Máximo 100kb');
                } else {
                    req.flash('error', error.message);
                }
            } else {
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        } else {
            return next();
        }
    });
}

// Opciones de Multer
const configuracionMulter = {
    limits : { fileSize : 100000 },
    storage: fileStorage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename : (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'application/pdf' ) {
            // el callback se ejecuta como true o false : true cuando la imagen se acepta
            cb(null, true);
        } else {
            cb(new Error('Formato No Válido'));
        }
    }
}
  
const upload = multer(configuracionMulter).single('cv');

// almacenar los candidatos en la BD
exports.contactar = async (req, res, next) => {

    const vacante = await Vacantes.findOne({ url : req.params.url});

    // sino existe la vacante
    if(!vacante) return next();

    // todo bien, construir el nuevo objeto
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv : req.file.filename
    }

    // almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    // mensaje flash y redireccion
    req.flash('correcto', 'Se envió tu Curriculum Correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async(req, res, next) => {
    const vacante = await Vacantes.findById(req.params.id);

    if(vacante.autor != req.user._id.toString()) {
        return next();
    } 

    if(!vacante) return next();

    res.render('candidatos', {
        nombrePagina: `Candidatos vacantes - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })   
}

exports.buscadorVacantes = async(req, res, next) => {
    const vacantes = await Vacantes.find({
        $text: {
            $search: req.body.q
        }
    });

    //mostrar las vacantes
    res.render('home', {
        nombrePagina: `Resultado de la busqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}