const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const config = require("./config.json");

client.colors = require("./servers.json");

let rainbow = 0;

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity(`r(help`, {type: "PLAYING"});


    client.setInterval(() =>{

        //adding this so it doesnt start doing weird stuff
        if(rainbow > 1) {
            rainbow = 0
        }else{
            rainbow += 0.01;
        }

        //try to change role color for every server
        for(let i in client.colors) {
            let guildId = client.colors[i].guild;
            let guild = client.guilds.get(guildId);
            let date = client.colors[i].date;


            //if 72 hours have passed, remove from config
            if(date < new Date().getTime() - 259200000) {
                 delete client.colors[i];
                 fs.writeFile("./servers.json", JSON.stringify(client.colors, null, 4), err => {
                    if(err) throw err;
                });
                return;
            }

            //if server gets deleted or bot gets kicked, remove from config
            if(guild === null) {
                delete client.colors[i];
                fs.writeFile("./servers.json", JSON.stringify(client.colors, null, 4), err => {
                    if(err) throw err;
                });
                return;
            }

            
            //try to change the role
            try{
                guild.roles.find("name", client.colors[i].role).setColor(hslToRgb(rainbow, 1, 0.5))
                .catch(err => { 
                    delete client.colors[i]
                    fs.writeFile("./servers.json", JSON.stringify(client.colors, null, 4), err => {
                        if(err) throw err;
                    });
                    return;
                });
            }catch(err){
                delete client.colors[i]
                fs.writeFile("./servers.json", JSON.stringify(client.colors, null, 4), err => {
                    if(err) throw err;
                });
                return;
            }
        }
        //Every 10 seconds change it
    }, 10 * 1000)
});

client.on("message", async message =>{


    //Does stuff and removes first 2 chars and shit
    let command = message.content.split(" ")[0].slice(2);
    let args = message.content.split(" ").slice(1);
    //let mention = message.guild.member(message.mentions.users.first());


    if(!message.content.startsWith("r(")) return;
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;


    if(command === "help") {
        const embed = new Discord.RichEmbed()
        .setTitle(":tools: Help")
        .setColor("RANDOM")
        .setDescription("Shows commands for the bot!")
        .addField(":bulb: General commands", 
        "**`r(rainbow`** - Taste the rainbow!\n" + 
        "**`r(ping`** - Why is the bot slow?\n" + 
        "**`r(stats`** - Bot's stats!")

        .addField(":skull: Bot's Owner Commands" ,
        "**`r(eval`** - Tasty code!\n" +
        "**`r(createInvite`** - Creates invites for servers!")
        message.channel.send({embed});

    }


    if(command === "stats") {
        var time = process.uptime();
        var uptime = (time + "").toHHMMSS();

        const embed = new Discord.RichEmbed()
        .setTitle(":tools: Stats")
        .setColor(0x009688)
        .setDescription( 
        ":crown: " +              "Servers: " + client.guilds.size + "\n" + 
        ":bust_in_silhouette: " + "Users: " + client.users.size + "\n" + 
        ":clock12: " +            "Uptime: " + uptime)
        message.channel.send({embed});
    }


    if(command === "ping") {
        const embed = new Discord.RichEmbed()
        .setTitle(":tools: Ping")
        .setColor(0x009688)
        .setDescription("Ping: `" + Math.round(client.ping) + "ms`")
        message.channel.send({embed});
    }

	
	if(command === "eval") {
        if(message.author.id !== config.ownerid) return;
        try{
            eval(args.join(" "));
        }catch(err){
            message.channel.send("srry left syntax in other pant")
        }
    }

    if(command === "createInvite") {
        //owner check
        if(message.author.id !== config.ownerid) return;

        //gets last word and removes last word, ik shit way but works since channels cant have spaces
        let channel = args.pop();

        //tries to get the invite
        try{
            client.guilds.find("name", args.join(" ")).channels.find("name", channel).createInvite().then(invite => message.channel.send("Invite: https://discord.gg/" + invite.code))
        }catch(err){
            message.channel.send("Something went wrong, Usage: server, channel")
        }
    }


    if(command === "rainbow") {
        if(!message.member.hasPermission("ADMINISTRATOR")) {
            const embed = new Discord.RichEmbed()
            .setAuthor("Rainbow", client.user.avatarURL)
            .setColor(0xF44336)
            .setDescription("You must have the administrator permission!")
            message.channel.send({embed});
            return;
        }

        if(!message.guild.me.hasPermission("ADMINISTRATOR")) {
            const embed = new Discord.RichEmbed()
            .setAuthor("Rainbow", client.user.avatarURL)
            .setColor(0xF44336)
            .setDescription("I must have the administrator permission!")
            message.channel.send({embed});
            return;
        }
		
		if(!message.member.guild.roles.find("name", args.join(" "))) {
            const embed = new Discord.RichEmbed()
            .setAuthor("Rainbow", client.user.avatarURL)
            .setColor(0xF44336)
            .setDescription("Usage: **`r(rainbow (role name)`**")
            message.channel.send({embed});
            return;
        }

        if(message.member.guild.roles.find("name", args.join(" ")) === null) {
            const embed = new Discord.RichEmbed()
            .setAuthor("Rainbow", client.user.avatarURL)
            .setColor(0xF44336)
            .setDescription("Something went wrong.")
            message.channel.send({embed});
            return;
        }


        if(message.member.guild.roles.find("name", args.join(" ")).position >= message.guild.me.highestRole.position) {
            const embed = new Discord.RichEmbed()
            .setAuthor("Rainbow", client.user.avatarURL)
            .setColor(0xF44336)
            .setDescription("My **RoleColor** role must be higher than the mentioned role!")
            message.channel.send({embed});
            return;
        }


        const embed = new Discord.RichEmbed()
        .setAuthor("Rainbow", client.user.avatarURL)
        .setColor(0x4CAF50)
        .setDescription("Successfully applied rainbow colors to **`" + args.join(" ") + "`**" + "\n" +
        "Note: this only lasts 72 hours, then it will stop. You can still apply it whenever you'd like!")
        message.channel.send({embed});

        client.colors[message.guild.name] = {
            guild: message.guild.id,
            role: args.join(" "),
            date: new Date().getTime()
        }

        fs.writeFile("./servers.json", JSON.stringify(client.colors, null, 4), err => {
            if(err) throw err;
        });
    }
});


//rgb junk copy pasted from stackoverflow since i was too lazy to code it myself
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

//uptime junk copy pasted from stackoverflow (ofc)
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

//login with this shitty code
client.login(procces_env.TOKEN);
