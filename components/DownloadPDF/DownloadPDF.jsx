import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function DownloadPDF(props) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { serviceType, cleanType, size, address, price } = props;
      const doc = new jsPDF();
      function generate() {
        const head = [["Service type", "Clean type", "Address", "Size", "Price"]];

        const body = [[serviceType, cleanType, address, size, price]];

        doc.text("Aurelservice", 85, 10);
        doc.autoTable({ head: head, body: body, theme: "grid" });

        doc.save("Aurelservice.pdf");
      }
      generate();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <button
      className="default-btn-one"
      onClick={handleSubmit}
      style={{ margin: 0, border: "1px solid #34a783" }}
    >
      Download
      <span></span>
    </button>
  );
}