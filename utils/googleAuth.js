document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById('loginButton');

  loginButton.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      chrome.identity.getAuthToken({ interactive: false }, function(current_token){
        if(current_token){
          console.log("Token: ", current_token)
          chrome.identity.removeCachedAuthToken({token: current_token}, ()=>{})
          console.log("Removing cached token");
          var xhr = new XMLHttpRequest();
          xhr.open("GET", "https://accounts.google.com/o/oauth2/revoke?token=" + current_token, true);

          xhr.onload = function () {
            if (xhr.status === 200) {
              console.log("Token revoked successfully");
              signInWithGoogle();
            } else {
              console.error("Error revoking token:", xhr.statusText);
            }
          };
            xhr.send();
        }else{
          console.log("Token is not present")
          signInWithGoogle();
        }
      });
    });
  });

  function signInWithGoogle() {
    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
      const provider = new firebase.auth.GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
      })
      let credential = provider.credential(null, token);
      firebase.auth().signInWithCredential(credential)
        .then((result) => {
          console.log("Login successful!");
          addUserCookie(result)
          checkUserIdCookie();
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  function clearUserId(){
    chrome.cookies.remove({
      url: 'https://meet.google.com',
      name: 'UserId'
    }, function(removedCookie) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log('Cookie removed:', removedCookie);
      }
    });
  }

  function addUserCookie(user){
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 2 * 60 * 60 * 1000);

    const cookieDetails = {
      name: "UserId",
      value: user?.credential?.accessToken,
      url: 'https://meet.google.com',
      expirationDate: expirationDate.getTime() / 1000,
    };
    chrome.cookies.set(cookieDetails, function (cookie) {
      if (chrome.runtime.lastError) {
          console.error("Error setting cookie:", chrome.runtime.lastError);
      } else {
          console.log("UserId cookie set with a 2-hour expiration.");
      }
    });
  }
});