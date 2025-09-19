const http = require("http");
const mongodb = require("mongodb");

let db;
const connectionString =
  "mongodb+srv://johandev429_db_:WoFFFZfcHJ3tbaeE@cluster0.2xutlob.mongodb.net/";
mongodb.connect(
  connectionString,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) console.log("ERROR on connection MongoDB");
    else {
      console.log("MongoDB connnection succeed");
      module.exports = client;
      const app = require("./app");
      const server = http.createServer(app);
      let PORT = 3019;
      server.listen(PORT, function () {
        console.log(
          `The server is runing successfully on port: ${PORT}, http://localhost:${PORT}`
        );
      });
    }
  }
);