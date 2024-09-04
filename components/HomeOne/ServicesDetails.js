import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

const ServicesDetails = () => {
  const tabs = [
    "Bygg, etableringsstädning, bodstädningar och renoveringar",
    "Kontorstädning",
    "Trappstädning",
    "Snöröjning och plogning",
    "Hemstädning  Flyttstädning  Storstädning ",
    "Fönsterputsning",
    "Trädgårdsskötsel",
  ];
  return (
    <>
      <div
        className=" tab-section ptb-100"
        // style={{
        //   background:
        //     "linear-gradient( to bottom, #5249d6, #5674dc, #fffff0, #fffff0, #ffffe0 )",
        // }}
      >
        <div className="container">
          <div className="solutions-list-tab">
            <Tabs>
              <TabList>
                {tabs.map((value) => (
                  <Tab
                    data-aos="fade-up"
                    data-aos-delay="100"
                    data-aos-duration="1200"
                    data-aos-once="true"
                    style={{
                      padding: "10px",
                      display: "flex",
                      placeContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {value}
                  </Tab>
                ))}
              </TabList>

              <TabPanel>
                <div
                  className="row align-tems-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Bygg, etableringsstädning, bodstädningar och renoveringar</h3>
                      <p>
                      Vad som ingår i en byggstädning varierar från fall till fall. 
                      Vi utför det mesta inom byggstäd såsom grovstäd, avtäckning, fönsterputs och slutstäd. 
                      
                      Vi anpassar oss alltid efter dina önskemål och erbjuder en rad olika kringtjänster vid behov.
                     Vi utför byggstädning både för privatpersoner och också företag i Stockholm.

                    Etableringsstädningen håller byggbodarna med kontor, fikarum och omklädningsrum i fint skick. 
                    Vi finns tillhands under hela processen och sköter gärna logistiken kring byggsoporna. 
                      </p>

                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associate/bodar-lambert.jpg" alt="bygg" />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-5">
                    <div className="tab-image-left">
                      <img src="/images/cover1.jpg" alt="kontor" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Kontorstädning</h3>
                      <p>
                      En trivsam arbetsplats är avgörande för produktivitet. 
                      Aurel Städ AB erbjuder skräddarsydd kontorsstädning 
                      för att skapa en ren och inspirerande arbetsmiljö. 
                      Vi anpassar städningen efter dina behov och rekommenderar 
                      det bästa upplägget för att säkerställa nöjda medarbetare och effektivt arbete.
                      </p>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Trappstädning</h3>
                      <p>
                      Aurel Städ erbjuder regelbunden trappstädning 
                      för fastighetsägare och bostadsrättsföreningar i Stockholm, 
                      vilket säkerställer en ren och behaglig miljö i era trapphus. 
                      Kontakta oss för att diskutera hur vi kan hjälpa er med trappstädning!
                      </p>
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associate/trappstädning.jpg" alt="trappstädning" />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-5">
                    <div className="tab-image-left">
                      <img src="/images/associate/aurel 4.jpg" alt="snöröjning" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Snöröjning och plogning</h3>
                      <p>
                      Vi erbjuder snöröjning och plogning i Stockholmsområdet, 
                      från uppfarter och gångvägar till större områden och tak. 
                      Våra tjänster passar både privatpersoner och företag. 
                      Kontakta oss för professionell snöröjning i Stockholm.
                      </p>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Hemstädning  Flyttstädning  Storstädning</h3>
                      <p>
                      Perfekt för en grundlig uppfräschning av ditt hem. 
                      Vår storstädning ger ett rent resultat, oavsett om 
                      det är inför en händelse eller för en nystart.
                      Gör din flytt stressfri med vår flyttstädning. 
                      Vi rengör grundligt din gamla eller nya bostad, så att du kan fokusera på din nya början.
                      Njut av ett prydligt hem med vår hemstädning. 
                      Våra professionella städare anpassar sig efter dina behov och ser till att varje hörn skiner. 
                      Luta dig tillbaka, vi sköter resten.
                      </p>

                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/hem.jpg" alt="hem" />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-5">
                    <div className="tab-image-left">
                      <img src="/images/associate/window.jpeg" alt="window" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Fönsterputsning</h3>
                      <p>
                      Trött på att kika ut genom smutsiga fönster? 
                      Kanske har du varken tid eller energi att lägga ner 
                      det arbete som behövs för fönsterputsning? 
                      Eller känner du att resultatet inte blir tillfredsställande när du putsar själv? 
                      Låt våra skickliga fönsterputsare ta hand om det åt dig och njut av att se solen stråla genom rutorna igen!
                      Vi klarar av att putsa även under vintern (ner till -10 grader). 
                      Personalen har försäkring och vi har en ansvarsförsäkring som täcker eventuella skador. 
                      Kontakta oss utan att tveka om du vill att dina fönster ska skina igen!
                      </p>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-5">
                    <div className="tab-image-left">
                      <img src="/images/page-title-bg.jpg" alt="garden" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Trädgårdsskötsel</h3>
                      <p>
                      En trädgård är mer än bara gräs och rabatter, den kan bli ett eget rum som harmoniserar 
                      med huset och omgivande natur. Vi står till tjänst med trädgårdsdesign i Stockholm 
                      och närliggande områden för privatpersoner, företag och bostadsrättsföreningar. 
                      Vi tar ansvar för hela processen från planering till färdigställande, i nära samarbete med dig som kund. 
                      Efter avslutat projekt erbjuder vi även avtal för skötsel och underhåll av din nya trädgård. 
                      Ta det första steget mot en fantastisk trädgård redan idag genom att kontakta oss!
                      </p>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesDetails;
