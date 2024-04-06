import chalk from "chalk";
import webhooks from "./justicee2.js";
import WebSocket from "ws";
import cfonts from "cfonts";
import functions from "./justicee3.js";
import config from "./justicee1.js";
const guilds = {};
const info = (str) =>
  console.log(`${chalk.hex("#ed2d8d")("[BILGI]")} ${chalk.hex("#fff")(str)}`);
const error = (str) =>
  console.log(`${chalk.hex(`#f00a0d`)("[HATA]")} ${chalk.hex("#fff")(str)}`);
const statusCodes = {
  400: `Şansa urlyi aldı lavuklar.`,
  429: "Rate Limit Yemiş Sw.",
  403: "Yetkisi yok.",
  401: "Token Patlamış",
};

cfonts.say("JUSTICEE", {
  font: "chrome", // define the font face
  align: "center", // define text alignment
  colors: ["candy", "#ed2d8d"], // define all colors
  background: "transparent", // define the background color, you can also use `backgroundColor` here as key
  letterSpacing: 1, // define letter spacing
  lineHeight: 1, // define the line height
  space: true, // define if the output text should have empty lines on top and on the bottom
  maxLength: "15", // define how many character can be on one line
  gradient: true, // define your two gradient colors
  independentGradient: true, // define if you want to recalculate the gradient for each new line
  transitionGradient: true, // define if this is a transition between colors directly
});

cfonts.say(
  "Sniper Acık",
  {
    font: "console", // define the font face
    align: "center", // define text alignment
    colors: ["#ed2d8d"], // define all colors
  }
);
const ws = new WebSocket(`wss://gateway-us-east1-c.discord.gg`);

ws.on("open", () => {
  info("Gateway e bağlaniliyor");
  ws.on("message", async (message) => {
    const { d, op, t } = JSON.parse(message);
    if (t === "GUILD_UPDATE") {
      const getGuild = guilds[d.guild_id];
      if (typeof getGuild === "string" && getGuild !== d.vanity_url_code) {
        await functions
          .snipeVanityUrl(getGuild)
          .then(async () => {
            await webhooks.success(
              `
 
\`\`\` {"code":"${getGuild}","uses":0} \`\`\`
 
@everyone
`
            );
            return delete guilds[d.guild_id];
          })
          .catch(async (err) => {
            await webhooks.error(
              `${getGuild}: "Invite code is either invalid or taken.", code: ${err} (\`${statusCodes[`${err}`]
              }\`).`
            );
            await functions.leaveGuild(d.guild_id);
            delete guilds[d.guild_id];
            await functions
              .joinGuild(getGuild)
              .then(async ({ guild_id }) => {
                await webhooks.info(
                  `${getGuild} urlsi kaçırıldığı için, otomatik olarak eski sunucudan çıkıldı ve yeni sunucuya girildi.`
                );
                guilds[guild_id] = getGuild;
                return;
              })
              .catch(
                async (err) =>
                  await webhooks.info(
                    `${getGuild} urlsi kaçırıldı. eski sunucudan çıkıldı ama yeni sunucuya girilemedi. durum kodu: ${err}. \`${statusCodes[`${err}`]
                    }\``
                  )
              );
          });
      }
    } else if (t === "GUILD_DELETE") {
      const getGuild = guilds[d.id];
      if (getGuild) {
        await functions
          .snipeVanityUrl(getGuild)
          .then(async () => {
            await webhooks.success(
              `
              Vanity Drop!
 
\`\`\` {"code":"${getGuild}","uses":0} \`\`\`
 GUILD_DELETE
 
@everyone
 `
            );
            return delete guilds[d.id];
          })
          .catch(async (err) => {
            await webhooks.error(
              `${getGuild}: "Invite code is either invalid or taken.", code: ${statusCodes
              }\`). Url alınamadı boostu düştü veya sunucudan atıldım`
            );
            await functions
              .joinGuild(getGuild)
              .then(async ({ guild_id }) => {
                await webhooks.info(
                  `${getGuild} urlsi kaçırıldı, yeni sunucuya girildi.`
                );
                guilds[guild_id] = getGuild;
                return;
              })
              .catch(
                async (err) =>
                  await webhooks.info(
                    `${getGuild} urlsi kaçırıldı. yeni sunucuya girilemedi. durum kodu: ${err}. (\`${statusCodes[`${err}`]
                    }\`)`
                  )
              );
          });
      }
    } else if (t === "READY") {
      info(`Açıldık aq`);
      d.guilds
        .filter((e) => e.vanity_url_code)
        .forEach((guild) => (guilds[guild.id] = guild.vanity_url_code));
      return await webhooks.info(`Bot Açık
Snipe Vanitys: 
\`\`\`
${d.guilds
          .filter((e) => e.vanity_url_code)
          .map((guild) => `${guild.vanity_url_code}`)
          .join(", ")}
\`\`\`
        `);
    }
    if (op === 10) {
      ws.send(
        JSON.stringify({
          op: 2,
          d: {
            token: config.listenerToken,
            intents: 1,
            properties: {
              os: "Linux",
              browser: "firefox",
              device: "firefox",
            },
          },
        })
      );
      setInterval(
        () =>
          ws.send(JSON.stringify({ op: 1, d: {}, s: null, t: "heartbeat" })),
        d.heartbeat_interval
      );
    } else if (op === 10) {
      info(`tekrar basliyom.`);
      return process.exit();
    }
  });
  ws.on("close", (code) => {
    if (code === 4004) {
      error(`Sniper tokeni yanlis`);
    }
    return process.exit();
  });
});