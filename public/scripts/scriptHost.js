let videoContainer = document.querySelector("#video--container");

//Video Conferencing Button Elements

const startVideoBtn = document.getElementById("start-video-btn");

const startAudioBtn = document.getElementById("start-audio-btn");

const spanAudio = document.getElementById("span-audio");
const iAudio = document.getElementById("i-audio");

const spanVideo = document.getElementById("span-video");
const iVideo = document.getElementById("i-video");

const container_lobby = document.getElementById("container-lobby");

const container_media = document.getElementById("media");

const container_listGroup = document.getElementById("usersonWaitList");

const container_control = document.getElementById("vc--controlcontainer");

let conferenceAliasInput = "";

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

const handleLeave = async () => {
  VoxeetSDK.conference.leave();

  startVideoBtn.disabled = true;
  startAudioBtn.disabled = true;

  container_control.style.display = "none";
  console.log("Left conference");

  initializePubnub();
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
    console.log("initializePubnub: ", error);
  }
};
initializePubnub();

const InviteParticipanttotheMeeting = async (participantName) => {
  globalUnsubscribe();
  participantUser = participantName.name;
  var participants = [{ id: "", externalId: participantUser, avatarUrl: "" }];
  conferenceAliasInput = `${externalID} and ${participantUser}'s meeting`;
  CreateandJoinConference(conferenceAliasInput);
  await sleep(1000);
  container_control.style.display = "initial";
  try {
    let conference = VoxeetSDK.conference.current;
    VoxeetSDK.notification.invite(conference, participants);
  } catch (error) {
    console.log("InviteParticipanttotheMeeting: " + error);
  }

  htmlParentElement = document.getElementById(participantUser);

  htmlParentElement.remove();
};

const SendMessagetoParticipant = async (participantName) => {
  participantName = participantName.name;
  notificationMessage = `Hello ${participantName}, Dr.Sree here! I am currently attending another patient, I will be with you shortly.`;
  pubnub.publish(
    {
      channel: pubnub_channel,
      message: notificationMessage,
      meta: {
        uuid: participantName,
      },
    },
    function (status, response) {
      console.log(status, response);
    }
  );
};

const CreateandJoinConference = async (conferenceAliasInput) => {
  try {
    let conferenceParams = {
      liveRecording: false,
      rtcpMode: "average", // worst, average, max
      ttl: 0,
      videoCodec: "H264", // H264, VP8
      dolbyVoice: true,
    };

    let conferenceOptions = {
      alias: conferenceAliasInput,
      params: conferenceParams,
    };

    let confObject = await VoxeetSDK.conference.create(conferenceOptions);
    const joinOptions = {
      constraints: {
        audio: false,
        video: false,
      },
      simulcast: false,
    };
    confObject = await VoxeetSDK.conference.join(confObject, joinOptions);
  } catch (error) {
    console.log("CreateandJoinConference: " + error);
  }

  leaveFlag = true;

  startVideoBtn.disabled = false;
  startAudioBtn.disabled = false;
  console.log("Joined Conference");
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const handleStartandStopAudio = () => {
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
const handleStartandStopVideo = () => {
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

const externalID = "HOST";

UniqueID = PubNub.generateUUID();

let userList = [];

listener = {
  status(response) {
    try {
      if (response.category === "PNConnectedCategory") {
        hereNow(response.affectedChannels);
      }
    } catch (error) {
      console.log(" listener response" + error);
    }
  },
  message(response) {},
  presence(response) {
    if (response.action === "join") {
      for (i = 0; i < response.occupancy; i++) {
        if (response.uuid !== undefined) {
          let uuidVCJoin = userList.indexOf(response.uuid);
          if (uuidVCJoin === -1) {
            userList[userList.length] = response.uuid;
            console.log("Insert ", response.uuid, "in array");
          } else {
            console.log("UUID: ", response.uuid, "is already in the array");
          }
        }
      }
    }
    if (response.action === "interval") {
      if (response.join !== undefined) {
        for (i = 0; i < response.occupancy; i++) {
          if (response.join[i] !== undefined) {
            var uuidVCIntervalJoin = userList.indexOf(response.join[i]);
            if (uuidVCIntervalJoin === -1) {
              console.log("Interval Add UUID: ", uuidVCIntervalJoin);
              userList[userList.length] = response.join[i];
            }
          }
        }
      }
      if (response.leave !== undefined) {
        for (i = 0; i < response.occupancy; i++) {
          let uuidVCIntervalLeave = userList.indexOf(response.leave[i]);
          if (uuidVCIntervalLeave > -1) {
            console.log("REMOVE USER FROM ARRAY", uuidVCIntervalLeave);
            userList.splice(uuidVCIntervalLeave, 1);
            if (response.uuid !== externalID) {
              removeUserfromWaitingList(response.uuid);
            }
          }
        }
      }
    }
    if (response.action === "leave") {
      for (i = 0; i < response.occupancy; i++) {
        let uuidVCLeave = userList.indexOf(response.uuid);
        if (uuidVCLeave > -1) {
          console.log(
            "REMOVE USER FROM ARRAY",
            uuidVCLeave,
            "with UUID: ",
            response.uuid
          );
          userList.splice(uuidVCLeave, 1);
          if (response.uuid !== externalID) {
            removeUserfromWaitingList(response.uuid);
          }
        }
      }
    }
    userList.forEach((user) => {
      if (user != externalID) {
        addUsertoWaitingList(user);
      }
    });
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
          try {
            let user = response.channels[pubnub_channel].occupants[i].uuid;
            userList[i] = user;
            if (user !== externalID) {
              addUsertoWaitingList(user);
            }
          } catch (error) {
            console.log(error);
          }
        }
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
globalUnsubscribe = function () {
  try {
    pubnub.unsubscribe({
      channels: [pubnub_channel],
    });
    pubnub.removeListener(listener);
  } catch (err) {
    console.log("Failed to UnSub");
  }
};

const removeUserfromWaitingList = (user) => {
  const buttonElement = document.getElementById(user);
  buttonElement.remove();
};

const addUsertoWaitingList = (user) => {
  const checkIdExists = document.getElementById(user);
  if (!checkIdExists) {
    try {
      let card = document.createElement("div");
      card.id = user;
      card.className = "card bg-dark mb-2";

      let cardBody = document.createElement("div");
      cardBody.className = "card-body";

      let headingH5 = document.createElement("h5");
      headingH5.className = "card-title text-white";
      headingH5.innerText = user;

      let btnGroup = document.createElement("div");
      btnGroup.className = "btn-group";
      btnGroup.role = "group";

      const notifyUserBtn = document.createElement("button");
      notifyUserBtn.setAttribute("type", "button");
      notifyUserBtn.setAttribute("class", "btn btn-success m-1 ");
      notifyUserBtn.setAttribute("name", user);
      notifyUserBtn.setAttribute("onclick", "SendMessagetoParticipant(this)");
      notifyUserBtn.value = "Notify";
      notifyUserBtn.innerHTML = "Notify";
      btnGroup.appendChild(notifyUserBtn);

      const useronWaitbutton = document.createElement("button");
      useronWaitbutton.setAttribute("type", "button");
      useronWaitbutton.setAttribute("class", "btn btn-secondary m-1 ");
      useronWaitbutton.setAttribute("name", user);
      useronWaitbutton.setAttribute(
        "onclick",
        "InviteParticipanttotheMeeting(this)"
      );
      useronWaitbutton.innerHTML = "Invite";

      btnGroup.appendChild(useronWaitbutton);

      cardBody.appendChild(headingH5);
      cardBody.appendChild(btnGroup);

      card.appendChild(cardBody);
      container_listGroup.appendChild(card);
    } catch (error) {
      console.log("addUsertoWaitingList: " + error);
    }
  }
};

const IntializeandOpenSession = async () => {
  VoxeetSDK.conference;
  let accessToken;

  try {
    const response = await fetch(`/clientAccessToken`);
    const jsonResponse = await response.json();
    accessToken = jsonResponse.accessToken;
  } catch (error) {
    console.log("IntializeandOpenSession: ", error);
  }

  VoxeetSDK.initializeToken(accessToken);
  // const consumerKey = "f3_ZOFG3b1w5s13CbjwELQ==";
  // const consumerSecret = "6mNXCuJzAYAAEa9h5ev_nhuK6EbOlU3VBIfWNKyBReo=";
  // VoxeetSDK.initialize(consumerKey, consumerSecret);
  try {
    await VoxeetSDK.session.open({ name: "Host" });
    console.log("Host session");
  } catch (error) {
    console.log("====================================");
    console.log(`Something went wrong ${error}`);
    // console.log("====================================");
  }
};
IntializeandOpenSession();
