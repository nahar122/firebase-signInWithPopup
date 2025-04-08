import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  signInWithCredential
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import firebaseConfig from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const PARENT_FRAME = document.location.ancestorOrigins[0];
const PROVIDER = new GoogleAuthProvider();

function sendResponse(result) {
  globalThis.parent.self.postMessage(JSON.stringify(result), PARENT_FRAME);
}

globalThis.addEventListener("message", function ({ data }) {
  if (data.initAuth) {
    signInWithPopup(auth, PROVIDER).then( (result) => {return signInWithCredential(result.credential)}).then(sendResponse).catch(sendResponse);
  }
});
