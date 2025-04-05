
// Importa las funciones necesarias de Firebase
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Configuración mínima para inicializar Firebase
const initialConfig = {
    apiKey: "AIzaSyDZ-_dETKSOZVWQMP91w-1o3OtlBTLFILM",
    authDomain: "sgifjs.firebaseapp.com",
    databaseURL: "https://sgifjs-default-rtdb.firebaseio.com"
};

// Inicializa la app Firebase con configuración mínima si no está ya inicializada
let app;
if (!getApps().length) {
    app = initializeApp(initialConfig);
} else {
    app = getApp();
}

let auth = null;
const database = getDatabase(app);


// Lee la configuración completa desde la base de datos
const configRef = ref(database, 'sgi/config');
get(configRef).then((snapshot) => {
    if (snapshot.exists()) {
        const config = snapshot.val();
        if (!getApps().length) {
            initializeApp(config);
        }

    } else {
        console.log("No se encontró el documento de configuración.");
    }
}).catch((error) => {
    console.log("Error al obtener la configuración:", error);
});

auth = getAuth(app);


// Función para autenticar al usuario
function login(email, password) {
    console.log("email:", email);
    console.log("password:", password);
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("userCredential:", userCredential); // Agregar esta línea
            const user = userCredential.user;
            //alert(user.uid);
            const mensaje = "Usuario Valido";
            mostrarAlerta(mensaje,'info','Pagina de acceso');
            console.log("Usuario autenticado:", user);
            // Aquí puedes acceder a la base de datos
            //window.location.href = "/intranet/asistencias/visorAsistencias.html";
            console.log("user.uid:", user.uid);
            const uid = user.uid;

            readData(uid);
        })
        .catch((error) => {
            //alert(error);
            const mensaje = "Usuario Invalido";
            mostrarAlerta(mensaje,'error', 'Pagina de acceso');
            console.error("Error al autenticar:", error);
        });
}

async function readData(uid) {
    console.log("uid:", uid);
            // Aquí puedes acceder a la base de datos
    const database = getDatabase(app);
    const userRef = ref(database, `sgi/catalogos/usuarios/${uid}`);

    get(userRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("Datos adicionales del usuario:", userData);
            // Aquí puedes manejar los datos adicionales del usuario como desees

            //console.log("Datos adicionales del usuario: userData.role, userData.iglesia", userData.role+userData.iglesia );


            const iglesiasDescripciones = await Promise.all(userData.iglesias.map(async iglesia => {
                const iglesiaRef = ref(database, `sgi/catalogos/iglesias/${iglesia.key}`);
                const iglesiaSnapshot = await get(iglesiaRef);
                if (iglesiaSnapshot.exists()) {
                    const iglesiaData = iglesiaSnapshot.val();
                    return { nombre: iglesiaData.descripcion }; // Corregido: usa 'descripcion' como 'nombre'
                } else {
                    return null;
                }
            }));
            
            const rolesDescripciones = await Promise.all(userData.roles.map(async rol => {
                const rolRef = ref(database, `sgi/catalogos/roles/${rol.key}`);
                const rolSnapshot = await get(rolRef);
                if (rolSnapshot.exists()) {
                    const rolData = rolSnapshot.val();
                    console.log("rolData de Firebase:", rolData); // 
                    return { rol: rolData.rol, descripcion: rolData.descripcion }; // Asume que rolData tiene 'rol' y 'descripcion'
                } else {
                    return null; // O puedes retornar un objeto con valores por defecto si prefieres
                }
            }));
            
            console.log("rolesDescripciones:", rolesDescripciones);

            const datosUsuario = {
                nombre: userData.nombre,
                roles: userData.roles,
                rolesDescripciones: rolesDescripciones,
                iglesiasDescripciones: iglesiasDescripciones
            };
            
            const datosCodificados = encodeURIComponent(JSON.stringify(datosUsuario));
            window.location.href = `intranet/menu/menu.html?datos=${datosCodificados}`;

        } else {
            console.log("No se encontraron datos del usuario.");
        }
    }).catch((error) => {
        console.error("Error al obtener los datos del usuario:", error);
    });
}

// Función para redirigir al usuario basado en el rol
/*function redirectToMenu(rol, idIglesia) {
    const menuUrl = `/intranet/menu/menu.html?rol=${rol}&iglesia=${idIglesia}`;
    window.location.href = menuUrl; // Redirige a la página del menú
}*/

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    login(email, password);
});

function mostrarAlerta(Pmensaje,Picono, Ptitulo) {
    
    Swal.fire({
        title: Ptitulo,
        text: Pmensaje,
        icon: Picono,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    });

}


// Función para desloguear al usuario
function logout() {
    signOut(auth).then(() => {
        console.log("Usuario deslogueado");
        //window.location.href = "../acceso/login.html";
    }).catch((error) => {
        console.error("Error al desloguear:", error);
    });
}

// Llama a la función logout cuando se carga la página de login
window.addEventListener("load", logout);

