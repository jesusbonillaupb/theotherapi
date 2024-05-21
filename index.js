const express = require('express')
const {registrarMensaje,leerfcmtokens,verificarRepetido, registrarToken, registrarUsuario,  leerUsuarios, leerUsuariosPorId, loginUsuario } = require('./crud')
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const axios = require('axios');
const admin = require("firebase-admin");
const serviceAccount= require('./theothermessage-a7681-firebase-adminsdk-kouqe-2f469f17c8.json')


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


var bodyParser = require('body-parser');
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));

// lista de tokens revocados
const tokensRevocados = new Set();

// Rutas 
// Rutas articulos


app.get('/fetch-api',validateToken, async (req, res) => {
    try {
        const response = await axios.get('https://api.npoint.io/237a0d1ac8530064cc04'); // Realiza la petición a la API
        res.status(200).json(response.data); // Devuelve los datos obtenidos de la API
    } catch (error) {
        res.status(500).json({ resultado: 'error', mensaje: 'Error al obtener datos de la API' });
    }
});

// Rutas usuarios
app.get('/usuarios',validateToken, (req, res) => {
    leerUsuarios((err, rows) => {
        if (err) {
            res.status(500).send(err.message)
        } else {
            res.status(200).json(rows)
        }
    })
})

// obtener fcm_tokens de un usuario
app.get('/fcm-usuario/:id', validateToken,(req, res) => {
    const id = req.params.id;
    leerfcmtokens(id, (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            const tokens = rows.map(row => row.fcm_token);
            res.status(200).json(tokens);
        }
    });
});
app.post('/enviar', async (req, res) => {
    const fcm_token = req.body.fcm_token;
    const titulo = req.body.titulo;
    const mensaje = req.body.mensaje;

    const messagePayload ={
        notification: {
            title: titulo,
            body: mensaje,
            
        },
        token: fcm_token

    }
    try {
        const response = await admin.messaging().send(messagePayload); 
        res.status(200).json(response); 
    } catch (error) {
        res.status(500).json({ resultado: 'error', mensaje: error });
    }

});



app.get('/usuarios/:id', (req, res) => {
    const id = req.params.id;
    leerUsuariosPorId(id, (err, articulo) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            if (articulo) {
                res.status(200).json(articulo);
            } else {
                res.status(404).send('Usuario no encontrado');
            }
        }
    });

});

// login
app.post('/login', (req, res) => {
    const us_correo = req.body.correo;
    const us_contraseña = req.body.contraseña;

    loginUsuario(us_correo, us_contraseña, (err, usuario) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            if (usuario) {
                const accessToken = generateAccesToken(usuario);
                res.header('authorization', accessToken).json({
                    success: true,
                    token: accessToken,
                    id: usuario.id 
                }
                );

            } else {
                res.send(JSON.stringify({ success: false, message: 'Empty Data' }));
            }
        }
    });
});
//register
app.post('/register', (req, res) => {
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const cargo = req.body.cargo;
    const foto = req.body.foto;
    const celular = req.body.celular;
    const contraseña= req.body.contraseña;
    

    registrarUsuario(nombre, correo, cargo, foto, celular, contraseña, (err, usuario) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({
                success: true,
                message: 'Usuario registrado exitosamente',
                usuario: usuario
            });
        }
    });
});

// registrar token fc,
// Ruta para registrar un token
app.post('/registrarToken', (req, res) => {
    const fk_usuario = req.body.fk_usuario;
    const fcm_token = req.body.fcm_token;
    

    verificarRepetido(fk_usuario, fcm_token, (err, exists) => {
        if (err) {
            res.status(500).send(err.message);
        } else if (!exists) {
            registrarToken(fk_usuario, fcm_token, (err, token) => {
                if (err) {
                    res.status(500).send(err.message);
                } else {
                    res.json({
                        success: true,
                        message: 'Token registrado exitosamente',
                        token: token
                    });
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Token ya registrado',
               
            });
        }
    });
});


// login con biometricos
app.post('/loginbio', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
        res.send(JSON.stringify({ success: false, message: 'Acceso denegado, no hay token' }));
    } else {
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            if (err) {
                res.send(JSON.stringify({ success: false, message: 'Acceso denegado, token expirado o incorrecto' }));
            }else{
                loginUsuario('jesus@gmail.com', 'jesus123', (err, usuario) => {
                    if (err) {
                        res.status(500).send(err.message);
                    } else {
                        if (usuario) {
                            const accessToken = generateAccesToken(usuario);
                            res.header('authorization', accessToken).json({
                                success: true,
                                token: accessToken
                            }
                            );
            
                        } else {
                            res.send(JSON.stringify({ success: false, message: 'Empty Data' }));
                        }
                    }
                });
            }
        });
    }
});

// confirmar
app.post('/confirmar', (req, res) => {
    const us_correo = req.body.correo;
    const us_contraseña = req.body.contraseña;

    loginUsuario(us_correo, us_contraseña, (err, usuario) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            if (usuario) {
                const LoginToken = generateLoginToken(usuario);
                res.header('authorization', LoginToken).json({
                    success: true,
                    token: LoginToken
                }
                );

            } else {
                res.send(JSON.stringify({ success: false, message: 'Empty Data' }));
            }
        }
    });
});

// logout
app.post('/logout', validateToken, (req, res) => {
    const accessToken = req.headers['authorization'];
    if (!accessToken) {
        return res.status(401).send('Acceso denegado, no hay token');
    }

    // Revocar el token agregándolo a la lista de tokens revocados
    tokensRevocados.add(accessToken);

    res.status(200).send('Token revocado exitosamente');
});

// funcion para generar el token de sesion
function generateAccesToken(usuario) {
    return jwt.sign(usuario, process.env.SECRET, { expiresIn: '7d' });
}

// funcion para generar 
function generateLoginToken(usuario) {
    return jwt.sign(usuario, process.env.SECRET, { expiresIn: '999d' });
}


function validateToken(req, res, next) {
    const accessToken = req.headers['authorization'];
    if (!accessToken) {
        return res.status(401).send('Acceso denegado, no hay token');
    }
    jwt.verify(accessToken, process.env.SECRET, (err, usuario) => {
        if (err) {
            return res.status(401).send('Acceso denegado, token expirado o incorrecto');
        }
        if (tokensRevocados.has(accessToken)) {
            return res.status(401).send('Acceso denegado, token revocado');
        }

        req.usuario = usuario;
        next();
    });
}


// registrar mensaje
app.post('/registrar-mensaje', (req, res) => {
    const titulo = req.body.titulo;
    const mensaje = req.body.mensaje;
    const email_remitente = req.body.email_remitente;
    const email_destinatario = req.body.email_destinatario;
    const fcm_tokens= req.body.fcm_tokens;
    const res_firebase= req.body.res_firebase;
    

    registrarMensaje(titulo, mensaje, email_remitente, email_destinatario, fcm_tokens, res_firebase, (err, mensaje) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({
                success: true,
                message: 'Mensaje registrado exitosamente',
                usuario: mensaje
            });
        }
    });
});



app.listen(3000, () => {
    console.log("Server corriendo en el puerto 3000")
})