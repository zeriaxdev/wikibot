exports.run = async (client, interaction) => {
  // eslint-disable-line no-unused-vars
  await interaction.deferReply();
  const reply = await interaction.editReply("wiki");
  await interaction.editReply(`whad`);
};

exports.commandData = {
  name: "wiki",
  description: "Search Wikipedia.org",
  options: [
    // {
    //   name: "search",
    //   description: "search wikipedia",
    //   type: "STRING",
    // },
  ],
  defaultPermission: true,
};

// Set guildOnly to true if you want it to be available on guilds only.
// Otherwise false is global.
exports.conf = {
  permLevel: "User",
  guildOnly: false,
};
