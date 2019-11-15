const mongoose = require('mongoose');
// Como mongoose lo importa
const Vacantes = mongoose.model('Vacantes');

exports.mostrarTrabajos = async(req, res, next) => {

    const vacantes = await Vacantes.find();

    if(!vacantes) return next();

    res.render('home', {
        nombrePagina: 'devJobs',
        tagline: 'Trabajos devJosb',
        barra: true,
        boton: true,
        vacantes
    })
}