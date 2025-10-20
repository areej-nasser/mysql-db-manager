import express from "express";
import mysql from "mysql2/promise.js";
import session from "express-session";
const app = express();

app.use(
    session({
        secret: "supersecret",
        resave: false,
        saveUninitialized: true,
    })
);

const port = 4000;

app.use(express.json())
app.use(express.static("public"))


app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (username === "root" && password === "") {
            const connect = await mysql.createConnection({
                host: "localhost",
                user: username,
                password: password,
            });

            console.log("✅ connected!");
            req.session.loggedIn = true;
            req.session.password = password;
            await connect.end();

            res.json({ success: true });
        } else {
            res.json({ success: false, message: "❌ Only root user is allowed" });
        }
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


app.get("/data", async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
        });
        const [databases] = await connection.query("SHOW DATABASES");
        const [users] = await connection.query("SELECT user, host FROM mysql.user");
        await connection.end();
        res.json({ databases, users });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/create-database", async (req, res) => {
    try {
        const { dbName } = req.body;
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
        });
        await connection.query(`CREATE DATABASE ${dbName}`);
        await connection.end();
        res.json({ message: `✅ Database '${dbName}' created successfully` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.post("/create-table", async (req, res) => {
    try {
        const { dbName, tableName, columns } = req.body;
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
        });

        await connection.query(`USE ${dbName}`);
        await connection.query(`CREATE TABLE ${tableName} (${columns})`);
        await connection.end();
        res.json({ message: `✅ Table ${tableName} created successfully in ${dbName}` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post("/create-user", async (req, res) => {
    try {
        const { username, password, dbName } = req.body;
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
        });

        await connection.query(`CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}'`);
        await connection.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${username}'@'localhost'`);
        await connection.end();
        res.json({ message: ` User '${username}' created and granted access to ${dbName}` });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})





app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
