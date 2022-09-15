/* Event handlers */

// When a stream is added to the conference
VoxeetSDK.conference.on("streamAdded", (participant, stream) => {
  if (stream.getVideoTracks().length) {
    // Only add the video node if there is a video track
    addVideoNode(participant, stream);
  }

  // addParticipantNode(participant);
});

// When a stream is updated
VoxeetSDK.conference.on("streamUpdated", (participant, stream) => {
  if (stream.getVideoTracks().length) {
    // Only add the video node if there is a video track
    addVideoNode(participant, stream);
  } else {
    removeVideoNode(participant);
  }
});

// When a stream is removed from the conference
VoxeetSDK.conference.on("streamRemoved", (participant, stream) => {
  removeVideoNode(participant);
  // removeParticipantNode(participant);
});

VoxeetSDK.conference.on("participantUpdated", (participant) => {
  // console.log(participant, "participantUpdated");
  console.log("PU");
});

VoxeetSDK.conference.on("participantAdded", (participant) => {
  // console.log(participant, "participantaddedevent");
  console.log(participant.info.name);
});

VoxeetSDK.conference.on("left", () => {
  // console.log("Left event fired");
});

VoxeetSDK.conference.on("joined", () => {
  console.log("Joined");
});

VoxeetSDK.notification.on("invitation", (e) => {
  console.log("invitation event");
  console.log(e.conferenceId);
  admitUsertoMeeting(e.conferenceId);
});
