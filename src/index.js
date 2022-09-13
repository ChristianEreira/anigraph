import { app } from "./init.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, EmailAuthProvider, onAuthStateChanged } from "firebase/auth";
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

// Redirect user if logged in
const auth = getAuth(app);
onAuthStateChanged(auth, user => {
  if (user) {
    window.location.href = "signed-in.html";
  }
});

// Initialise FirebaseUI sign-in
var uiConfig = {
  signInSuccessUrl: 'signed-in.html',
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    FacebookAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID
  ],
  signInFlow: 'popup',
};
var ui = new firebaseui.auth.AuthUI(getAuth(app));
ui.start('#firebaseui-auth-container', uiConfig);

window.onload = () => {
  document.getElementById('signInButton').onclick = () => {
    document.getElementById('signInPopup').classList.remove('hidden');
  };

  document.getElementById('featureButton').onclick = () => {
    document.getElementById('signInPopup').classList.remove('hidden');
  };

  document.getElementById('signInCloseButton').onclick = () => {
    document.getElementById('signInPopup').classList.add('hidden');
  };
};