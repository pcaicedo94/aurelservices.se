import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function DownloadPDF(props) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { size, address } = props;
      const doc = new jsPDF();
      function generate() {
        const head = [["Address", "Size"]];

        const body = [[address, size]];

        doc.text("Aurelservice", 85, 10);
        doc.autoTable({ head: head, body: body });

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
