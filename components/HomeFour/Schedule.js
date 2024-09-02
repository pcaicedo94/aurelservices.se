"use Client";
import React from "react";
import Calendar from "./Calendar";
import { cumple } from "./cumple";


const Schedule = () => {
  return (
    <>
      <div className="pricing-area pt-100 pb-70">
        <Calendar data={cumple} />
      </div>
    </>
  );
};

export default Schedule;
