/**
 * Entry point cho DirectAdmin / panel Node.js — startup file: app.js
 * Panel reverse-proxy domain → PORT (không cần mở port ra ngoài).
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Panel DirectAdmin có thể set NODE_ENV=nodejs — luôn chạy production sau npm run build
process.env.NODE_ENV = "production";

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling request", err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    })
      .once("error", (err) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(
          `> NTP ready — PORT=${port} (panel proxy domain → port này)`
        );
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
