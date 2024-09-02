import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import Image from "next/image";
const Calendar = ({ data }) => {
  const [duration, setDuration] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDuration(false);
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="calendar">
      {Object.keys(data).map((mes, index) => (
        <div key={index} className="flip-card">
          <div className="flip-card-inner">
            <div className="thecard">
              <div className="thefront">
                <Image
                  width="300"
                  height="450"
                  src="/images/withluxury.png"
                  className="borderRadius"
                />
                <h1>{mes.toUpperCase()}</h1>
              </div>
              <div className="theback">
                <table>
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data[mes].map((item, i) => (
                      <tr key={i}>
                        <td>{item.day}</td>
                        <td>{item.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ))}
      {duration && <Confetti />}
    </div>
  );
};

export default Calendar;
