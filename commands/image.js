const logger = require("../modules/logger.js");
const { default: axios } = require("axios");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
const Canvas = require("canvas");
const Jimp = require("jimp");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const Scraper = require("images-scraper");
const { truncate } = require("../modules/functions");
const { nsfwCategories } = require("../modules/exports");

exports.run = (client, message, args) => {
  message.channel.send("🔍 Scraping Google...").then(async (sentMsg) => {
    const query = args[0] ? truncate(args.join(" "), 100) : "a cute dog";

    const google = new Scraper({
      puppeteer: {
        headless: true,
      },
    });

    const googleImage = async () => {
      const results = await google.scrape(query, 1);
      return results[0].url;
    };

    const processImage = encodeURI(await googleImage());

    sentMsg.edit({
      content: `⚙ Processing image...`,
    });

    const pic = await axios.get(processImage, {
      responseType: "arraybuffer",
    });

    const imageEmbed = new MessageEmbed()
      .setTitle(`***${query}*** - results`)
      .setAuthor(message.author.username, message.author.displayAvatarURL())
      .setColor(`BLURPLE`)
      .setFooter(
        `Requested by ${message.author.username}`,
        message.author.displayAvatarURL()
      )
      .setTimestamp()
      .setURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
      .setImage(processImage);

    let processedImage = await Jimp.read(processImage);
    const model = await nsfw.load();

    const newImage = tf.node.decodeImage(pic.data, 3);
    const predictions = await model.classify(newImage, 5);
    newImage.dispose();

    if (
      nsfwCategories.includes(predictions[0].className) ||
      (nsfwCategories.includes(predictions[1].className) &&
        predictions[1].probability >= 0.3)
    ) {
      let image = processedImage;
      image.blur(100);
      const newerImage = await image.getBufferAsync(Jimp.MIME_JPEG);
      processedImage.blur(169);

      const canvas = Canvas.createCanvas(
        processedImage.bitmap.width,
        processedImage.bitmap.height
      );
      const ctx = canvas.getContext("2d");

      Canvas.loadImage(newerImage).then((img) => {
        ctx.drawImage(img, 0, 0, img.width, img.height);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#191f22";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        ctx.fillStyle = "white";
        ctx.font = `bold ${
          img.width > img.height ? img.height / 10 : img.width / 10
        }px Hack`;
        ctx.textAlign = "center";
        ctx.fillText("NSFW", img.width / 2, img.height / 2 + img.width / 50);

        const attachment = new MessageAttachment(canvas.toBuffer(), `nsfw.png`);

        imageEmbed
          .setDescription(`**NSFW** content detected!`)
          .setImage(`attachment://nsfw.png`)
          .setFooter(
            `Caught ${message.author.username} in 4k 📸`,
            message.author.displayAvatarURL()
          );

        sentMsg.edit({
          content: `🔞 NSFW detected!`,
          embeds: [imageEmbed],
          files: [attachment],
        });
      });
    } else {
      imageEmbed.setDescription(`\`${query}\` - Google Search results.`);

      sentMsg.edit({
        content: `☑️ All clear.`,
        embeds: [imageEmbed],
      });
    }
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["i", "img"],
  permLevel: "User",
};

exports.help = {
  name: "image",
  category: "Miscellaneous",
  description: "Find images on Google!",
  usage: "image <text>",
};
