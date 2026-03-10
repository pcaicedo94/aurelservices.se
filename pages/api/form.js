import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(500).json({ message: "Not POST method", error: true });
  }

  const { address, email, size, service_type, clean_type, price } = req.body;

  try {
    const { error } = await supabase.from("quotes").insert({
      address,
      email,
      size,
      service_type,
      clean_type,
      price: price || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ message: "Error", error: true });
    }

    res.status(200).json({ error: false, message: "Created succesfully" });
  } catch (err) {
    console.error("Form error:", err);
    res.status(500).json({ message: "Error", error: true });
  }
}
