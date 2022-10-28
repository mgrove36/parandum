import { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import NavBar from "./NavBar";

const PlatformDisabled = (props) => {
	useEffect(() => {
    if (props.page) {
      props.page.load();
      return () => props.page.unload();
    }
    if (props.logEvent) props.logEvent("page_view");
  }, [props, props.logEvent, props.page]);
  return (
    <>
      <NavBar items={[]} />

      <main>
        <div className="description-section">
          <h1>Your access to Parandum has been temporarily disabled</h1>
          <p>
            Apologies, but due to unpaid invoices by <Link to={{pathname: "https://reading-school.co.uk"}} target="_blank">Reading School</Link> you
            are currently unable to access this platform. Please contact Mr M Cooper at{" "}
            <Link to={{pathname: "mailto:mcooper@reading-school.co.uk"}} target="_blank">mcooper@reading-school.co.uk</Link> and{" "}
            <Link to={{pathname: "mailto:finance@reading-school.co.uk"}} target="_blank">finance@reading-school.co.uk</Link> to regain access. If
            you are a student at Reading School, please also discuss this with your language teacher.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};
 
export default PlatformDisabled;