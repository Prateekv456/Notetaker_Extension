function checkUserIdCookie() {
  const userIdCookieDetails = {
    name: "UserId",
    url: "https://meet.google.com"
  };

  chrome.cookies.get(userIdCookieDetails, async function (userIdCookie) {
    if (userIdCookie) {
      console.log("UserId cookie exists:", userIdCookie.value);
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log("Tabs are",tabs)
      let tabId = (tabs && tabs[0]) ? tabs[0]?.id : null
      console.log("Tab id is ", tabId)

      const meetingPresentCookieDetails = {
        name: `MeetingPresent_${tabId}`,
        url: "https://meet.google.com"
      };

      chrome.cookies.get(meetingPresentCookieDetails, function (meetingPresentCookie) {
        if (meetingPresentCookie) {
          console.log("MeetingPresent cookie exists.");
          window.location.href = "../views/recording.html";
        } else {
          window.location.href = "../views/auth.html";
          console.log("MeetingPresent cookie does not exist.");
        }
      });
    } else {
      console.log("UserId cookie does not exist.");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  checkUserIdCookie();
});
