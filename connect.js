const accountForm = document.querySelector("#account-form");
const accountEmail = document.querySelector("#account-email");
const accountPassword = document.querySelector("#account-password");
const accountName = document.querySelector("#account-name");
const accountConfirm = document.querySelector("#account-confirm");
const nameField = document.querySelector("#name-field");
const confirmField = document.querySelector("#confirm-field");
const connectTitle = document.querySelector("#connect-title");
const connectIntro = document.querySelector("#connect-intro");
const modePrompt = document.querySelector("#mode-prompt");
const modeToggle = document.querySelector("#mode-toggle");
const submitAccount = document.querySelector("#submit-account");
const resetPassword = document.querySelector("#reset-password");
const authStatus = document.querySelector("#auth-status");
const signedInPanel = document.querySelector("#signed-in-panel");
const signedInEmail = document.querySelector("#signed-in-email");
const signOutButton = document.querySelector("#sign-out");
let registrationMode = false;
let auth = null;
let firebaseAuth = null;

function showStatus(message, isError) {
  authStatus.textContent = message;
  authStatus.classList.toggle("is-error", Boolean(isError));
}

function setRegistrationMode(enabled) {
  registrationMode = enabled;
  nameField.hidden = !enabled;
  accountName.required = enabled;
  confirmField.hidden = !enabled;
  accountConfirm.required = enabled;
  accountPassword.autocomplete = enabled ? "new-password" : "current-password";
  connectTitle.textContent = enabled ? "Create your account" : "Welcome back";
  connectIntro.textContent = enabled
    ? "Create an individual account. Paid reports, event access, courses, and member dashboard features are not available yet."
    : "Sign in to your individual account. The broader member portal and corporate team features are still in development.";
  submitAccount.textContent = enabled ? "Create account" : "Sign in";
  modePrompt.textContent = enabled ? "Already have an account?" : "Don't have an account?";
  modeToggle.textContent = enabled ? "Sign in" : "Register";
  resetPassword.hidden = enabled;
  showStatus("", false);
}

function explainFirebaseError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try signing in instead.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Email and password sign-in is not enabled for this Firebase project.",
    "auth/too-many-requests": "Too many attempts. Please wait a while and try again.",
    "auth/unauthorized-domain": "This site domain is not authorized in Firebase Authentication settings.",
    "auth/user-disabled": "This account has been disabled. Contact the site administrator.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/weak-password": "Choose a stronger password with at least six characters.",
    "auth/wrong-password": "The email or password is incorrect."
  };
  return messages[error.code] || "We couldn't complete that request. Please try again.";
}

modeToggle.addEventListener("click", () => setRegistrationMode(!registrationMode));

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth || !firebaseAuth) {
    showStatus("Account access is not configured yet. The form does not store passwords locally.", true);
    return;
  }
  if (!accountForm.reportValidity()) return;

  const email = accountEmail.value.trim();
  const password = accountPassword.value;
  if (registrationMode && password !== accountConfirm.value) {
    showStatus("The passwords do not match.", true);
    accountConfirm.focus();
    return;
  }

  submitAccount.disabled = true;
  showStatus(registrationMode ? "Creating your account..." : "Signing in...", false);
  try {
    if (registrationMode) {
      const credential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      try {
        await firebaseAuth.updateProfile(credential.user, { displayName: accountName.value.trim() });
      } catch (profileError) {
        showStatus("Your account was created, but your name could not be saved. You are signed in.", true);
        return;
      }
      showStatus("Your account is ready. You are signed in.", false);
    } else {
      await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      showStatus("You are signed in.", false);
    }
  } catch (error) {
    showStatus(explainFirebaseError(error), true);
  } finally {
    submitAccount.disabled = false;
  }
});

resetPassword.addEventListener("click", async () => {
  if (!auth || !firebaseAuth) {
    showStatus("Password reset is unavailable until Firebase is configured.", true);
    return;
  }
  const email = accountEmail.value.trim();
  if (!email) {
    showStatus("Enter your email address first, then request a password reset.", true);
    accountEmail.focus();
    return;
  }
  try {
    await firebaseAuth.sendPasswordResetEmail(auth, email);
    showStatus("If an account exists for this email, Firebase will send password-reset instructions.", false);
  } catch (error) {
    showStatus(explainFirebaseError(error), true);
  }
});

signOutButton.addEventListener("click", async () => {
  if (!auth || !firebaseAuth) return;
  try {
    await firebaseAuth.signOut(auth);
    showStatus("You have signed out.", false);
  } catch (error) {
    showStatus(explainFirebaseError(error), true);
  }
});

async function initializeFirebaseAuth() {
  const config = window.BIGJN_FIREBASE_CONFIG || {};
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  if (requiredKeys.some((key) => !config[key])) {
    submitAccount.disabled = true;
    resetPassword.disabled = true;
    showStatus("Account access is not configured yet. Add the Firebase web app settings to firebase-config.js. Passwords are never stored on this site.", true);
    return;
  }

  try {
    const [appModule, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js")
    ]);
    const app = appModule.initializeApp(config);
    auth = authModule.getAuth(app);
    firebaseAuth = authModule;
    submitAccount.disabled = false;
    resetPassword.disabled = false;
    authModule.onAuthStateChanged(auth, (user) => {
      const isSignedIn = Boolean(user);
      accountForm.hidden = isSignedIn;
      document.querySelector(".connect-divider").hidden = isSignedIn;
      modePrompt.hidden = isSignedIn;
      modeToggle.hidden = isSignedIn;
      signedInPanel.hidden = !isSignedIn;
      signedInEmail.textContent = user ? (user.displayName || user.email) : "";
    });
  } catch (error) {
    submitAccount.disabled = true;
    resetPassword.disabled = true;
    showStatus("Firebase could not be loaded. Check the site connection and Firebase setup, then try again.", true);
  }
}

initializeFirebaseAuth();
