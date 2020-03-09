// "use strict";

require('dotenv').config();
const Player = require("./player.js");


//Api data
var RawApiData = null;
var PlayerCount = 0;
var ActivePlayerNamesArray = Array();
var ServerStatus = null;
var McVer = null;
var Modpack = "FTB Presents Direwolf20 1.12 (2.5.0)" //Havn
var Hostname = null;
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

                if (ServerStatus) {
                    msgContent = "Server is online, " + PlayerCount + " players are logged on.";
                }
                else {
                    msgContent = "Server offline";
                }

                RespondToDiscord(msg, msgContent);
                break;

            case "/mc players":
                msgContent = "Players on server: \n" + ParseOnlinePlayers();
                RespondToDiscord(msg, msgContent);
                break;

            case "/mc ver":
                msgContent = "Minecraft " + McVer + "\n";
                msgContent += Modpack;
                RespondToDiscord(msg, msgContent);
                break;

            case "/mc server":
                msgContent = Hostname;
                msgContent += " (" + ip +")";
                RespondToDiscord(msg, msgContent);
                break;

            case "/mc api":
                msgContent = process.env.API_URL;
                RespondToDiscord(msg, msgContent);
               break;
    

            default:
                msgContent = "Unkown command. Avalible commands: \n";
                msgContent += "/MC status\n";
                msgContent += "/MC players\n";
                msgContent += "/MC ver\n"; 
                msgContent += "/MC server\n";
                msgContent += "/MC api";
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

    Request.get(process.env.API_URL, (error, response, body) => {
        if (error) {
            return PrintToConsle(error);
        }


        let data = JSON.parse(body)

        ParseAndCacheApiData(data);

        //IF server is offline, don't bother with checking players.
        if(!ServerStatus) {return; }

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
    //If data from API failed, return
    if(!data) { return; }

    PlayerCount = 0;
    ActivePlayerNamesArray = new Array();

    if(data.players) {
        PlayerCount = data.players.online;
        ActivePlayerNamesArray = data.players.list || new Array();
        ActivePlayerNamesArray.sort();
    }
    else {
        PlayerCount = 0;
        ActivePlayerNamesArray = Array();
        PrintToConsle("Server is offline");
    }

    ServerStatus = data.online;
    McVer = data.version;
    Hostname = data.hostname;
    ip = data.ip + ":" + data.port;

    rawAPIdata = data;
}

function CheckForNewPlayers() {
    PrintToConsle("Checking for new players");

    ActivePlayerNamesArray.forEach(playerName => {
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

function ParseOnlinePlayers() {
    // var output; 
    // PlayersArray.forEach(player => {
    //     output += player.Name + " (" + player.MinutesLogedIn() + "min)\n";    
    // });

    let tmpActivePlayers = Array();

    PlayersArray.forEach(player => {
        if(player.IsLoggedIn) {
            tmpActivePlayers.push(player);
        }
    });

    tmpActivePlayers.sort;

    let output = tmpActivePlayers.join(",");
    if(!output) { return "-"; }

    return output;
}

function CheckPlayerStatus() {
    PrintToConsle("Checking player statuses");

    PlayersArray.forEach(player => {
        //If player already marked as logged out, ignore.
        if(!player.IsLoggedIn) { return; };

        let activePlayer = ActivePlayerNamesArray.find(x => x == player.Name)

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