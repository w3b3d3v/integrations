const functions = require("firebase-functions");
const { getDatabase } = require("firebase-admin/database");
const fetch = require("node-fetch");

var admin = require("firebase-admin");
admin.initializeApp();

async function discordData(type) {
  const headers = {
    headers: {
      authorization: process.env.DISCORD_TOKEN,
    },
  };

  const url =
    "https://discord.com/api/v9/guilds/898706705779687435/analytics/growth-activation/";
  const query = "?start=2022-02-01&end=2026-05-17&interval=1";
  return await (await fetch(url + type + query, headers)).json();
}

function callback(error, results, fields) {
  if (error) throw error;
  console.log("The solution is: ", results[0].solution);
}

exports.saveDiscordData = functions.https.onRequest(
  async (request, response) => {
    const db = getDatabase();
    const ref = db.ref("discord");

    const joins = await discordData("joins-by-source");
    const membership = await discordData("membership");
    ref.set({ joins, membership });

    const mysql = require("mysql");
    const connection = mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    connection.connect();

    // connection.query(
    //   "create table discord_membership (interval_start date primary key, value bigint)"
    // );
    // connection.query(
    //   "create table discord_join_types (interval_start date primary key, invites bigint, discovery bigint, vanity bigint);"
    // );

    connection.query("delete FROM discord_membership");
    connection.query("delete FROM discord_join_types");

    const p1 = membership.map((m) => {
      connection.query("insert into discord_membership values (?,?)", [
        m.interval_start_timestamp,
        m.total_membership,
      ]);
    });

    const p2 = joins.map((j) => {
      connection.query("insert into discord_join_types values (?,?,?,?)", [
        j.interval_start_timestamp,
        j.invites,
        j.discovery_joins,
        j.vanity_joins,
      ]);
    });

    await Promise.all(p1);
    await Promise.all(p2);

    connection.end();

    response.send("OK");
  }
);
