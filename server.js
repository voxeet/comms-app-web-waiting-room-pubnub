require("dotenv").config();
const http = require("http");
const https = require("https");
const express = require("express");
const path = require("path");
const app = express();
const sdk = require("api")("@communications-apis/v1.4.8#28116l58gqqs5");
const dolbyio = require("@dolbyio/dolbyio-rest-apis-client");

http.createServer(app).listen(5501, () => {
  console.log("express server listening on port 5501");
});

const hostPath = path.join(__dirname, "./public/host.html");
app.use("/host", express.static(hostPath));

const participantPath = path.join(__dirname, "./public/participant.html");
app.use("/participant", express.static(participantPath));

// serving up some fierce CSS lewks
app.use(express.static(path.join(__dirname, "public")));

const requestURL = "https://session.voxeet.com/v1/oauth2/token";

client_key = process.env.DOLBY_IO_KEY;
client_secret = process.env.DOLBY_IO_SECRET;

pubnub_subscribe_key = process.env.PUBNUB_SUBSCRIBE_KEY;
pubnub_publish_key = process.env.PUBNUB_PUBLISH_KEY;

pubnub_channel = process.env.PUBNUB_CHANNEL;
pubnub_presence_url = process.env.PUBNUB_PRESENCE_URL;

let auth =
  "Basic " + Buffer.from(client_key + ":" + client_secret).toString("base64");

const data = JSON.stringify({
  grant_type: "client_credentials",
  expires_in: "60000",
});

// prettier-ignore
app.get("/clientAccessToken", async function (request,response) {

  const APP_KEY = client_key;
  const APP_SECRET = client_secret;

  const jwt = await dolbyio.communications.authentication.getClientAccessToken(APP_KEY, APP_SECRET);
  response.send({
    accessToken: jwt.access_token,
  });

});

app.get("/pubnubValues", async function (request, response) {
  response.send({
    pubnub_subscribe_key: pubnub_subscribe_key,
    pubnub_publish_key: pubnub_publish_key,
    pubnub_channel: pubnub_channel,
    pubnub_presence_url: pubnub_presence_url,
  });
});
