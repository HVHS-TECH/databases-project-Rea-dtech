function fb_login() {

  authenticationListener =
    firebase.auth().onAuthStateChanged(fb_handleLogin);

}


// runs when login state changes
function fb_handleLogin(_user) {

  if (_user) {

    console.log("User is logged in");

    GLOBAL_user = _user;

  } else {

    console.log("User is not logged in");

    fb_popupLogin();

  }
}


// Google login popup
function fb_popupLogin() {

  var provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth()
    .signInWithPopup(provider)
    .then((result) => {

      GLOBAL_user = result.user;

      console.log("User has logged in");

    })
    .catch((error) => {

      console.error("Login failed:", error);

    });
}
