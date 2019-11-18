const passport = require('passport');
const mongoose = require('mongoose');
const Vacantes = mongoose.model('Vacantes');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
});

// Verifica si el usuario está autenticado
exports.verificarUsuario = (req, res, next) => {
    //Revisar usuario
    if(req.isAuthenticated()){
        return next();
    }

    //redirect
    res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async(req, res) => {

    //Consultar el usuario autenticado
    const vacantes = await Vacantes.find({autor: req.user._id});

    res.render('administracion', {
        nombrePagina: 'Panel Administración',
        tagline: 'Panel de administración de vacantes',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res) => {
    req.logout();
    req.flash('correcto', 'Sesión cerrada!!')
    return res.redirect('/iniciar-sesion');
}

exports.formReestablecerPassword = (req, res) => {
    res.render('reestablecer-password', {
    nombrePagina: 'Reestablecer tu password',
    tagline: 'Si ya tienes cuenta, recupera tu password colocando tu email'
    })
}

/* Genera el token en Usuario table */
exports.enviarToken = async(req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email });

    if(!usuario) {
        req.flash('error', 'No existe la cuenta');
        return res.redirect('/iniciar-sesion');
    }

    // el usuario existe, generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    // Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    /* ENVIAR EMAIL */

    await enviarEmail.enviar({
        usuario,
        subject: 'Password reset',
        resetUrl,
        archivo: 'reset'
    })

    req.flash('correcto', 'Revisa tu email y sigue las indicaciones');
    res.redirect('/iniciar-sesion');

}

exports.reestablecerPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario) {
        req.flash('error', 'Formulario no es válido');
        return res.redirect('/reestablecer-password');
    }

    res.render('nuevo-password', {
        nombrePagina: 'Nuevo Password'
    })

}

//Guarda nuevo pass en la BBDD
exports.guardarPassword = async(req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    //no exite el usuario o el token es nvalidao
    if(!usuario) {
        req.flash('error', 'Formulario no es válido');
        return res.redirect('/reestablecer-password');
    }

    // Asignar nuevo password, limpiar valores previos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    //agregar y eliminar valores del objeto
    await usuario.save();

    req.flash('correcto', 'Password modificado correctamente!');
    res.redirect('/iniciar-sesion');
}