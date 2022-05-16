const {
  createCipheriv,
  randomBytes,
  createDecipheriv,
  createHash,
} = require("crypto");
const { truncate } = require("../modules/functions");

exports.run = (client, message, args) => {
  message.channel.send("Encrypting your message...").then(async (sentMsg) => {
    const query = args[0] ? truncate(args.join(" "), 200) : "hi mom!";
    const key = randomBytes(32);
    const iv = randomBytes(16);

    const cipher = createCipheriv("aes256", key, iv);
    const encryptedMessage =
      cipher.update(query, "utf8", "base64") + cipher.final("base64");

    const decipher = createDecipheriv("aes256", key, iv);
    const decryptedMessage =
      decipher.update(encryptedMessage, "base64", "utf-8") +
      decipher.final("utf8");

    const hash = (input) => {
      return createHash("sha256").update(input).digest("base64url");
    };

    const msg = `Encrypted: \`${encryptedMessage}\`\nDeciphered: \`${decryptedMessage.toString(
      "utf-8"
    )}\`\nHashed: \`${hash(decryptedMessage.toString("utf-8"))}\``;

    sentMsg.edit({
      content: msg,
    });
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["enc"],
  permLevel: "User",
};

exports.help = {
  name: "encrypt",
  category: "Miscellaneous",
  description: "Encrypts a message",
  usage: "encrypt <text>",
};
