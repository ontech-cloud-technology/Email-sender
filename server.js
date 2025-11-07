import "dotenv/config";
import express from "express";
import cors from "cors";
import { emailService } from "./sendMail.js";

const app = express();
const PORT = process.env.PORT || 4000;

const parseAllowedOrigins = () => {
  const { ALLOWED_ORIGINS } = process.env;
  if (!ALLOWED_ORIGINS) return [];
  return ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: false,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/email/welcome", async (req, res) => {
  const { email, fullName, role, temporaryPassword } = req.body || {};

  if (!email || !temporaryPassword) {
    return res.status(400).json({
      error: "Champs requis manquants : email et temporaryPassword sont obligatoires.",
    });
  }

  try {
    const result = await emailService.sendWelcomeEmail({ email, fullName, role, temporaryPassword });
    return res.status(202).json({
      message: "Courriel de bienvenue en file d'attente.",
      result,
    });
  } catch (error) {
    console.error("[email] Échec d'envoi de l'email de bienvenue:", error);
    return res.status(500).json({
      error: "Impossible d'envoyer le courriel de bienvenue.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`📬 Email service prêt sur le port ${PORT}`);
    if (allowedOrigins.length) {
      console.log(`   Origines autorisées: ${allowedOrigins.join(", ")}`);
    } else {
      console.log("   Origine CORS: * (toutes)");
    }
  });
}

export { app };
