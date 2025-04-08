import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  signInWithCredential
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import firebaseConfig from "./firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const PARENT_FRAME = document.location.ancestorOrigins[0];
const PROVIDER = new GoogleAuthProvider();

// Logging function
function logStep(message, data = null) {
  const logContainer = document.getElementById('logContainer');
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = new Date().toISOString() + ': ';
  
  logEntry.appendChild(timestamp);
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  logEntry.appendChild(messageSpan);
  
  if (data) {
    const dataContent = document.createElement('pre');
    try {
      dataContent.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      dataContent.textContent = '[Circular object or non-serializable data]';
    }
    logEntry.appendChild(dataContent);
  }
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight; // Auto-scroll to bottom
  
  console.log(message, data); // Also log to console for debugging
}

// Function to send response back to parent
function sendResponse(result) {
  logStep('Sending response to parent frame', result);
  globalThis.parent.self.postMessage(JSON.stringify(result), PARENT_FRAME);
}

// Handle auth process manually with button
document.addEventListener('DOMContentLoaded', () => {
  const signInButton = document.getElementById('signInButton');
  
  signInButton.addEventListener('click', () => {
    performAuthFlow();
  });
  
  logStep('Page loaded, auth button ready');
});

// Function to perform the authentication flow
function performAuthFlow() {
  logStep('Starting authentication flow');
  
  // Add scopes if needed
  PROVIDER.addScope('email');
  PROVIDER.addScope('profile');
  logStep('Added scopes to provider', { scopes: ['email', 'profile'] });
  
  // Start the popup sign-in
  logStep('Initiating signInWithPopup');
  signInWithPopup(auth, PROVIDER)
    .then((result) => {
      logStep('signInWithPopup completed successfully', result);
      
      logStep('Initiating signInWithCredential');
      return signInWithCredential(auth, result);
    })
    .then((userCredential) => {
      logStep('signInWithCredential completed successfully', {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName
        }
      });
      
      return userCredential;
    })
    .then(sendResponse)
    .catch((error) => {
      logStep('Authentication error', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential ? '[CREDENTIAL PRESENT]' : null
      });
      
      sendResponse({
        error: {
          code: error.code,
          message: error.message
        }
      });
    });
}

// Keep the original message listener for compatibility
globalThis.addEventListener("message", function ({ data }) {
  if (data.initAuth) {
    logStep('Received initAuth message from parent', data);
    performAuthFlow();
  } else {
    logStep('Received unknown message from parent', data);
  }
});
