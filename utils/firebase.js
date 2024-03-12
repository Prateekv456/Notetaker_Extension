// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

//---------Replace This with your Own SDK-------->

const firebaseConfig = {
  apiKey: "AIzaSyAcBOwmzwZ0AfLbxcTY5aeTdLD6o02-Hk0",
  authDomain: "notetaker-extension.firebaseapp.com",
  projectId: "notetaker-extension",
  storageBucket: "notetaker-extension.appspot.com",
  messagingSenderId: "286065707183",
  appId: "1:286065707183:web:d4a7d75175a790f4412c5a",
  measurementId: "G-GHK6D70MKB"
};

// Initialize Firebase
try{
  firebase.initializeApp(firebaseConfig);
}
catch(e){
  console.log(e);
}