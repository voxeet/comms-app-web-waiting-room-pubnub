// const { json } = require("express/lib/response");

let videoContainer = document.querySelector("#video--container");

//Video Conferencing Button Elements

const startVideoBtn = document.getElementById("start-video-btn");

const startAudioBtn = document.getElementById("start-audio-btn");

const spanAudio = document.getElementById("span-audio");
const iAudio = document.getElementById("i-audio");

const spanVideo = document.getElementById("span-video");
const iVideo = document.getElementById("i-video");

const waitingroom_msg = document.getElementById("wr-msg");

const container_lobby = document.getElementById("container-lobby");

const container_media = document.getElementById("media");

//Host buttons

const hostJoinRoom = document.getElementById("join-doc");

const participantJoinRoom = document.getElementById("join-participant");

// Control buttons flags to manage hide/show

let leaveFlag = false;
let hideCameraFlag = true;
let muteAudioFlag = true;

//Variable to hold the current user/participant id
let currentParticipantID;
let listofParticipants = [];

let pubnub_subscribe_key;
let pubnub_publish_key;
let pubnub_presence_url;
let pubnub_channel;

let pubnub;

const dcHeros = [
  "Superman",
  "Aquaman",
  "Catwoman",
  "Flash",
  "Alfred",
  "Inspector Gordon",
  "Robin",
  "Jane",
  "Sarah",
  "Alice",
];

let externalID = dcHeros[Math.floor(Math.random() * dcHeros.length)];

waitingroom_msg.innerText = `${externalID}, you are now placed in our waiting room, we will be with you shortly`;

const admitUserToMeeting = async (conferenceID) => {
  try {
    globalUnsubscribe();

    container_lobby.remove();

    container_media.style.display = "initial";

    const conference = await VoxeetSDK.conference.fetch(conferenceID);

    let options = {
      leaveConferenceOnBeforeUnload: true,
      constraints: {
        audio: false,
        video: false,
      },
      simulcast: false,
      maxVideoForwarding: 16,
    };
    confObject = await VoxeetSDK.conference.join(conference, options);

    startVideoBtn.disabled = false;
    startAudioBtn.disabled = false;
  } catch (error) {
    console.log("admitUserToMeeting: " + error);
  }
};

const initializePubnub = async () => {
  try {
    const response = await fetch(`/pubnubValues`);
    const jsonResponse = await response.json();
    pubnub_subscribe_key = jsonResponse.pubnub_subscribe_key;
    pubnub_publish_key = jsonResponse.pubnub_publish_key;
    pubnub_channel = jsonResponse.pubnub_channel;
    pubnub_presence_url = jsonResponse.pubnub_presence_url;

    pubnub = new PubNub({
      subscribeKey: pubnub_subscribe_key,
      publishKey: pubnub_publish_key,
      uuid: externalID,
    });
    // Subscribe to the PubNub Channel
    pubnub.subscribe({
      channels: [pubnub_channel],
      withPresence: true,
    });

    pubnub.addListener(listener);
  } catch (error) {
    console.log("getpubnubValues: ", error);
  }
};
initializePubnub();

const handleStartAndStopAudio = () => {
  if (muteAudioFlag === true) {
    // Start sharing the Audio with the other participants
    VoxeetSDK.conference
      .startAudio(VoxeetSDK.session.participant)
      .then(() => {
        spanAudio.style.color = "red";
        iAudio.classList.remove("fa-microphone");
        iAudio.classList.add("fa-microphone-slash");

        muteAudioFlag = false;
      })
      .catch((err) => console.error(err));
  } else {
    VoxeetSDK.conference
      .stopAudio(VoxeetSDK.session.participant)
      .then(() => {
        spanAudio.style.color = "green";
        iAudio.classList.remove("fa-microphone-slash");
        iAudio.classList.add("fa-microphone");

        muteAudioFlag = true;
      })
      .catch((err) => console.error(err));
  }
};

//Function to handle video streams
const handleStartAndStopVideo = () => {
  if (hideCameraFlag === true) {
    // Start sharing the video with the other participants
    VoxeetSDK.conference
      .startVideo(VoxeetSDK.session.participant)
      .then(() => {
        spanVideo.style.color = "red";
        iVideo.classList.remove("fa-video");
        iVideo.classList.add("fa-video-slash");

        hideCameraFlag = false;
      })
      .catch((err) => console.error(err));
  } else {
    // Stop sharing the video with the other participants
    VoxeetSDK.conference
      .stopVideo(VoxeetSDK.session.participant)
      .then(() => {
        spanVideo.style.color = "green";
        iVideo.classList.remove("fa-video-slash");
        iVideo.classList.add("fa-video");

        hideCameraFlag = true;
      })
      .catch((err) => console.error(err));
  }
};

const addVideoNode = (participant, stream) => {
  videoContainer.style.display = "grid";
  let videoNode = document.getElementById("video-" + participant.id);
  // let videoTitle = document.createElement("p");
  if (!videoNode) {
    videoNode = document.createElement("video");
    videoNode.id = "video-" + participant.id;
    videoNode.height = 240;
    videoNode.width = 320;
    videoNode.playsinline = true;
    videoNode.muted = true;
    videoNode.autoplay = true;

    videoContainer.insertAdjacentElement("beforeend", videoNode);

    // videoTitle.id = "video--title--" + participant.id;
    // videoTitle.textContent = `${participant.info.name} (host)`;

    // videoContainer.insertAdjacentElement("beforeend", videoTitle);
  }
  navigator.attachMediaStream(videoNode, stream);
};

// Remove the video streem from the web page
const removeVideoNode = (participant) => {
  let videoNode = document.getElementById("video-" + participant.id);
  // let videoContainer = document.getElementById("video-div-" + participant.id);
  if (videoNode) {
    videoNode.srcObject = null; // Prevent memory leak in Chrome
    // videoNode.parentNode.removeChild(videoNode);
    videoNode.remove();
  }
};

UniqueID = PubNub.generateUUID();

let userList = [];

listener = {
  status(response) {
    try {
      if (response.category === "PNConnectedCategory") {
        pubnub.hereNow({
          channels: [pubnub_channel],
          includeUUIDs: true,
          includeState: true,
        });
      }
    } catch (error) {
      console.log("listener response: " + error);
    }
  },
  message(response) {
    if (externalID === response.userMetadata.uuid) {
      let msg = response.message; // The Payload
      let publisher = response.publisher; //The Publisher
      waitingroom_msg.innerText = msg;
    }
  },
};

const hereNow = (channel) => {
  pubnub.hereNow(
    {
      channels: channel,
      includeUUIDs: true,
      includeState: true,
    },
    function (status, response) {
      if (response != null) {
        for (i = 0; i < response.totalOccupancy; i++) {
          userList[i] = response.channels.waitingroom.occupants[i].uuid;
        }
        console.log("hereNow UUIDs: ", userList);
      }
    }
  );
};
// If person leaves or refreshes the window, run the unsubscribe function
onbeforeunload = function () {
  globalUnsubscribe();
  $.ajax({
    // Query to server to unsub sync
    async: false,
    method: "GET",
    url: pubnub_presence_url + encodeURIComponent(UniqueID),
  })
    .done(function (jqXHR, textStatus) {
      console.log("Request done: " + textStatus);
    })
    .fail(function (jqXHR, textStatus) {
      console.log("Request failed: " + textStatus);
    });
  return null;
};
// Unsubscribe people from PubNub network
const globalUnsubscribe = () => {
  try {
    pubnub.unsubscribe({
      channels: [pubnub_channel],
    });
    pubnub.removeListener(listener);
  } catch (err) {
    console.log("Failed to UnSub");
  }
};

const InitializeAndOpenSession = async () => {
  let accessToken;

  try {
    const response = await fetch(`/client-access-token/${externalID}`);
    const jsonResponse = await response.json();
    accessToken = jsonResponse.accessToken;
  } catch (error) {
    console.log("InitializeAndOpenSession: ", error);
  }

  VoxeetSDK.initializeToken(accessToken, async () => {
    const r = await fetch(`/client-access-token/${externalID}`);
    const jResp = await r.json();
    return jResp.accessToken;
  });

  try {
    await VoxeetSDK.session.open({
      name: externalID,
      externalId: externalID,
    });
    console.log("Session opened for " + externalID);
  } catch (error) {
    console.log("====================================");
    console.log(`Something went wrong ${error}`);
    console.log("====================================");
  }
};
InitializeAndOpenSession();
