import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


export function signUpWithEmail(email, password) {

  return createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

}


export function logInWithEmail(email, password) {

  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );

}


export function logInWithGoogle() {

  const provider =
    new GoogleAuthProvider();

  return signInWithPopup(auth, provider);

}


export function logInWithGithub() {

  const provider =
    new GithubAuthProvider();

  return signInWithPopup(auth, provider);

}


export function logOutUser() {

  return signOut(auth);

}


export function onAuthChange(callback) {

  return onAuthStateChanged(auth, callback);

}


export function sendVerificationEmail(user) {

  return sendEmailVerification(user);

}


export async function refreshUser(user) {

  await reload(user);

  return user;

}


export function isPasswordAccount(user) {

  return user.providerData.some(
    provider => provider.providerId === "password"
  );

}


export function reauthenticateWithPassword(user, password) {

  const credential =
    EmailAuthProvider.credential(user.email, password);

  return reauthenticateWithCredential(user, credential);

}


export function reauthenticateWithGoogle(user) {

  return reauthenticateWithPopup(
    user,
    new GoogleAuthProvider()
  );

}


export function reauthenticateWithGithub(user) {

  return reauthenticateWithPopup(
    user,
    new GithubAuthProvider()
  );

}


export function resetPassword(email) {

  return sendPasswordResetEmail(auth, email);

}

export function getFriendlyAuthError(error) {

  const map = {

    "auth/invalid-email":
      "That email address isn't valid.",

    "auth/user-not-found":
      "No account found with that email.",

    "auth/wrong-password":
      "Incorrect password.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/email-already-in-use":
      "An account with this email already exists.",

    "auth/weak-password":
      "Password should be at least 6 characters.",

    "auth/popup-closed-by-user":
      "Sign-in was cancelled."

  };

  return (
    map[error.code] ||
    "Something went wrong. Please try again."
  );

}

export function signInAsGuest() {

  return signInAnonymously(auth);

}