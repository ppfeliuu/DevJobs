const mongoose = require("mongoose");
const Usuarios = mongoose.model("Usuarios");
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
      if(error) {
        if(error instanceof multer.MulterError) {
          if(error.code === 'LIMIT_FILE_SIZE') {
            req.flash('error', 'Archivo muy grande, max: 100kb');
          } else {
            req.flash('error', error.message);
          }
        } else {
          req.flash('error', error.message);
        }
        res.redirect('/administracion');
        return;
      } else {
        return next()
      }
      
    });
}
   

//Opciones de multer
const configuracionMulter = {
  limits: { fileSize: 100000},
  storage: fileStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, __dirname+'../../public/uploads/perfiles')
      },
      filename: (req, file, cb) => {
        const extension = file.mimetype.split('/')[1];     
        cb(null, `${shortid.generate()}.${extension}`);
      }
  }),
  fileFilter(req, file, cb) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(new Error('Formato no válido'), false)
    }
  }
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crear cuenta en DevJobs",
    tagline: "Publica tus vacantes gratis... Crea tu cuenta ahora"
  });
};

exports.validarRegistro = (req, res, next) => {
  //Sanitizar los datos

  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  req.sanitizeBody("password").escape();
  req.sanitizeBody("confirmar").escape();

  //validar
  req.checkBody("nombre", "El nombre es obligatorio").notEmpty();
  req.checkBody("email", "El email debe ser válido").isEmail();
  req.checkBody("password", "El password es obligatorio").notEmpty();
  req.checkBody("confirmar", "Repetir password es obligatorio").notEmpty();
  req
    .checkBody("confirmar", "Los passwords son diferentes")
    .equals(req.body.password);

  const errores = req.validationErrors();

  if (errores) {
    // si hay errores
    console.log(errores);
    req.flash(
      "error",
      errores.map(error => error.msg)
    );

    res.render("crear-cuenta", {
      nombrePagina: "Crear cuenta en DevJobs",
      tagline: "Publica tus vacantes gratis... Crea tu cuenta ahora",
      mensajes: req.flash()
    });

    return;
  }

  // Si pasa la validacion
  next();
};

exports.crearUsuario = async (req, res, next) => {
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
  } catch (error) {
    req.flash("error", error);
    res.redirect("/crear-cuenta");
  }
};

exports.formIniciarSesion = (req, res) => {
  res.render("iniciar-sesion", {
    nombrePagina: "Iniciar Sesión DevJobs"
  });
};

exports.formEditarPerfil = (req, res) => {
  res.render("editar-perfil", {
    nombrePagina: "Edita tu perfil en DevJobs",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    usuario: req.user
  });
};

exports.guardarCambiosEditarPerfil = async (req, res, next) => {
  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;

  if (req.body.password) {
    usuario.password = req.body.password;
  }

  if(req.file) {
    usuario.imagen = req.file.filename
  }

  await usuario.save();

  req.flash("correcto", "Cambios guardados!!");

  res.redirect("/administracion");
};

// sanitizar y validar formulario de perfiles
exports.validarPerfil = (req, res, next) => {
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();

  if (req.body.password) {
    req.sanitizeBody("password").escape();
  }

  //validar
  req.checkBody("nombre", "Nombre no puede estar vacion").notEmpty();
  req.checkBody("email", "Email no puede estar vacion").notEmpty();

  const errores = req.validationErrors();
  if (errores) {

    req.flash('error', errores.map(error => error.msg));
    
    res.render("editar-perfil", {
      nombrePagina: "Edita tu perfil en DevJobs",
      cerrarSesion: true,
      nombre: req.user.nombre,
      usuario: req.user,
      imagen: req.user.imagen,
      mensajes: req.flash()
    });
  }

  next();
};
