document.addEventListener('DOMContentLoaded', () => {
    const meetingUrlInput = document.getElementById('meetingUrlInput');
    const submitUrlBtn = document.getElementById('submitUrlBtn');

    meetingUrlInput.addEventListener('keydown', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();

            const meetingUrl = meetingUrlInput.value;
            const isMeetingUrl = matchMeetingUrl(meetingUrl);

            if (isMeetingUrl) {
                meetingUrlInput.value = '';
                console.log('calling notetaker...');

                callNotetakerAPI(meetingUrl).then(async () => {
                    await setMeeting()
                    window.location.href = '../views/loading.html';
                }).catch(e => console.log(e));
            }
        }
    });

    submitUrlBtn.addEventListener('click', function (event) {
        event.preventDefault();
        const meetingUrl = meetingUrlInput.value;
        const isMeetingUrl = matchMeetingUrl(meetingUrl);

        if (isMeetingUrl) {
            meetingUrlInput.value = '';
            console.log('calling notetaker...');

            callNotetakerAPI(meetingUrl).then(async () => {
                await setMeeting()
                window.location.href = '../views/loading.html';
            }).catch(e => console.log(e));
        }
    });
});

function matchMeetingUrl(url) {
    const zoomMatch = url.match(/\/j\/(\d+)\?/);
    const googleMeetMatch = url.match(/https:\/\/meet\.google\.com\/([a-z0-9-]+)/i);
    const teamsMatch = matchTeamsUrl(url);

    return zoomMatch || googleMeetMatch || teamsMatch;
}

function matchTeamsUrl(url) {
    try {
        let meetingId = "";
        if (url.includes("meeting_")) {
            meetingId = url.split("meeting_")[1].split("/")[0]
            meetingId = decodeURIComponent(meetingId);
            meetingId = meetingId.replace("@thread.v2", "");
        } else if (url.includes("meetup-join")) {
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
        console.log(e);
    }
}

async function callNotetakerAPI(meetingUrl) {
    let endpoint;
    if (meetingUrl.includes('meet')) endpoint = `http://3.29.189.222:7000/join-meet`;
    if (meetingUrl.includes('zoom')) endpoint = `http://3.29.189.222:8000/join-zoom`;
    if (meetingUrl.includes('team')) endpoint = `http://3.29.189.222:9000/join-teams`;

    return fetch(endpoint, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            meetingUrl: meetingUrl,
            uid: Date.now()
        })
    });
}

async function setMeeting(){
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Tabs are",tabs)
    let tabId = (tabs && tabs[0]) ? tabs[0]?.id : null
    console.log("Tab id is ", tabId)

    if(tabId){
        const meetingPresentCookieDetails = {
            name: `MeetingPresent_${tabId}`,
            url: "https://meet.google.com"
        };

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
}
