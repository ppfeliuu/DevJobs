const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = () => {
    router.get('/', homeController.mostrarTrabajos);

    // Crear vacantes
    router.get('/vacantes/nueva', authController.verificarUsuario, vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', authController.verificarUsuario, vacantesController.validarVacante, vacantesController.agregarVacante);

    //Mostrar vacante
    router.get('/vacantes/:url', vacantesController.mostrarVacante);

    //Editar vacante
    router.get('/vacantes/editar/:url', authController.verificarUsuario, vacantesController.formEditarVacante);
    router.post('/vacantes/editar/:url', authController.verificarUsuario, vacantesController.validarVacante, vacantesController.editarVacante);

    //Eliminar vacantes
    router.delete('/vacantes/eliminar/:id', vacantesController.eliminarVacante);

    // Crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', usuariosController.validarRegistro, usuariosController.crearUsuario);

    // Auth usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion)
    router.post('/iniciar-sesion', authController.autenticarUsuario);
    router.get('/cerrar-sesion', authController.verificarUsuario, authController.cerrarSesion);

    /* Reset password */
    router.get('/reestablecer-password', authController.formReestablecerPassword);
    router.post('/reestablecer-password', authController.enviarToken);

    /* Resetar y almacenar pass */
    router.get('/reestablecer-password/:token', authController.reestablecerPassword);
    router.post('/reestablecer-password/:token', authController.guardarPassword);

    /* Panel de Admin */
    router.get('/administracion', authController.verificarUsuario, authController.mostrarPanel);

    /* Editar Perfil */
    router.get('/editar-perfil', authController.verificarUsuario, usuariosController.formEditarPerfil);
    router.post('/editar-perfil', authController.verificarUsuario, //usuariosController.validarPerfil, 
    usuariosController.subirImagen,
    usuariosController.guardarCambiosEditarPerfil);

    /* Recibir mensajes de Candidatos */
    router.post('/vacantes/:url', vacantesController.subirCV, vacantesController.contactar);

    /* Muestra los candidatos por vacantes */
    router.get('/candidatos/:id', authController.verificarUsuario, vacantesController.mostrarCandidatos);

    return router;
}