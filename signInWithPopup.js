import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
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
    signInWithPopup(auth, PROVIDER).then(sendResponse).catch(sendResponse);
  } else if (data.refreshToken) {
    // Handle token refresh request
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force token refresh
      currentUser.getIdToken(true)
        .then(token => {
          sendResponse({ token });
        })
        .catch(error => {
          console.error("Error refreshing token:", error);
          sendResponse({ error: error.message });
        });
    } else {
      sendResponse({ error: "No user is signed in" });
    }
  }
});
