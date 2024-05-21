const sqlite3 = require('sqlite3').verbose();
const dbName = 'myDatabase.db';

let db = new sqlite3.Database(dbName, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Conectado a la base de datos");


        // Habilitar soporte para claves foráneas en SQLite
        db.run("PRAGMA foreign_keys = ON");

        // Comprobar y crear la tabla 'usuarios'
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'", (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (!row) {
                db.run('CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, us_nombre TEXT, us_correo TEXT, us_cargo TEXT, us_foto TEXT, us_celular TEXT, us_contraseña TEXT)', (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("Tabla usuarios creada");
                    }
                });
            } else {
                console.log("La tabla usuarios ya existe");
            }
        });

        // Comprobar y crear la tabla 'fcmtokens' con clave foránea
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='fcmtokens'", (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (!row) {
                db.run('CREATE TABLE IF NOT EXISTS fcmtokens (id INTEGER PRIMARY KEY AUTOINCREMENT, fk_usuario INTEGER, fcm_token TEXT, FOREIGN KEY (fk_usuario) REFERENCES usuarios(id))', (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("Tabla fcmtokens creada");
                    }
                });
            } else {
                console.log("La tabla fcmtokens ya existe");
            }
        });


        // Comprobar y crear la tabla 'mensajes'
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='mensajes'", (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (!row) {
                db.run('CREATE TABLE IF NOT EXISTS mensajes (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, mensaje TEXT, email_remitente TEXT, email_destinatario TEXT, fcm_tokens LONGTEXT,res_firebase TEXT)', (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("Tabla mensajes creada");      
                    }
                });
            } else {
                console.log("La tabla mensajes ya existe");
            }
        });








        


    }
});

module.exports = db;
