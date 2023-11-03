const dotEnv = require("dotenv");
const cors = require("cors");

dotEnv.config({ path: "./env/config.env" });
const connection = require("./db/connection");
const app = require("./app");
connection();

app.use(
  cors({
    origin: "*", // Allow requests from any client URL
    methods: "GET,POST,PATCH,DELETE",
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});
