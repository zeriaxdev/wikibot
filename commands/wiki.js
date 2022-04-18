const axios = require("axios");
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageAttachment,
} = require("discord.js");
const config = require("../config");
const { truncate, getSettings } = require("../modules/functions");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
const Canvas = require("canvas");
const Jimp = require("jimp");
const { nsfwCategories } = require("../modules/exports");

exports.run = (client, message, args, level) => {
  const settings = (message.settings = getSettings(message.guild));
  let currentLang = config.defaultSettings.wikiLang;

  if (config.wikiLangs.includes(settings.wikiLang)) {
    currentLang = settings.wikiLang;
  } else {
    if (level >= 3) {
      message.author.send(
        `⚠️ Warning!\n` +
          `The Wikipedia language you have set up on **${message.guild} - ${message.guildId}** is invalid and was set to default!\n` +
          `Current default subdomain - \`${currentLang}\``
      );
    }
  }

  message.channel.send(`🔍 Searching Wikipedia...`).then((sentMsg) => {
    const domainURL = `https://${currentLang}.wikipedia.org/w/api.php`;
    const query = args[0]
      ? truncate(args.join(" "), 200) + "..."
      : "JavaScript";
    const url = `${domainURL}?action=query&prop=extracts&format=json&origin=*&exintro=&explaintext=&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(
      query
    )}&exlimit=max&exsentences=7&formatversion=2`;
    const newURL = encodeURI(url);

    const wikiEmbed = new MessageEmbed().setAuthor(
      message.author.username,
      message.author.displayAvatarURL()
    );

    axios
      .get(newURL)
      .then((response) => {
        if (response.data.query?.pages) {
          const pages = response.data.query.pages;

          pages.map((elem) => {
            const index = elem.index;

            if (index == 1) {
              // console.log(elem);
              // console.log(`main : ${elem.title}`);
              const desc = () => {
                const text = elem.extract.replace("\n", "\n\n");
                const regex = new RegExp(/[^a-zA-Z ]/gi);

                let res = text.replace(regex, "");
                let fullText = res.toLowerCase().replace(/\s+/g, " ");
                let textArray = fullText.split(" ");

                let queryRes = query.replace(regex, "");
                let fullQuery = queryRes.toLowerCase().replace(/\s+/g, " ");
                let queryArray = fullQuery.split(" ");

                // console.log(
                //   `query: ${query.toLowerCase()}\n\ntext: ${fullText}\n\nincludes?: ${fullText.includes(
                //     query.toLowerCase()
                //   )}`
                // );
                // console.log(textArray);
                // console.log(queryArray);

                // console.log(
                //   fullText.includes(query.toLowerCase()),
                //   queryArray.some((r) => textArray.includes(r))
                //     ? queryArray.some((r) => {
                //         fullText.replace(r, `${r.toUpperCase()}`);
                //       })
                //     : textArray.includes(queryArray.any)
                // );
              };

              desc();

              wikiEmbed
                .setTitle(`${elem.title}`)
                .setDescription(`${elem.extract.replace("\n", "\n\n")}`);

              const imageURL = `${domainURL}?action=query&prop=pageimages&titles=${encodeURIComponent(
                elem.title
              )}&format=json&pithumbsize=1000&formatversion=2`;

              axios.get(imageURL).then(async (response) => {
                // console.log(response.data.query);
                const imgPages = response.data.query.pages[0];
                const imgExists = imgPages.thumbnail?.source ? true : false;

                if (imgExists) {
                  sentMsg.edit(`🖼️ Analyzing the image...`);

                  const pic = await axios.get(imgPages.thumbnail.source, {
                    responseType: "arraybuffer",
                  });
                  const model = await nsfw.load();

                  const image = tf.node.decodeImage(pic.data, 3);
                  const predictions = await model.classify(image, 5);
                  image.dispose();

                  // console.log(predictions);
                  wikiEmbed.setColor(`GREEN`);
                  if (
                    nsfwCategories.includes(predictions[0].className) ||
                    nsfwCategories.includes(predictions[1].probability > 0.3)
                  ) {
                    let image = await Jimp.read(imgPages.thumbnail.source);
                    image.blur(100);
                    const newImage = await image.getBufferAsync(Jimp.MIME_JPEG);

                    const canvas = Canvas.createCanvas(
                      image.bitmap.width,
                      image.bitmap.height
                    );
                    const ctx = canvas.getContext("2d");

                    Canvas.loadImage(newImage).then((img) => {
                      ctx.drawImage(img, 0, 0, img.width, img.height);
                      ctx.globalAlpha = 0.7;
                      ctx.fillStyle = "#191f22";
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.globalAlpha = 1;
                      ctx.fillStyle = "white";
                      ctx.font = `bold ${
                        img.width > img.height
                          ? img.height / 10
                          : img.width / 10
                      }px Hack`;
                      ctx.textAlign = "center";
                      ctx.fillText(
                        "NSFW",
                        img.width / 2,
                        img.height / 2 + img.width / 50
                      );

                      const attachment = new MessageAttachment(
                        canvas.toBuffer(),
                        `wiki.png`
                      );

                      wikiEmbed.setImage(`attachment://wiki.png`);

                      sentMsg.edit({
                        embeds: [wikiEmbed],
                        files: [attachment],
                      });
                    });
                  } else {
                    wikiEmbed.setImage(imgPages.thumbnail.source);

                    sentMsg.edit({
                      embeds: [wikiEmbed],
                    });
                  }
                } else {
                  wikiEmbed.setColor(`BLURPLE`);

                  sentMsg.edit({ embeds: [wikiEmbed] });
                }

                sentMsg.edit({
                  content: "✅ Done!",
                });
              });
            }
          });
        } else {
          wikiEmbed
            .setTitle(`${truncate(query, 120)} - Not Found`)
            .setDescription(
              "The requested resource was not found on Wikipedia. Wanna try searching it on **DuckDuckGo**?"
            )
            .setURL(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`)
            .setColor(`RED`);

          const row = new MessageActionRow().addComponents(
            new MessageButton()
              .setEmoji(`🦆`)
              .setLabel("DuckDuckGo")
              .setURL(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`)
              .setStyle("LINK")
          );

          message.channel.send({ embeds: [wikiEmbed], components: [row] });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["w", "wikipedia"],
  permLevel: "User",
};

exports.help = {
  name: "wiki",
  category: "Miscellaneous",
  description: "Search Wikipedia",
  usage: "wiki",
};
