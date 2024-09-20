import { createClient } from "@libsql/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(500).json({ message: "Not POST method", error: true });
  }

  const { address, email, size, service_type, clean_type } = req.body;

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const bdResponse = await client.execute({
    sql: "INSERT INTO home_form_submits (address, email, size, service_type, clean_type) VALUES (?, ?, ?, ?, ?)",
    args: [address, email, size, service_type, clean_type],
  });

  if (bdResponse.rowsAffected === 1) {
    res.status(200).json({
      error: false,
      message: "Created succesfully",
    });
  } else res.status(500).json({ message: "Error", error: true });
}
