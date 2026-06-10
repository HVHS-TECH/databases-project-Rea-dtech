
var GLOBAL_user;

console.log("Running Bird Games");


// =========================
// Auth Toggle Functions
// =========================

// toggle between login and register forms
function toggleForms() {

  let loginForm = document.getElementById('loginForm');
  let registerForm = document.getElementById('registerForm');

  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }
}


// =========================
// Login Functions
// =========================

// validate and login existing player
async function loginPlayer() {

  try {

    let playerName = document.getElementById('loginName').value.trim();
    let playerPassword = document.getElementById('loginPassword').value.trim();

    // validation checks
    if (!playerName) {
      alert('Please enter your name');
      return;
    }

    if (!playerPassword) {
      alert('Please enter your password');
      return;
    }

    console.log('Attempting login for: ' + playerName);

    // search for user in database
    let snapshot = await firebase.database().ref('/users/').once('value');
    let users = snapshot.val();

    if (!users) {
      alert('No users found. Please register first.');
      return;
    }

    // find matching user
    let foundUser = null;
    let userId = null;

    let keys = Object.keys(users);

    for (let i = 0; i < keys.length; i++) {

      let user = users[keys[i]];

      if (user.name === playerName && user.password === playerPassword) {
        foundUser = user;
        userId = keys[i];
        break;
      }
    }

    if (!foundUser) {
      alert('Invalid name or password');
      console.log('Login failed for: ' + playerName);
      return;
    }

    console.log('Login successful for: ' + playerName);

    // set global user object
    GLOBAL_user = {
      uid: userId,
      name: foundUser.name,
      age: foundUser.age
    };

    displayMainContent();

  } catch (error) {

    console.error('Login failed: ', error);
    alert('Error logging in. Please try again.');

  }
}


// =========================
// Registration Functions
// =========================

// validate and register new player
async function registerPlayer() {

  try {

    let playerName = document.getElementById('playerName').value.trim();
    let playerAge = Number(document.getElementById('playerAge').value);
    let playerPassword = document.getElementById('playerPassword').value.trim();
    let ageWarning = document.getElementById('ageWarning');

    // validation checks
    if (!playerName) {
      alert('Please enter your name');
      return;
    }

    if (isNaN(playerAge) || playerAge < 1 || playerAge > 120) {
      alert('Please enter a valid age');
      return;
    }

    if (!playerPassword) {
      alert('Please enter a password');
      return;
    }

    // age restriction check
    if (playerAge <= 14) {
      ageWarning.style.display = 'block';
      console.log('Player age too young: ' + playerAge);
      return;
    }

    ageWarning.style.display = 'none';

    let userId = 'user_' + Date.now();

    console.log('Registering player: ' + playerName + ' (Age: ' + playerAge + ')');

    // save player data to database
    await firebase.database().ref('/users/' + userId).set({

      name: playerName,
      age: playerAge,
      password: playerPassword,
      registeredAt: new Date().toISOString()

    });

    console.log('Player data saved to database');

    // set global user object
    GLOBAL_user = {
      uid: userId,
      name: playerName,
      age: playerAge
    };

    displayMainContent();

  } catch (error) {

    console.error('Registration failed: ', error);
    alert('Error registering. Please try again.');

  }
}


// =========================
// Display Functions
// =========================

// show main game content
function displayMainContent() {

  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';

  if (GLOBAL_user) {

    let greeting = 'Welcome, ' + GLOBAL_user.name + '! (Age: ' + GLOBAL_user.age + ')';

    document.getElementById('playerGreeting').textContent = greeting;

    console.log('Displayed main content for ' + GLOBAL_user.name);

  }
}

// show login/register forms
function displayAuthForms() {

  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('mainContainer').style.display = 'none';

  console.log('Displayed auth forms');

}


// =========================
// Logout Functions
// =========================

// logout and return to auth forms
function logout() {

  GLOBAL_user = null;

  document.getElementById('loginName').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('playerName').value = '';
  document.getElementById('playerAge').value = '';
  document.getElementById('playerPassword').value = '';
  document.getElementById('ageWarning').style.display = 'none';

  // show login form on logout
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';

  displayAuthForms();

  console.log('Player logged out');

}


// =========================
// Page Load
// =========================

// check if user is already logged in on page load
window.addEventListener('load', function() {

  if (GLOBAL_user) {
    displayMainContent();
  } else {
    displayAuthForms();
  }

  console.log('Page loaded');

})


async function userInfo () {
  try {
    if (!GLOBAL_user) {
      alert("Please log in first");
      return;
    }

    let uid = GLOBAL_user.uid;
    let email = GLOBAL_user.email;
    let profile = GLOBAL_user.photoURL;

    await firebase.database()
      .ref('/users/' + uid)
      .set({
        email: email,
        uid: uid,
        profile: profile,
      });

  } catch (error) {
    console.error("Failed to save user info:", error);
  }
}



