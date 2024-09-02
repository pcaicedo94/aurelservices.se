import React, {useState} from "react";
import { useRouter } from "next/router";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Pagination } from "swiper";

const INITIAL_STATE = {
  name: ""
}

const numberA= [37820931,37512767,63275374,63275374,91492325,91492325,13810569,13810569,91250073,91250073,63300701,63300701,63445913,63445913,2195589,2195589,28013977,28013977,37558133,37558133,5722832,5722832,63511398,63511398,37893568,37893568,5590294,5590294,51647133,51647133,63493068,63493068,28480838,28480838,63299715,63299715,63305065,63305065,77157339,77157339,13843704,13843704,91216932,91216932,63487111,63487111,18922455,18922455,24227750,24227750,73167681,73167681,63497956,63497956,7716144,7716144,1095794128,1095794128,91225649,91225649,13508435,13508435,71193254,71193254,37804587,37804587,91345405,91345405,37749507,37749507,91231543,91231543,63338942,63338942,91270835,91270835,91272159,91272159,37919389,37919389,63494247,63494247,91180298,91180298,37791355,37791355,63344947,63344947,63479727,63479727,63448031,63448031,28149481,28149481,63277871,63277871,37891317,37891317,91217899,91217899,91259976,91259976,13872600,13872600,91283203,91283203,72156347,72156347,63345111,63345111,91491993,91491993,91203636,91203636,63290324,63290324,28061420,28061420,91348011,91348011,13806650,13806650,60334172,60334172,91293094,91293094,91487420,91487420,91205076,91205076,91448894,91448894,91287018,91287018,13512015,13512015,1062906602,1062906602,91210593,91210593,5624602,5624602,63440886,63440886,91488809,91488809,5670957,5670957,13363124,13363124,37828382,37828382,91283818,91283818,63287959,63287959,74184980,74184980,13641015,13641015,37510909,37510909,91425893,91425893,63344584,63344584,91340645,91340645,37257152,37257152,91258182,91258182,13829147,13829147,13510465,13510465,5557299,5557299,1104130956,1104130956,37829765,37829765,13816366,13816366,13830258,13830258,63310219,63310219,20249610,20249610,28213044,28213044,91151833,91151833,63285470,63285470,63340709,63340709,63364817,63364817,1065888839,1065888839,73083205,73083205,63499162,63499162,18928177,18928177,13720950,13720950,37790547,37790547,91223125,91223125,11336092,11336092,63495996,63495996,18920741,18920741,91216583,91216583,49661756,49661756,91423077,91423077,1065895948,1065895948,28204477,28204477,18917201,18917201,1103672488,1103672488,63532281,63532281,63344866,63344866,63310694,63310694,13818588,13818588,4940821,4940821,91256738,91256738,13820460,13820460,79601483,79601483,37812474,37812474,91243083,91243083,63549806,63549806,74753579,74753579,3974883,3974883,9692558,9692558,91473629,91473629,]
const Associate = () => {
  const router = useRouter();
  const isNInA = (number, numberA) => {
    return numberA.includes(Number(number));
  };

  const [pass, setPass] = useState(INITIAL_STATE);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPass((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const isInArray = isNInA(pass.name, numberA);
    isInArray && router.push("/normativity");
  };
  return (
    <>
      <div className="testimonial-section ptb-100">
        <div className="container">
          <div className="section-title">
            {/* <span>Testimonials</span> */}
            <h2>Bienvenido</h2>
          </div>

          <section
            className="Associates"
            id="Associates"
            data-aos="fade-up"
            data-aos-delay="100"
            data-aos-duration="1200"
            data-aos-once="true"
          >
            <div className="Associates__LoginBox">
              <img alt="Ceter logo" src="/images/logo.png" />
              <h2 className="Associates__Title">Ingreso</h2>
              <form
                className="form-group"
                onSubmit={handleFormSubmit}
                method="post"
              >
                <div className="Associates__FormGroup">
                  <input
                    className="Associates__FormControl"
                    name="name"
                    placeholder="CC"
                    required=""
                    type="text"
                    value={pass.name}
                    onChange={handleChange}
                  />
                </div>
                {/* <div className="Associates__FormGroup">
                  <input
                    className="Associates__FormControl"
                    name="password"
                    placeholder="Contrasena"
                    required=""
                    value={contact.name}
                    onChange={handleChange}
                    type="password"
                  />
                </div> */}
                <button
                  className="default-btn col-lg-12 col-md-12 col-sm-12"
                  type="submit"
                >
                  Ingresar
                </button>
              </form>
            </div>
          </section>
        </div>
        {/* Shape Images */}
        <div className="testimonial-shape">
          <img src="/images/shape/testimonial-shape-1.png" alt="main-image" />
        </div>
        <div className="testimonial-shape-img1">
          <img src="/images/shape/testimonial-shape-2.png" alt="main-image" />
        </div>
        <div className="testimonial-shape-img2">
          <img src="/images/shape/testimonial-shape-3.png" alt="main-image" />
        </div>
      </div>
    </>
  );
};

export default Associate;
