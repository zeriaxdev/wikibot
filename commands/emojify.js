const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { MessageActionRow, MessageButton } = require("discord.js");
const { truncate } = require("../modules/functions");

exports.run = async (client, message, args) => {
  const query = args[0]
    ? truncate(args.join(" "), 3950)
    : "bruh man!!! how could that possibly happen!??!?!?";
  const apiUrl = "https://api.emojify.net";
  const pasteApiURL = "https://api.paste.ee/v1/pastes";

  const response = await fetch(`${apiUrl}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: `${query}`,
      density: 100,
      shouldFilterEmojis: false,
    }),
  });

  const data = await response.json();

  const regex = new RegExp(/[^a-zA-Z ]/gi);
  const res = query.replace(regex, "");
  const fullText = res.toLowerCase().replace(/\s+/g, " ");
  const textArray = fullText.split(" ");
  const betterText = textArray.slice(0, 5).join(" ");

  const emojis = ["🍝"];
  const reply = "You don't deserve pasta.";

  const paste = await fetch(`${pasteApiURL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": process.env.PASTE_TOKEN || "meowmeowmeow",
    },
    body: JSON.stringify({
      sections: [
        {
          name: `${betterText ? truncate(betterText, 64) : "awesome_title"}`,
          syntax: "text",
          contents: `${data ? data.result : reply}`,
        },
      ],
    }),
  });

  const pasteData = await paste.json();

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setEmoji(emojis[Math.floor(Math.random() * emojis.length)])
      .setLabel("Grab your pasta!")
      .setURL(
        pasteData.success
          ? pasteData.link
          : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      )
      .setStyle("LINK")
  );

  message.channel.send({
    content: `\`\`\`${data ? data.result : reply}\`\`\``,
    components: [row],
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User",
};

exports.help = {
  name: "emojify",
  category: "Miscellaneous",
  description: "emojify some shit",
  usage: "emojify <text>",
};
