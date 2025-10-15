import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);
import baseUrl from "../../utils/baseUrl";
import Chatbot from "../ChatBot/Chatbot";

const alertContent = () => {
  MySwal.fire({
    title: "Felicitaciones!",
    text: "Tu mensaje fue enviado exitosamente y pronto le responderemos ",
    icon: "success",
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

// Form initial state
const INITIAL_STATE = {
  name: "",
  email: "",
  number: "",
  subject: "",
  text: "",
};

const ContactForm = () => {
  const [contact, setContact] = useState(INITIAL_STATE);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `${baseUrl}/api/contact`;
      const { name, email, number, subject, text } = contact;
      const payload = { name, email, number, subject, text };
      const response = await axios.post(url, payload);
      // console.log(response);
      setContact(INITIAL_STATE);
      alertContent();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="contact-section ptb-50">
      <div className="container">
        <div className="about-content">
          <h2>Hör av dig!</h2>
          <p className="pb-100">
          Låt oss ta hand om städningen så att du kan fokusera på 
          det som verkligen betyder något. Kontakta oss idag för att 
          begära en offert eller boka en konsultation. Vi är här 
          för att hjälpa dig att hålla ditt utrymme fläckfritt!
          </p>
        </div>
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="contact-image">
              <img src="/images/contact.png" alt="image" />
            </div>
          </div>

          <div className="col-lg-6">
            <div className="contact-form">
            


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
