const db = require('./database')


//metodos usuarios
const leerUsuarios = (callback) => {
    const sql = 'SELECT * FROM usuarios';
    db.all(sql, [], callback)
}



const loginUsuario = (us_correo, us_contraseña, callback) => {
    const sql = 'SELECT * FROM usuarios WHERE us_correo = ? AND us_contraseña= ?';
    db.get(sql, [us_correo, us_contraseña], (err, usuario) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, usuario);
        }
    });
};

const registrarUsuario = (us_nombre, us_correo, us_cargo, us_foto, us_celular, us_contraseña, callback) => {
    const sql = 'INSERT INTO usuarios (us_nombre, us_correo, us_cargo, us_foto, us_celular, us_contraseña) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [us_nombre, us_correo, us_cargo, us_foto, us_celular, us_contraseña], function (err) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, {
                id: this.lastID,
                us_nombre,
                us_correo,
                us_cargo,
                us_foto,
                us_celular,
                us_contraseña
            });
        }
    });
};
// Método para registrar un token
const registrarToken = (fk_usuario, fcm_token, callback) => {
    const sql = 'INSERT INTO fcmtokens (fk_usuario, fcm_token) VALUES (?, ?)';
    db.run(sql, [fk_usuario, fcm_token], function (err) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, {
                id: this.lastID,
                fk_usuario,
                fcm_token
            });
        }
    });
};

const verificarRepetido = (fk_usuario, fcm_token, callback) => {
    const sql = 'SELECT * FROM fcmtokens WHERE fk_usuario = ? AND fcm_token = ?';
    db.get(sql, [fk_usuario, fcm_token], (err, row) => {
        if (err) {
            callback(err, null);
        } else {
            if (row) {
                callback(null, true); // Token ya existe
            } else {
                callback(null, false); // Token no existe
            }
        }
    });
};


const leerUsuariosPorId = (id, callback) => {
    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    db.get(sql, [id], callback);
};


const leerfcmtokens = (fk_usuario, callback) => {
    const sql = 'SELECT fcm_token FROM fcmtokens WHERE fk_usuario=?';
    db.all(sql, [fk_usuario], callback)
}

const registrarMensaje = (titulo, mensaje, email_remitente, email_destinatario, fcm_tokens, res_firebase, callback) => {
    const sql = 'INSERT INTO mensajes (titulo, mensaje, email_remitente, email_destinatario, fcm_tokens, res_firebase) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [titulo, mensaje, email_remitente, email_destinatario, fcm_tokens, res_firebase], function (err) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, {
                id: this.lastID,
                titulo, mensaje, email_remitente, email_destinatario, fcm_tokens, res_firebase
            });
        }
    });
};


module.exports = {registrarMensaje, leerfcmtokens, verificarRepetido, registrarToken, registrarUsuario, leerUsuarios, leerUsuariosPorId, loginUsuario }