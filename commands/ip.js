const { default: axios } = require("axios");
const { MessageEmbed } = require("discord.js");

exports.run = async (client, message, args) => {
  const user = message.mentions.users.first();

  if (!user) {
    return message.channel.send("You need to mention someone to doxx them.");
  } else if (user.id === client.user.id) {
    return message.channel.send("You can't doxx me, silly.");
  }

  const IPv4 = `${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  if (!IPv4) {
    return message.channel.send("That user doesn't have an ip address.");
  }

  axios
    .get(`http://ip-api.com/json/${IPv4}`)
    .then((res) => res.data)
    .then((json) => {
      if (json.status === "fail") {
        return message.channel.send(
          `**${user.username}** doesn't have a home, it's **undefined**! What a loser.`
        );
      }

      let ipEmbed = new MessageEmbed()
        .setTitle(`${user.username}'s IP Address`)
        .setURL(`https://ipinfo.io/${IPv4}`)
        .setColor("RED")
        .setDescription(`**${json.city}**, **${json.country}**\n${json.query}`)
        .setThumbnail(`https://countryflagsapi.com/png/${json.countryCode}`)
        .setFooter(
          `${user.username}'s IP Address: ${json.query}`,
          user.displayAvatarURL()
        )
        .setTimestamp();

      message.channel.send({ embeds: [ipEmbed] });
    });
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User",
};

exports.help = {
  name: "ip",
  category: "Fun",
  description: "Doxx your friends! How cool!",
  usage: "ip",
};
