require('dotenv').config();

const {
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require('discord.js');

const CONFIG = Object.freeze({
  guildId: '1129103061332263033',
  triggerChannelId: '1129103923135922216',
  outputChannelId: '1481717290561966100',
  preservedRoleId: '1129103472948678780',
  rolesToAdd: ['1343636338754457632', '1343636743450001479'],
  timezone: 'Europe/Madrid',
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Falta DISCORD_TOKEN en el archivo .env o en las variables de Railway.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: CONFIG.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function buildTemplate(member, messageDate) {
  const lines = [
    `Código de discord: ${member.user.username} // ${member.id}`,
    `Fecha de salida de la facción: ${formatDate(messageDate)}`,
    'Motivo de la salida: Expulsión horas',
    'Blacklisted: no',
  ].join('\n');

  return `\`\`\`\n${lines}\n\`\`\``;
}

async function checkBotPermissions(guild) {
  const me = guild.members.me ?? await guild.members.fetchMe();
  const required = [
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageNicknames,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ];

  if (!me.permissions.has(required)) {
    throw new Error('Al bot le faltan permisos para gestionar roles, apodos o mensajes.');
  }
}

async function processMember(message, member) {
  const guild = message.guild;
  await checkBotPermissions(guild);

  const rolesToRemove = member.roles.cache.filter((role) =>
    role.id !== guild.id
    && role.id !== CONFIG.preservedRoleId
    && !CONFIG.rolesToAdd.includes(role.id)
    && role.editable
  );

  if (rolesToRemove.size > 0) {
    await member.roles.remove(rolesToRemove, `Salida de facción solicitada en el mensaje ${message.id}`);
  }

  await member.roles.add(CONFIG.rolesToAdd, `Salida de facción solicitada en el mensaje ${message.id}`);
  await member.setNickname(null, `Salida de facción solicitada en el mensaje ${message.id}`);

  const outputChannel = await guild.channels.fetch(CONFIG.outputChannelId);
  if (!outputChannel?.isTextBased() || !('send' in outputChannel)) {
    throw new Error('El canal de salida no existe o no permite enviar mensajes.');
  }

  await outputChannel.send({
    content: buildTemplate(member, message.createdAt),
    allowedMentions: { parse: [] },
  });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);
  console.log('Esperando mensajes nuevos; no se procesará el historial anterior.');
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.inGuild()) return;
  if (message.guildId !== CONFIG.guildId) return;
  if (message.channelId !== CONFIG.triggerChannelId) return;

  const mentionedUser = message.mentions.users.first();
  if (!mentionedUser) return;

  try {
    const member = await message.guild.members.fetch(mentionedUser.id);
    await processMember(message, member);
    await message.react('✅').catch(() => {});
    console.log(`Procesado ${member.user.tag} (${member.id}) desde el mensaje ${message.id}.`);
  } catch (error) {
    console.error(`No se pudo procesar el mensaje ${message.id}:`, error);
    await message.react('❌').catch(() => {});
  }
});

client.on(Events.Error, (error) => {
  console.error('Error del cliente de Discord:', error);
});

client.login(process.env.DISCORD_TOKEN);
