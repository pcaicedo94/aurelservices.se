import { useState } from "react";
import baseUrl from "../../utils/baseUrl";
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

    if (selectedPriceList) {
      const matchedPrice = selectedPriceList.find(
        (item) => userSize >= item.range[0] && userSize <= item.range[1]
      );
      console.log("Matched Price:", matchedPrice);
      setPrice(matchedPrice ? matchedPrice.price : 0);
    } else {
      setPrice(0); // Default to 0 if no match is found
    }
  };

  const saveDataOnTurso = async () => {
    const payload = {
      service_type: type.value,
      clean_type: service.value,
      address,
      email: clientEmail,
      size,
      price, // Include calculated price
    };
    const response = await fetch(baseUrl + `/api/form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
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
    calculatePrice(); // Calculate price before submission
    setSubmitted(true);
    try {
      await saveDataOnTurso();

      // SEND EMAIL
      const url = `${baseUrl}/api/contact`;
      const payload = {
        size,
        address,
        clientEmail,
        serviceType: type.label,
        cleanType: service.label,
        price, // Include calculated price
      };
      const response = await axios.post(url, payload);
      console.log(response);
    } catch (error) {
      console.log(error);
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
          <div style={{ color: "#34a783" }}>Sended successfully</div>
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
            Ask <span></span>
          </button>
        </div>
      </form>
    </div>
  );
}
