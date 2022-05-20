const functions = require("firebase-functions");
const axios = require("axios");

const USDCContractAddress = "m0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

function sendBalanceToDiscord(balance) {
  return sendDiscordMessage(
    `O saldo do nosso tesouro é de ${balance} USDC`,
    "https://i.pinimg.com/originals/54/74/aa/5474aa87f86bdd4153bcfb2874d4507f.jpg"
  );
}

function sendDiscordMessage(content, avatar_url) {
  const url =
    "https://discord.com/api/webhooks/929867423790792734/UWmqIMfteaXneingARC2eO7ezmoJ9ooUPN2XAA3mUAw005pZ3psKneT6PmSi1iOwkrl5";
  return axios.post(url, { content, avatar_url });
}

exports.notifyIfPendingTransaction = functions.https.onRequest((req, res) => {
  const url = `https://safe-client.gnosis.io/v1/chains/137/safes/${process.env.TREASUARY_ADDRESS}/transactions/queued`;
  axios.get(url).then((resp) => {
    console.log(resp);
    if (resp.results && resp.results.length > 0) {
      return sendDiscordMessage(
        "🚨🚨 TRANSAÇÃO PENDENTE! APROVAR!!! 🚨🚨",
        "https://i.imgur.com/OyQ6ued.png"
      ).then((d) => {
        return res.status(200).json({ ok: 200, notified: "Pendentes!" });
      });
    } else {
      return res.status(200).json({ ok: 200, notified: "Nada pendente" });
    }
  });
});

exports.sendTreasuryDataToDiscord = functions.https.onRequest((req, res) => {
  const baseUrl = "https://api.charmantadvisory.com/BALANCE/";
  return axios
    .get(
      `${baseUrl}/${USDCContractAddress}/${process.env.TREASUARY_ADDRESS}/${process.env.CHARMANT_APIKEY}`
    )
    .then((resp) => {
      console.log("Current Balance: " + resp.data);
      return sendBalanceToDiscord(resp.data).then((d) => {
        return res.status(200).json({ ok: 200 });
      });
    });
});
