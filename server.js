const dotenv = require("dotenv");
const http = require("http");
const express = require("express");
const path = require("path");
const dolbyio = require("@dolbyio/dolbyio-rest-apis-client");

const app = express();

dotenv.config();

const APP_KEY = process.env.DOLBY_IO_KEY;
const APP_SECRET = process.env.DOLBY_IO_SECRET;

const PUBNUB_SUBSCRIBE_KEY = process.env.PUBNUB_SUBSCRIBE_KEY;
const PUBNUB_PUBLISH_KEY = process.env.PUBNUB_PUBLISH_KEY;

const PUBNUB_CHANNEL = process.env.PUBNUB_CHANNEL;
const PUBNUB_PRESENCE_URL = process.env.PUBNUB_PRESENCE_URL;

const hostPath = path.join(__dirname, "./public/host.html");
app.use("/host", express.static(hostPath));

const participantPath = path.join(__dirname, "./public/participant.html");
app.use("/participant", express.static(participantPath));

// serving static files
app.use(express.static(path.join(__dirname, "public")));

// prettier-ignore
app.get("/clientAccessToken", async function (request, response) {
  const apiToken = await dolbyio.authentication.getApiAccessToken(
    APP_KEY,
    APP_SECRET,
    600,
    ['comms:client_access_token:create']
  );

  const clientAccessToken = await dolbyio.communications.authentication.getClientAccessTokenV2({
    accessToken: apiToken,
    sessionScope: ['*'],
  });

  response.send({
    accessToken: clientAccessToken.access_token,
  });
});

app.get("/pubnubValues", async function (request, response) {
  response.send({
    pubnub_subscribe_key: PUBNUB_SUBSCRIBE_KEY,
    pubnub_publish_key: PUBNUB_PUBLISH_KEY,
    pubnub_channel: PUBNUB_CHANNEL,
    pubnub_presence_url: PUBNUB_PRESENCE_URL,
  });
});

http.createServer(app).listen(5501, () => {
  console.log("express server listening on port 5501");
});
