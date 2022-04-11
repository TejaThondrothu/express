const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("server is running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// User Register API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectedUserQuery = `
    select
         * 
    from 
        user 
    where 
        username='${username}';`;

  const dbUser = await db.get(selectedUserQuery);

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
        INSERT INTO 
            user (username,name,password,gender,location) 
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
            );`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("user already exists");
  }
});

//GET user API
app.get("/register", async (request, response) => {
  const userQuery = `
    select * from user;`;
  const dbResponse = await db.all(userQuery);
  response.send(dbResponse);
});

//login User API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectedQuery = `
    select * from user where username='${username}';`;
  const dbUser = await db.get(selectedQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCompare = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCompare === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectedQuery = `
    select * from user where username='${username}';`;
  const dbUser = await db.get(selectedQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCompare = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );

    if (isPasswordCompare === true) {
      if (newPassword.length <= 5) {
        response.status(400);
        response.send("Password is too Short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
            update 
                user 
            set password = '${hashedPassword} '
            where username = '${username}';`;
        const user = await db.run(updateQuery);
        response.send("Password updated successfully");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
