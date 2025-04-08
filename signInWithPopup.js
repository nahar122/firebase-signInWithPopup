import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  getAuth,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import firebaseConfig from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const PARENT_FRAME = document.location.ancestorOrigins[0];
const PROVIDER = new GoogleAuthProvider();

function sendResponse(result) {
  // Ensure the result is serializable
  let responseData;
  
  // Handle user object/credential by converting to JSON
  if (result && result.user) {
    responseData = result.user.toJSON();
  } else if (result && result._tokenResponse) {
    // For user credentials
    responseData = result.toJSON ? result.toJSON() : result;
  } else {
    // For errors or other responses
    responseData = result;
  }
  
  globalThis.parent.self.postMessage(JSON.stringify(responseData), PARENT_FRAME);
}

globalThis.addEventListener("message", function (event) {
  const data = event.data;
  
  if (data.initAuth) {
    // Initial authentication with popup
    signInWithPopup(auth, PROVIDER)
      .then(sendResponse)
      .catch(sendResponse);
  } else if (data.refreshToken) {
    // Handle token refresh
    try {
      const authData = data.authData;
      
      // Ensure we have refresh token data
      if (!authData || !authData.stsTokenManager || !authData.stsTokenManager.refreshToken) {
        sendResponse({ error: "Missing refresh token data" });
        return;
      }
      
      // Create credential from refresh token
      const credential = GoogleAuthProvider.credential(
        null, // No ID token
        authData.stsTokenManager.refreshToken
      );
      
      // Sign in with the credential to refresh tokens
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          sendResponse(userCredential);
        })
        .catch((error) => {
          sendResponse({ error: error.message || "Token refresh failed" });
        });
    } catch (e) {
      sendResponse({ error: e.message || "Token refresh error" });
    }
  } else if (data.getCurrentUser) {
    // Return the current user if signed in
    const currentUser = auth.currentUser;
    if (currentUser) {
      sendResponse(currentUser);
    } else {
      sendResponse({ error: "No user is signed in" });
    }
  } else {
    sendResponse({ error: "Invalid request" });
  }
});
