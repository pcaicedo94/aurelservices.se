import React from "react";

const ComingSoon = () => {
  const [days, setDays] = React.useState("");
  const [hours, setHours] = React.useState("");
  const [minutes, setMinutes] = React.useState("");
  const [seconds, setSeconds] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      commingSoonTime();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const commingSoonTime = () => {
    let endTime = new Date("August 23, 2023 17:00:00 PDT");
    let endTimeParse = Date.parse(endTime) / 1000;
    let now = new Date();
    let nowParse = Date.parse(now) / 1000;
    let timeLeft = endTimeParse - nowParse;
    let days = Math.floor(timeLeft / 86400);
    let hours = Math.floor((timeLeft - days * 86400) / 3600);
    let minutes = Math.floor((timeLeft - days * 86400 - hours * 3600) / 60);
    let seconds = Math.floor(
      timeLeft - days * 86400 - hours * 3600 - minutes * 60
    );
    if (hours < "10") {
      hours = "0" + hours;
    }
    if (minutes < "10") {
      minutes = "0" + minutes;
    }
    if (seconds < "10") {
      seconds = "0" + seconds;
    }
    setDays(days);
    setHours(hours);
    setMinutes(minutes);
    setSeconds(seconds);
  };

  return (
    <>
      <div className="coming-soon-area">
        <div className="d-table">
          <div className="d-table-cell">
            <div className="container">
              <div className="coming-soon-content">
                <h1>Our website is coming soon</h1>
                <p>
                  Our website is currently undergoing scheduled maintenance. We
                  Should be back shortly. Thank you for your patience.
                </p>

                <form onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="email-input"
                    placeholder="Enter your email"
                  />
                  <button type="submit" className="submit-btn">
                    Submit
                  </button>
                </form>

                <div id="timer">
                  <div id="days">
                    {days} <span className="days">Days</span>
                  </div>
                  <div id="hours">
                    {hours} <span className="hours">Hours</span>
                  </div>
                  <div id="minutes">
                    {minutes} <span className="minutes">Minutes</span>
                  </div>
                  <div id="seconds">
                    {seconds} <span className="seconds">Seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="social-list">
          <li className="list-heading">Follow us for update:</li>
          <li>
            <a
              href="https://www.facebook.com/"
              className="facebook"
              target="_blank"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
          </li>
          <li>
            <a href="https://twitter.com/" className="twitter" target="_blank">
              <i className="fab fa-twitter"></i>
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/"
              className="linkedin"
              target="_blank"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
          </li>
          <li>
            <a
              href="https://www.instagram.com/"
              className="instagram"
              target="_blank"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default ComingSoon;
