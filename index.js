// "use strict";

require('dotenv').config();



//Api data
var rawApiData = null;
var playerCount = 0;
var activePlayersArray = Array();
var serverStatus = null;
var mcVer = null;
var modpack = "FTB Presents Direwolf20 1.12 (2.5.0)"
var hostname = null;

// console.log("test");

//Config
var delay = 120000;



const Discord = require('discord.js');
const client = new Discord.Client();
var Request = require("request");

client.on('ready', () => {
    PrintToConsle("Logged in as " + client.user.tag);
    FetchApiData();
})

client.on('message', msg => {
    let msgContent = null;

    if (msg.content.startsWith("/MC")) {
        //Prints the request to console for debugging         
        PrintToConsle(msg.author.username + ": " + msg.content);

        switch (msg.content.toLowerCase()) {
            case "/mc status":

                if (serverStatus) {
                    msgContent = "Server is online, " + playerCount + " players are logged on.";
                }
                else {
                    msgContent = "Server offline";
                }

                RespondToDiscord(msg, msgContent);
                break;

            case "/mc players":
                msgContent = "Players on server: " + activePlayersArray.join(", ");
                RespondToDiscord(msg, msgContent);
                break;

            case "/mc ver":
                msgContent = "Minecraft " + mcVer + "\n";
                msgContent += modpack;
                RespondToDiscord(msg, msgContent);
                break;

            case "/mc server":
                msgContent = hostname;
                msgContent += " (" + ip +")";
                RespondToDiscord(msg, msgContent);
                break;

            default:
                msgContent = "Unkown command";
                RespondToDiscord(msg, msgContent);
                break;
        }
    }
});


client.login(process.env.BOT_TOKEN);

function RespondToDiscord(msg, msgContent) {
    PrintToConsle(msgContent);
    try {
        msg.reply(msgContent);
    }
    catch(error) {
        PrintToConsle(error);
    }
}

function FetchApiData() {
    PrintToConsle("Fetching data from API");

    Request.get("https://api.mcsrvstat.us/2/minecraft.spelaroll.eu", (error, response, body) => {
        if (error) {
            return PrintToConsle(error);
        }


        let data = JSON.parse(body)
        CheckForNewPlayers(data);
        ParseAndCacheApiData(JSON.parse(body));

    });

    setTimeout(FetchApiData, delay)
}

function PrintToConsle($msg) {
    let parseMsg = new Date().toLocaleTimeString();
    parseMsg += ": " + $msg;
    console.log(parseMsg);
}

function ParseAndCacheApiData(data) {
    playerCount = data.players.online;

    activePlayersArray = data.players.list || new Array();
    activePlayersArray.sort();

    serverStatus = data.online;
    mcVer = data.version;
    hostname = data.hostname;
    ip = data.ip + ":" + data.port;

    rawAPIdata = data;
}

function CheckForNewPlayers(data) {
    let newPlayers = {};
    newPlayers = ArrayDiff(data.players.list, activePlayersArray);
    if(newPlayers.length > 0) {
        msgContent = newPlayers.join(", ")+ " came online";
        SendNewMessegeToDiscord(msgContent);
    }
}

function SendNewMessegeToDiscord(msgContent) {
    try {
    let channelName = "mcbot";
    PrintToConsle(msgContent);

    PrintToConsle("Sending messege to server");
    let channel = client.channels.find('name',channelName);
    channel.send(msgContent);
    }
    catch(error) {
        console.error(error);
    }
}

function ArrayDiff(newArray, oldArray) {
    if(!newArray) { return new Array(); }

    let newPlayers = new Array();

    newArray.forEach(element => {
        if (!oldArray.includes(element)) {
            newPlayers.push(element);
        }
    });

    return newPlayers;
}