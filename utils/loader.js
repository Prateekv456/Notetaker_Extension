window.onload = async () => {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let tabId = (tabs && tabs[0]) ? tabs[0]?.id : null
  if(tabId){
    const meetingPresentCookieDetails = {
      name: `MeetingPresent_${tabId}`,
      url: "https://meet.google.com"
    };
    let cookie = await chrome.cookies.get(meetingPresentCookieDetails);
    console.log("Cookie",cookie)

    if(cookie){
      setTimeout(()=>{
        window.location.href = "../views/recording.html"
      }, 15000)
    }
  }

}