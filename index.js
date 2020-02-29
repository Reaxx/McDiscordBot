// "use strict";

require('dotenv').config();
const Player = require("./player.js");


//Api data
var rawApiData = null;
var playerCount = 0;
var activePlayerNamesArray = Array();
var serverStatus = null;
var mcVer = null;
var modpack = "FTB Presents Direwolf20 1.12 (2.5.0)" //Havn
var hostname = null;
var PlayersArray = Array();

// console.log("test");

//Config
var delay = 120000; //Timeout for pinging the Minecraft server API, the API has a update time of 2mins


const Discord = require('discord.js');
const client = new Discord.Client();
var Request = require("request");

client.on('ready', () => {
    PrintToConsle("Logged in as " + client.user.tag);
    SendNewMessegeToDiscord("Discord Minecraft Bot is now running.");
    FetchApiData();
})

client.on('message', msg => {
    let msgContent = null;

    if (msg.content.startsWith("/MC") || msg.content.startsWith("/mc")) {
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
                msgContent = "Players on server: " + activePlayerNamesArray.join(", ");
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
                msgContent = "Unkown command. Avalible commands: \n";
                msgContent += "/MC status\n";
                msgContent += "/MC players\n";
                msgContent += "/MC ver\n"; 
                msgContent += "/MC server";
                RespondToDiscord(msg, msgContent);
                break;
        }
    }
});


client.login(process.env.BOT_TOKEN);

function RespondToDiscord(msg, msgContent) {
    try {
        msg.reply(msgContent);
        PrintToConsle("Sending response to Discord: " +msgContent);
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

        ParseAndCacheApiData(JSON.parse(body));
        CheckPlayerStatus();
        CheckForNewPlayers();

    });

    setTimeout(FetchApiData, delay)
}

function PrintToConsle($msg) {
    let parseMsg = new Date().toLocaleTimeString();
    parseMsg += ": " + $msg;
    console.log(parseMsg);
}
/**
 * Parses the API data
 *
 * @param {*} data Raw data from the Minecraft API
 */
function ParseAndCacheApiData(data) {
    playerCount = data.players.online;

    activePlayerNamesArray = data.players.list || new Array();
    activePlayerNamesArray.sort();

    serverStatus = data.online;
    mcVer = data.version;
    hostname = data.hostname;
    ip = data.ip + ":" + data.port;

    rawAPIdata = data;
}

function CheckForNewPlayers() {
    PrintToConsle("Checking for new players");

    activePlayerNamesArray.forEach(playerName => {
        let player = PlayersArray.find( x=> x.Name == playerName);

        //If player not in list, creates object.
        if(!player) {
            var p = new Player(playerName);
            PlayersArray.push(p);
         
            //Sends messege to log and discord
            msgContent = p.Name + " came online";
            SendNewMessegeToDiscord(msgContent);
            PrintToConsle(playerName + "-object created");
        }      
        //If player logged out, logins in.
        else if (!player.IsLoggedIn) {
            player.LogIn();

            //If player has been offline for for time set in .env, sends message to discord
            if(player.MinutesSinceLastLogin() >= process.env.LOGIN_ANNOUNCMENT_SUP_TIMER)
            {
                SmsgContent = player.Name + " came online";
                SendNewMessegeToDiscord(msgContent);
            }
            else {
                PrintToConsle(playerName + "logged in. Time between logins to short (" + player.MinutesSinceLastLogin() + "), messege not sent to discord.");
            }
            
        }
    });

}

function CheckPlayerStatus() {
    PrintToConsle("Checking player statuses");

    PlayersArray.forEach(player => {
        //If player already marked as logged out, ignore.
        if(!player.IsLoggedIn) { return; };

        let activePlayer = activePlayerNamesArray.find(x => x == player.Name)

        //Checks if is still in list, otherwise loggs out.
        if (!activePlayer)
        {
            player.LogOut();
            PrintToConsle("Logged out "+ player.Name + " (" + player.MinutesLogedIn() + "m)");
        }       
        else {
            PrintToConsle(player.Name+" is still active (" + player.MinutesLogedIn() +"m)");
        }

    });
}

    //Sends a message to the Discord-Channel, as default reads the .env file.
function SendNewMessegeToDiscord(msgContent,channelName = process.env.DEFAULT_CHANNEL) {
    try {
    PrintToConsle("Sending messege to Discord: " +msgContent);
    let channel = client.channels.find('name',channelName);
    // channel.send(msgContent);
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