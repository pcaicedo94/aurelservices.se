import { useState } from "react";
import DownloadPDF from "../DownloadPDF/DownloadPDF";
import axios from "axios";
import Select from "../Select/Select";

export default function HomeForm() {
  const [size, setSize] = useState("");
  const [address, setAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState({});
  const [service, setService] = useState({});
  const [price, setPrice] = useState(0); // Store calculated price

  // Price lists
  const priceLists = {
    företag: {
      hemstädning: [
        { range: [1, 50], price: 350 },
        { range: [51, 100], price: 300 },
        { range: [101, 150], price: 250 },
      ],
      flyttstädning: [
        { range: [1, 50], price: 2720 },
        { range: [51, 100], price: 65 },
        { range: [101, 150], price: 57 },
      ],
      storstädning: [
        { range: [1, 50], price: 2400 },
        { range: [51, 70], price: 2900 },
        { range: [71, 100], price: 3400 },
        { range: [101, 150], price: 4000 },
        { range: [151, 200], price: 4800 },
      ],
    },
    privat: {
      hemstädning: [
        { range: [1, 50], price: 180 },
        { range: [51, 100], price: 150 },
        { range: [101, 150], price: 120 },
      ],
      flyttstädning: [
        { range: [1, 50], price: 3400 },
        { range: [51, 100], price: 80 },
        { range: [101, 150], price: 75 },
      ],
      storstädning: [
        { range: [1, 50], price: 2400 },
        { range: [51, 70], price: 2900 },
        { range: [71, 100], price: 3400 },
        { range: [101, 150], price: 4000 },
        { range: [151, 200], price: 4800 },
      ],
    },
  };

  // Calculate price based on user input
  const calculatePrice = () => {
    const userType = type.value === "business" ? "företag" : "privat";
    const userService = service.value.toLowerCase();
    const userSize = parseInt(size, 10);

    console.log("User Type:", userType);
    console.log("User Service:", userService);
    console.log("User Size:", userSize);

    const selectedPriceList = priceLists[userType]?.[userService];
    console.log("Selected Price List:", selectedPriceList);

    // Returns the price as well as storing it: setPrice does not take effect
    // until the next render, so the submit handler needs the value directly.
    let matched = 0;
    if (selectedPriceList) {
      const matchedPrice = selectedPriceList.find(
        (item) => userSize >= item.range[0] && userSize <= item.range[1]
      );
      matched = matchedPrice ? matchedPrice.price : 0;
    }
    setPrice(matched);
    return matched;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) {
      return;
    }
    const calculatedPrice = calculatePrice();
    setSubmitted(true);
    try {
      await axios.post("/api/contact", {
        email: clientEmail,
        subject: "Prisförfrågan från startsidan",
        details: {
          Typ: type.label,
          Tjänst: service.label,
          Yta: size ? `${size} m²` : "",
          Adress: address,
          "Uppskattat pris": calculatedPrice ? `${calculatedPrice} kr` : "Offereras",
        },
      });
    } catch (error) {
      console.error(error);
      setSubmitted(false);
    }
  };

  const typeOptions = [
    { value: "business", label: "Företag" },
    { value: "private", label: "Privat" },
  ];

  const cleanOptions = [
    { value: "home", label: "Hemstädning" },
    { value: "moving", label: "Flyttstädning" },
    { value: "major", label: "Storstädning" },
  ];

  return (
    <div className="home-form-container">
      <form className="home-form" onSubmit={handleSubmit}>
        <h1>Behöver du hjälp med städning?</h1>
        <div className="form-row">
          <Select
            required
            placeholder="Typ"
            options={typeOptions}
            onChange={(data) => {
              setSubmitted(false);
              setType(data);
            }}
          />
          <Select
            required
            placeholder="Tjänster"
            options={cleanOptions}
            onChange={(data) => {
              setSubmitted(false);
              setService(data);
            }}
          />
        </div>
        <div className="form-row">
          <input
            value={size}
            min="1"
            type="number"
            style={{ width: 130 }}
            placeholder="Storlek (m2)"
            required
            onChange={(e) => {
              setSubmitted(false);
              setSize(e.target.value);
            }}
          ></input>
          <input
            value={address}
            style={{ width: "100%" }}
            placeholder="Address"
            required
            onChange={(e) => {
              setSubmitted(false);
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
            setSubmitted(false);
            setClientEmail(e.target.value);
          }}
        ></input>
        {submitted && (
          <div style={{ color: "#34a783" }}>
            Tack! Vi återkommer så snart som möjligt.
          </div>
        )}
        <div>
          {submitted && (
            <DownloadPDF
              disabled={
                !clientEmail.length ||
                !size.length ||
                !address.length ||
                !type.value ||
                !service.value
              }
              size={size}
              address={address}
              serviceType={type.label}
              cleanType={service.label}
              price={price} // Pass calculated price to PDF
            />
          )}
          <button
            className="default-btn"
            style={{ minWidth: 150 }}
            disabled={submitted}
          >
            Få offert <span></span>
          </button>
        </div>
      </form>
    </div>
  );
}
