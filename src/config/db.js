const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

function connectToDB() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Database is connected");
    })
    .catch((err) => {
      console.log("Error connecting to DB");
      process.exit(1);
    });
}

module.exports = connectToDB;
