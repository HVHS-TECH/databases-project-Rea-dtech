var GLOBAL_user;
var GOOGLE_USER;

console.log("Running Bird Games");


// =========================
// Google Authentication
// =========================

// Google Sign In
function googleSignIn() {

  var provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth()
    .signInWithPopup(provider)
    .then((result) => {

      let googleUser = result.user;

      console.log("User signed in with Google: " + googleUser.email);

      // Store Google user temporarily
      GOOGLE_USER = googleUser;

      // Show additional info form
      let googleSignInForm = document.getElementById('googleSignInForm');
      let additionalInfoForm = document.getElementById('additionalInfoForm');
      let googleNameDisplay = document.getElementById('googleNameDisplay');

      if (googleSignInForm) googleSignInForm.style.display = 'none';
      if (additionalInfoForm) additionalInfoForm.style.display = 'block';
      if (googleNameDisplay) googleNameDisplay.textContent = 'Welcome, ' + (googleUser.displayName || googleUser.email.split('@')[0]) + '!';

    })
    .catch((error) => {

      console.error("Google login failed:", error);
      alert('Error signing in with Google. Please try again.');

    });
}

// Complete registration with age and password
async function completeRegistration() {

  try {

    if (!GOOGLE_USER) {
      alert('Please sign in with Google first');
      return;
    }

    let playerAgeElement = document.getElementById('playerAge');
    let playerPasswordElement = document.getElementById('playerPassword');
    let ageWarning = document.getElementById('ageWarning');

    if (!playerAgeElement || !playerPasswordElement) {
      alert('Form elements not found');
      return;
    }

    let playerAge = Number(playerAgeElement.value);
    let playerPassword = playerPasswordElement.value.trim();

    // Validation
    if (isNaN(playerAge) || playerAge < 1 || playerAge > 120) {
      alert('Please enter a valid age');
      return;
    }

    if (!playerPassword) {
      alert('Please enter a password');
      return;
    }

    if (playerAge <= 14) {
      if (ageWarning) ageWarning.style.display = 'block';
      console.log('Player age too young: ' + playerAge);
      return;
    }

    if (ageWarning) ageWarning.style.display = 'none';

    let userId = 'google_' + GOOGLE_USER.uid;

    console.log('Registering: ' + GOOGLE_USER.displayName + ' (Age: ' + playerAge + ')');

    // Save to database
    await firebase.database().ref('/users/' + userId).set({
      name: GOOGLE_USER.displayName || GOOGLE_USER.email.split('@')[0],
      age: playerAge,
      password: playerPassword,
      email: GOOGLE_USER.email,
      uid: GOOGLE_USER.uid,
      registeredAt: new Date().toISOString()
    });

    // Set global user
    GLOBAL_user = {
      uid: userId,
      name: GOOGLE_USER.displayName || GOOGLE_USER.email.split('@')[0],
      age: playerAge
    };

    displayMainContent();

  } catch (error) {

    console.error('Registration failed: ', error);
    alert('Error completing registration. Please try again.');

  }
}


// =========================
// Display Functions
// =========================

// show main game content
function displayMainContent() {

  let authContainer = document.getElementById('authContainer');
  let mainContainer = document.getElementById('mainContainer');

  if (authContainer) {
    authContainer.style.display = 'none';
  }

  if (mainContainer) {
    mainContainer.style.display = 'block';
  }

  if (GLOBAL_user) {

    let greeting = 'Welcome, ' + GLOBAL_user.name + '! (Age: ' + GLOBAL_user.age + ')';
    let greetingElement = document.getElementById('playerGreeting');

    if (greetingElement) {
      greetingElement.textContent = greeting;
    }

    console.log('Displayed main content for ' + GLOBAL_user.name);

  }
}

// show login/register forms
function displayAuthForms() {

  let authContainer = document.getElementById('authContainer');
  let mainContainer = document.getElementById('mainContainer');
  let googleSignInForm = document.getElementById('googleSignInForm');
  let additionalInfoForm = document.getElementById('additionalInfoForm');

  if (authContainer) {
    authContainer.style.display = 'block';
  }

  if (mainContainer) {
    mainContainer.style.display = 'none';
  }

  if (googleSignInForm) {
    googleSignInForm.style.display = 'block';
  }

  if (additionalInfoForm) {
    additionalInfoForm.style.display = 'none';
  }

  console.log('Displayed auth forms');

}


// =========================
// Logout Functions
// =========================

// logout and return to auth forms
function logout() {

  GLOBAL_user = null;
  GOOGLE_USER = null;

  let playerAge = document.getElementById('playerAge');
  let playerPassword = document.getElementById('playerPassword');
  let ageWarning = document.getElementById('ageWarning');

  if (playerAge) playerAge.value = '';
  if (playerPassword) playerPassword.value = '';
  if (ageWarning) ageWarning.style.display = 'none';

  firebase.auth().signOut();

  displayAuthForms();

  console.log('Player logged out');

}


// =========================
// Page Load
// =========================

// check if user is already logged in on page load
window.addEventListener('load', function () {

  firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
      // User is authenticated with Google, find them in database
      let snapshot = await firebase.database().ref('/users/').once('value');
      let users = snapshot.val();
      let foundUser = null;
      let userId = null;

      if (users) {
        let keys = Object.keys(users);
        for (let i = 0; i < keys.length; i++) {
          if (users[keys[i]].uid === user.uid) {
            foundUser = users[keys[i]];
            userId = keys[i];
            break;
          }
        }
      }

      if (foundUser) {
        GLOBAL_user = {
          uid: userId,
          name: foundUser.name,
          age: foundUser.age
        };
        displayMainContent();
      } else {
        displayAuthForms();
      }
    } else {
      displayAuthForms();
    }
  });

  console.log('Page loaded');
  birdLeaderboard()
})

function saveBirdScore(finalScore) {
  // Check if user is logged in
  if (!GLOBAL_user || !GLOBAL_user.uid) {
    console.log('User not logged in, score not saved');
    return;
  }

  let scoreRef = firebase.database().ref('/birdleaderboard/' + GLOBAL_user.uid + '_bird');

  scoreRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      // Only update if new score is higher
      if (finalScore > snapshot.val().score) {
        scoreRef.set({
          name: GLOBAL_user.name,
          score: finalScore,
          date: new Date().toISOString()
        });
      }
    } else {
      // First time, save the score
      scoreRef.set({
        name: GLOBAL_user.name,
        score: finalScore,
        date: new Date().toISOString()
      });
    }
  });
}

function saveClimbScore(climbScore) {
  // Check if user is logged in
  if (!GLOBAL_user || !GLOBAL_user.uid) {
    console.log('User not logged in, score not saved');
    return;
  }

  let scoreRef = firebase.database().ref('/climbleaderboard/' + GLOBAL_user.uid + '_climb');

  scoreRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      // Only update if new score is higher
      if (climbScore > snapshot.val().score) {
        scoreRef.set({
          name: GLOBAL_user.name,
          score: climbScore,
          date: new Date().toISOString()
        });
      }
    } else {
      // First time, save the score
      scoreRef.set({
        name: GLOBAL_user.name,
        score: climbScore,
        date: new Date().toISOString()
      });
    }
  });
}



async function birdLeaderboard() {
  let snapshot = await firebase.database()
    .ref("/birdleaderboard")
    .once("value");

  let users = snapshot.val();

  if (!users) {
    console.log("No scores found");
    return;
  }

  let leaderboardHTML = "<h2>Leaderboard</h2>";
  let keys = Object.keys(users);

  for (let i = 0; i < keys.length; i++) {
    let user = users[keys[i]];
    leaderboardHTML += "<p>" + user.PlayerName + ": " + user.score + "</p>";
  }

  document.getElementById('birdleaderboard').innerHTML = leaderboardHTML;
}



