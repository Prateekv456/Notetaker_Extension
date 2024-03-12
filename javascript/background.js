const initialLoadStatus = {};
let notetakerInit = false;

async function checkUserIdCookie(tabId, changeInfo, tab) {
  console.log("Chrome background event Ran")

  const meetingPresentCookieDetails = {
    name: `MeetingPresent_${tabId}`,
    url: "https://meet.google.com"
  };
  let cookie = await chrome.cookies.get(meetingPresentCookieDetails);
  console.log("Cookie",cookie)

  if(!initialLoadStatus[tabId.tabId] && !cookie){
    console.log("Inside")
    const cookieDetailsUserId = {
      name: "UserId",
      url: 'https://meet.google.com'
    };
    console.log("Looking for cookies")
    console.log(tabId)
    chrome.cookies.get(cookieDetailsUserId, function (userIdCookie) {
        if (userIdCookie) {
            console.log("UserId cookie exists:", userIdCookie.value);
            monitorMeetingUrls(tabId, changeInfo, tab);
        } else {
            console.log("UserId cookie does not exist.");
            removeMeetingCookie(tabId)
        }
    });
  }
}

async function monitorMeetingUrls(tabId, changeInfo, tab) {
  console.log("Monitoring")
  console.log("ChangeInfo is ", changeInfo)
  if (changeInfo && changeInfo.status === "complete" && !notetakerInit) {
      const meetingUrl = await fetchIfMeetingUrl(tab.url, tabId);

      console.log('meetingUrl:', meetingUrl);

      if (meetingUrl) {
          console.log('calling notetaker...');
          notetakerInit = true;
          await callNotetakerAPI(tabId, meetingUrl);

          let text;
          if (meetingUrl.includes('zoom')) text = 'getZoomParticipantsList';
          if (meetingUrl.includes('teams')) text = 'getTeamsParticipantsList';
          if (meetingUrl.includes('meet')) text = 'getMeetParticipantsList';

          let done = false, recordingStarted = false;
          while (!done) {
            const participants = await chrome.tabs.sendMessage(
              tabId,
              { action: { tabId, text: text } }
            ).catch(e => console.log(`${text} err`, e));

            console.log(`fn: ${text} response:`, participants);

            if (!recordingStarted && participants?.includes('Notetaker')) {
              console.log('notetaker has joined the call, recording started');
              setMeeting(tabId)
              initialLoadStatus[tabId] = true
              recordingStarted = true;
              console.log("initialLoadStatus is set to: ", initialLoadStatus[tabId])
            }

            if (recordingStarted && !participants?.includes('Notetaker')) {
              console.log('notetaker remove from the call, recording stopped');
              removeMeetingCookie(tabId);
              done = true;
              notetakerInit = false;
            }

            await new Promise((r) => setTimeout(() => r(), 10000));
          }
      }else{
        removeMeetingCookie(tabId)
      }
  }
}

function removeMeetingCookie(tabId){
  const cookieDetailsMeetingPresent = {
    name: `MeetingPresent_${tabId}`,
    url: "https://meet.google.com"
  };

  chrome.cookies.get(cookieDetailsMeetingPresent, function (meetingPresentCookie) {
    if (meetingPresentCookie) {
      chrome.cookies.remove(cookieDetailsMeetingPresent, function (removedCookie) {
        if (chrome.runtime.lastError) {
          console.error("Error removing MeetingPresent cookie:", chrome.runtime.lastError);
        } else {
          console.log("MeetingPresent cookie removed.");
        }
      });
    }
  });
}

async function fetchIfMeetingUrl(url, tabId) {
  const zoomMatch = url.match(/\/j\/(\d+)\?/);
  const googleMeetMatch = url.match(/https:\/\/meet\.google\.com\/([a-z0-9-]+)/i);
  const teamsMatch = matchTeamsUrl(url);
  const zoomLink = await chrome.tabs.sendMessage(
    tabId,
    { action: { tabId, text: "searchZoomLinkInDom" } }
  ).catch(e => console.log('searchZoomLinkInDom err', e));

  if (zoomMatch || googleMeetMatch || teamsMatch) return url;
  if (zoomLink) return zoomLink;

  return null;
}

function matchTeamsUrl(url) {
  try {
    let meetingId = "";
    if (url.includes("meetup-join")) {
      let startIndex = url.lastIndexOf('/') + 1;
      let endIndex = url.indexOf('?');
      meetingId = url.substring(startIndex, endIndex);
    } else if (url.includes("/meet/") || url.includes("/meeting/")) {
      meetingId = url.includes("/meet/") ?
        url.split("/meet/")?.[1].split("/")[0].split("?")[0] :
        url.split("/meeting/")?.[1].split("/")[0].split("?")[0]
    }

    return meetingId;
  } catch (e) {
    console.log('failed to extract meeting Id', e);
  }
}

async function callNotetakerAPI(tabId, url) {
  let endpoint;
  if (url.includes('meet')) endpoint = `http://3.29.189.222:7000/join-meet`;
  if (url.includes('zoom')) endpoint = `http://3.29.189.222:8000/join-zoom`;
  if (url.includes('team')) endpoint = `http://3.29.189.222:9000/join-teams`;

  return fetch(endpoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetingUrl: url,
      uid: Date.now()
    })
  }).then(() => console.log('notetaker api response'))
  .catch(e =>{
    notetakerInit = false;
    console.log(e)
  });
}

function setMeeting(tabId){
  console.log("Tab id is:", tabId)
  console.log("Setting Meeting present Cookie")

  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + 2 * 60 * 60 * 1000);

  const cookieDetails = {
    name: `MeetingPresent_${tabId}`,
    value: "true",
    url: "https://meet.google.com",
    expirationDate: expirationDate.getTime() / 1000,
  };
  chrome.cookies.set(cookieDetails, function (cookie) {
    if(chrome.runtime.lastError){
      console.error("Error setting cookie:", chrome.runtime.lastError);
    }else {
      console.log("MeetingPresent cookie set with a 2-hour expiration.");
    }
  });
}

chrome.tabs.onUpdated.addListener(checkUserIdCookie);
chrome.tabs.onActivated.addListener(checkUserIdCookie);
