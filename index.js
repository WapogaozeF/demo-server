import express from "express";
import cookieSession from "cookie-session";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import expressWs from "express-ws";

const app = express();

app.use(helmet());
app.set("trust proxy", true);

app.use(express.json());

app.use(
    cookieSession({
        signed: false,
        secure: false,
    }),
);

app.post("/api/users/signin", (req, res) => {
    const { email, password } = req.body;

    const existingUser = {
        id: "660bc0791552f50507cc0c55",
        email: "admin@admin.com",
        role: "admin",
        status: "active",
        name: "Артемов Станислав",
    };

    if (email === "admin@admin.com" && password === "12345678") {
        const userJwt = jwt.sign(
            {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                status: existingUser.status,
            },
            "jwt",
        );

        req.session = {
            jwt: userJwt,
        };

        res.status(200).send(existingUser);
    } else {
        res.sendStatus(500);
    }
});

const stores = [
    {
        country: "Россия",
        city: "Воронеж",
        status: "open",
        address: "Средне-Московская ул., 71, Офис 1",
        name: "Средне-Московская",
        _createdAt: "2021-01-21T17:00:31.748Z",
        __v: 0,
        id: "65ae426ea8f0e5518a083778",
    },
    {
        country: "Россия",
        city: "Воронеж",
        status: "open",
        address: "ул. Фридриха Энгельса, 64а",
        name: "Атмосфера",
        _createdAt: "2019-03-26T11:05:12.773Z",
        __v: 0,
        id: "6602abe88ebf277e24fe612c",
    },
];

app.get("/api/stores", (req, res) => {
    res.json(stores);
});

const { app: appWithWebSocket } = expressWs(app);

const connections = new Map();

const sendMessageToChannel = (channelId, message) => {
    const ws = connections.get(channelId);
    if (ws) {
        ws.send(message);
        return true;
    } else {
        return false;
    }
};

setInterval(() => {
    sendMessageToChannel(stores[0].id, Math.random().toString());
    sendMessageToChannel(stores[1].id, Math.random().toString());
}, 5000);

appWithWebSocket.ws("/ws", (ws, req) => {
    const { storeId } = req.query;

    const token = req.session.jwt;
    if (!token) {
        ws.terminate();
        return;
    }

    try {
        jwt.verify(token, "jwt");

        if (storeId && typeof storeId === "string") {
            connections.set(storeId, ws);
        }

        ws.on("close", () => {
            console.log("WebSocket connection closed");
            if (storeId && typeof storeId === "string") {
                connections.delete(storeId);
            }
        });
    } catch (error) {
        console.error("Error authenticating user:", error);
        ws.terminate();
    }
});

app.listen(3000, () => {
    console.log("Server listen on port: 3000");
});
