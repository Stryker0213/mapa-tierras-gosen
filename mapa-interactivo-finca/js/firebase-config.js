// Import the functions you need from the SDKs you need
// Importa las funciones necesarias de los SDKs de Firebase que se van a utilizar. En este caso, se importan las funciones para inicializar la aplicación y para trabajar con Firestore, la base de datos en tiempo real de Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmzZDJCJW1SfPtFolEsy20TLEJ5Fx_Ay8",
  authDomain: "mapa-interactivo-gosen.firebaseapp.com",
  projectId: "mapa-interactivo-gosen",
  storageBucket: "mapa-interactivo-gosen.firebasestorage.app",
  messagingSenderId: "483987883459",
  appId: "1:483987883459:web:808557135acc7d95f92976"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
