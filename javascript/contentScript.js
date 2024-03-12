console.log("Content script is running.");

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  console.log('message received', message.action);

  if (message.action.text === 'searchZoomLinkInDom') {
    console.log('searching DOM for zoom link...');
    const meetingUrl = fetchZoomLink();
    sendResponse(meetingUrl);
  }

  if (message.action.text === 'getMeetParticipantsList') {
    const participants = getParticipantsFromMeet();
    console.log('meet participants:', participants);
    sendResponse(participants);
  }

  if (message.action.text === 'getTeamsParticipantsList') {
    const participants = getParticipantsFromTeams();
    console.log('teams participants:', participants);
    sendResponse(participants);
  }

  if (message.action.text === 'getZoomParticipantsList') {
    const participants = getParticipantsFromZoom();
    console.log('zoom participants:', participants);
    sendResponse(participants);
  }
});

function fetchZoomLink() {
  if (window.location.href.includes("zoom.us")) {
    const frame = document.querySelector('iframe');
    const inviteEmail = frame?.contentDocument?.querySelector('#invite_email')?.innerText;

    if (inviteEmail) {
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = inviteEmail.match(urlRegex);

      if (urls) {
        const zoomMeetingLinks = urls.filter(url => url.includes("zoom.us/j/"));
        if (zoomMeetingLinks.length > 0) {
          return zoomMeetingLinks[0];
        } else {
          console.log("No Zoom Meeting Links found in the input string.");
        }
      } else {
        console.log("No URLs found in the input string.");
      }
    }
  }
}

function getParticipantsFromMeet() {
  return [...document.querySelectorAll('.adnwBd')].map(el => el.innerText?.split('\n')[0]);
}

function getParticipantsFromZoom() {
  const frame = document.querySelector('iframe');
  return [...frame.contentDocument.querySelectorAll('[role="none"]')].map(el => el.innerText);
}

function getParticipantsFromTeams() {
  return [...document.querySelectorAll('span.lpcCommonWeb-hoverTarget')].map(el => el.innerText);
}