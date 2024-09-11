import { useState } from "react";
import baseUrl from "../../utils/baseUrl";
import DownloadPDF from "../DownloadPDF/DownloadPDF";

export default function HomeForm() {
  const [size, setSize] = useState("");
  const [address, setAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function saveHomeForm(data) {
    return await fetch(baseUrl + `/api/form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  const saveDataOnTurso = async () => {
    const payload = {
      address,
      email: clientEmail,
      size,
    };
    const response = await saveHomeForm(payload);
    const responseData = await response.json();
    if (response.status === 200 && !responseData.error) {
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) {
      return;
    }
    setSubmitted(true);
    try {
      await saveDataOnTurso();

      //SEND EMAIL
      const url = `${baseUrl}/api/contact`;
      const payload = { size, address, clientEmail };
      const response = await axios.post(url, payload);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="home-form-container">
      <form className="home-form" onSubmit={handleSubmit}>
        <h1>Cleaning services that feel as fresh as they look.</h1>
        <div>
          <input
            value={size}
            min="1"
            type="number"
            style={{ width: 130 }}
            placeholder="Size (m2)"
            required
            onChange={(e) => {
              if (submitted) setSubmitted(false);
              setSize(e.target.value);
            }}
          ></input>
          <input
            value={address}
            style={{ width: "100%" }}
            placeholder="Address"
            required
            onChange={(e) => {
              if (submitted) setSubmitted(false);
              setAddress(e.target.value);
            }}
          ></input>
        </div>
        <input
          value={clientEmail}
          style={{ width: "100%" }}
          placeholder="Email"
          type="email"
          required
          onChange={(e) => {
            if (submitted) setSubmitted(false);
            setClientEmail(e.target.value);
          }}
        ></input>
        {submitted && (
          <div style={{ color: "#34a783" }}>Sended successfully</div>
        )}
        <div>
          {submitted && (
            <DownloadPDF
              disabled={!clientEmail.length || !size.length || !address.length}
              size={size}
              address={address}
            />
          )}
          <button
            className="default-btn"
            style={{ minWidth: 150 }}
            disabled={submitted}
          >
            Ask <span></span>
          </button>
        </div>
      </form>
    </div>
  );
}
