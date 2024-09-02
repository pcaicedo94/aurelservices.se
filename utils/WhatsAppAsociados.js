import React, { useState, useEffect } from "react";
import isMobileDevice from "./IsMobile";

const whastAppAsociados = () => {
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  useEffect(() => {
    const getWhatsAppUrl = async () => {
      const val = await isMobileDevice();
      const url = `https://${val ? "api" : "web"}.whatsapp.com/send?phone=+573184153751&text=Hola%20Te%20escribo%20desde%20la%20p%C3%A1gina%20web%20Deseo%20m%C3%A1s%20informaci%C3%B3n%20sobre:%20%0A`;
      setWhatsAppUrl(url);
    };

    getWhatsAppUrl();
  }, []);

  return whatsAppUrl;
};
export default whastAppAsociados;
