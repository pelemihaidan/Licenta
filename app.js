const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const request = require("request");
const WebSocket = require("ws");

const app = express();

// Port Number
const port = process.env.PORT || 8080;

// Cors Middleware
app.use(cors());

// Body Parser Middleware
app.use(bodyParser.json());

// Set Static Folder
app.use(express.static(path.join(__dirname, "public")));

let symbolList = {};
let calendarData = {};
let newsData = {};

connect("calendar");
function connect(p) {
  let ws = new WebSocket("wss://ws.xapi.pro/demo");
  // Connection to WebSocket
  ws.on("open", () => {
    console.log("Connected to XAPI Web Socket");
    login();
  });
  ws.on("message", event => {
    try {
      var response = JSON.parse(event);
      if (response.status == true) {
        if (response.streamSessionId != undefined) {
          // We received login response
          if (p === "calendar") {
            getCalendar();
          } else if (p === "news") {
            getNews();
          }
        } else {
          if (p === "calendar") {
            calendarData = event;
            disconnect();
            connect("news");
          } else if (p === "news") {
            newsData = event;
            disconnect();
            setTimeout(function() {
              console.log("Reconnecting...");
              connect("calendar");
            }, 600000);
          }
        }
      } else {
        alert("Error: " + response.errorDescr);
      }
    } catch (Exception) {
      alert("Fatal error while receiving data! :(");
    }
  });

  ws.on("close", () => {
    console.log("Connection closed");
  });
  function disconnect() {
    ws.close();
  }
  function send(jsonMessage) {
    try {
      let msg = JSON.stringify(jsonMessage);
      ws.send(msg);
      console.log("Sent " + msg.length + " bytes of data: " + msg);
    } catch (Exception) {
      console.error("Error while sending data: " + Exception.message);
    }
  }
  function login() {
    let msg = {};
    msg.command = "login";
    let arguments = {
        userId : 10456169,
        password : ""
    };
    msg.arguments = arguments;
    console.log("Trying to log in as: " + msg.arguments.userId);
    send(msg);
  }
  function getCalendar() {
    let msg = {};
    msg.command = "getCalendar";
    console.log("Getting Calendar");
    send(msg);
  }

  function getNews() {
    let msg = {};
    msg.command = "getNews";
    let arguments = {};
    arguments.end = 0;
    arguments.start = 1526245794889;
    msg.arguments = arguments;
    console.log("Getting News");
    send(msg);
  }
}




let options = {
  url:
    "https://api-fxpractice.oanda.com/v3/accounts/101-004-8316086-001/instruments",
  auth: {
    bearer: ""
  }
};

app.get("/list", (req, res) => {
  options.url ="https://api-fxpractice.oanda.com/v3/accounts/101-004-8316086-001/instruments";
  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      symbolList = JSON.parse(body);
      res.send(symbolList);
    }
  });
});
// Chart Route
app.get("/chart", (req, res) => {
  let symbol = req.query.symbol;
  let granularity = req.query.granularity;
  let from = req.query.from;
  if (from !== " ") {
    options.url = `https://api-fxpractice.oanda.com/v3/instruments/${symbol}/candles?count=500&price=M&from=${from}&granularity=${granularity}`;
  } else {
    options.url = `https://api-fxpractice.oanda.com/v3/instruments/${symbol}/candles?count=500&price=M&granularity=${granularity}`;
  }
  request(options, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      let info = JSON.parse(body);
      res.send(info);
    }
  });
});
// Calendar Route
app.get("/calendar", (req, res) => {
  res.send(calendarData);
});
// News Route
app.get("/news", (req, res) => {
  res.send(newsData);
});

// Start Server
app.listen(port, () => {
  console.log("server started on port : " + port);
});
