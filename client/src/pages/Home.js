import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaGithub, FaLinkedin, FaDownload, FaRocket } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import "./Home.css";
import AOS from "aos";
import "aos/dist/aos.css";
import Lenis from "lenis";
import SpaceBackground from "../components/spacebackground";


const skills = [
  "REST APIs",
  "Bootstrap",
  "Git",
  "JWT Authentication",
  "Responsive Web Design",
  "Full-Stack Development",
];

const highlights = [
  { label: "Experience Focus", value: "MERN + UI Systems" },
  { label: "Delivery Style", value: "Clean, Fast, Scalable" },
  { label: "Availability", value: "Open to Hiring" },
];

const fallbackProjects = [
  {
    title: "Taskiva Service Platform",
    image: "taskiva3.png",
    desc: "On-demand service marketplace with role-based flows and polished UX.",
    link: "https://task-iva.netlify.app/",
    stack: "React | APIs | UX",
  },
  {
    title: "IlmKosh Book Platform",
    image: "project3.png",
    desc: "MERN-based reading and upload platform with a clean and scalable interface.",
    link: "https://ilm-kosh.netlify.app/",
    stack: "MERN | MongoDB | Auth",
  },
];

const loadCachedProjects = () => {
  try {
    const cachedProjects = JSON.parse(
      window.localStorage.getItem("portfolioProjects") || "[]"
    );
    return Array.isArray(cachedProjects) && cachedProjects.length
      ? cachedProjects
      : fallbackProjects;
  } catch (error) {
    return fallbackProjects;
  }
};

const Home = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState(loadCachedProjects);
  const [resume, setResume] = useState({
    url: "/cv.pdf",
    name: "Gurdeep-Singh-Resume.pdf",
  });
const [darkMode, setDarkMode] = useState(
  () => localStorage.getItem("theme") === "dark"
);

useEffect(() => {
  localStorage.setItem("theme", darkMode ? "dark" : "light");

  document.body.className = darkMode
    ? "dark-theme"
    : "light-theme";
}, [darkMode]);
  useEffect(() => {
    AOS.init({
      duration: 800,
        once: false,
        mirror: true,
      offset: 120,
      easing: "ease-out-cubic",
    });
  }, []);
useEffect(() => {
  const lenis = new Lenis({
    duration: 2,
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return () => lenis.destroy();
}, []);


  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const [projectsResponse, settingsResponse] = await Promise.all([
          axios.get("https://portfolio-quwt.onrender.com/api/projects"),
          axios.get("https://portfolio-quwt.onrender.com/api/settings"),
        ]);

        if (projectsResponse.data.length) {
          setProjects(projectsResponse.data);
          window.localStorage.setItem(
            "portfolioProjects",
            JSON.stringify(projectsResponse.data)
          );
        }

        if (settingsResponse.data.resume) {
          setResume({
            url: settingsResponse.data.resume,
            name: settingsResponse.data.resumeName || "resume.pdf",
          });
        }
      } catch (error) {
        console.warn("Using local portfolio content because the API is unavailable.");
      }
    };

    loadPortfolioData();
  }, []);

  useEffect(() => {
    const visitKey = "portfolioVisitCounted";
    if (window.sessionStorage.getItem(visitKey)) return;

    window.sessionStorage.setItem(visitKey, "true");
    axios.post("https://portfolio-quwt.onrender.com/api/visits").catch(() => {
      window.sessionStorage.removeItem(visitKey);
    });
  }, []);

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const response = await axios.post("https://portfolio-quwt.onrender.com/api/contact", formData);
      setStatus({ type: "success", text: response.data.message });
      setFormData({ fullName: "", email: "", company: "", message: "" });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to send message right now. Please try again.";
      setStatus({ type: "error", text: message });
    } finally {
      setIsSubmitting(false);
    }
  };
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  return (
    <>
      <SpaceBackground />

      <div className={`page ${darkMode ? "dark-theme" : "light-theme"}`}>
        <div className="navbar-wrap">
          <header className={`navbar ${darkMode ? "dark-theme" : "light-theme"}`}>

            <div className="brand">Gurdeep Singh</div>

            <button
              data-aos="fade-left"
              data-aos-delay="1000"
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <img src="/lightmode.svg" alt="Light Mode" />
              ) : (
                <img src="/darkmode.svg" alt="Dark Mode" />
              )}
            </button>

            <nav className={`nav-links ${isNavOpen ? "open" : ""}`}>
              <a
                data-aos="fade-left"
                data-aos-delay="1100"
                href="#home"
                onClick={() => setIsNavOpen(false)}
              >
                Home
              </a>

              <a
                data-aos="fade-left"
                data-aos-delay="1200"
                href="#skills"
                onClick={() => setIsNavOpen(false)}
              >
                Skills
              </a>

              <a
                data-aos="fade-left"
                data-aos-delay="1300"
                href="#projects"
                onClick={() => setIsNavOpen(false)}
              >
                Projects
              </a>

              <a
                data-aos="fade-left"
                data-aos-delay="1400"
                href="#contact"
                onClick={() => setIsNavOpen(false)}
              >
                Contact
              </a>
            </nav>

            <button
              className="menu-btn"
              onClick={() => setIsNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {isNavOpen ? <FiX /> : <FiMenu />}
            </button>

          </header>
        </div>
      

      <main>
       
          <div id="home" data-aos="fade-left"   className="hero-layout">
            <div className="hero-main">
              <p  className="tagline">MERN Stack Developer</p>
              <h1 >Building high-performance web products for modern teams.</h1>
              <p  className="intro">
                I design and ship full-stack applications with strong architecture,
                smooth UX, and production-focused quality.
              </p>
              <div className="cta-row">
                <a href={resume.url} download={resume.name} className="btn btn-primary">
                  <FaDownload /> Download CV
                </a>
                <a href="#contact" className="btn btn-secondary">
                  <FaRocket /> Hire Me
                </a>
              </div>
              <div className="socials">
                <a
                  href="https://github.com/Gurdeep082"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub />
                </a>
                <a 
                  href="https://www.linkedin.com/in/gurdeep-singh03/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </a>
              </div>
            </div>
            <aside className="hero-panel">
                {highlights.map((item) => (
              <article
                key={item.label}
                className="hero-panel-item"

              >
                <p>{item.label}</p>
                <h3>{item.value}</h3>
              </article>
            ))}
            </aside>
          </div>
       

        
          <div data-aos="fade-up" id="skills"  className="section-head">
            <p>Tech Arsenal</p>
            <span />
          </div>
          <h2 data-aos="fade-up">Core Stack</h2>
          <div className="skills" >
            <div data-aos="fade-left" data-aos-delay="100" className="skill-cards">
              <img src="/MongoDB.png" alt="mongo"/>
            <h3>MongoDB</h3>
            </div>
            <div data-aos={isMobile ? "fade-right" : "fade-left"} data-aos-delay="500" className="skill-cards">
              <img src="/expressjs.svg" alt="exress"/>
            <h3>Express Js</h3>
            </div >
                        <div data-aos="fade-left" data-aos-delay="1000" className="skill-cards">
              <img src="/reactjs.svg" alt="react"/>
            <h3>React Js</h3>
            </div>
            <div data-aos={isMobile ? "fade-right" : "fade-left"} data-aos-delay="1500" className="skill-cards">
              <img src="/nodejs.svg" alt="node"/>
            <h3>Node Js</h3>
            </div>
                        
            <div data-aos="fade-left" data-aos-delay="100" className="skill-cards">
              <img src="/javascript.svg" alt="node"/>
            <h3>JavaScript</h3>
            </div>            
            <div data-aos={isMobile ? "fade-right" : "fade-left"} data-aos-delay="500" className="skill-cards">
              <img src="/github.svg" alt="node"/>
            <h3>GitHub</h3>
            </div>            
            <div data-aos="fade-left" data-aos-delay="1000" className="skill-cards">
              <img src="/tailwind.svg" alt="node"/>
            <h3>Tailwing CSS</h3>
            </div>            
            <div data-aos={isMobile ? "fade-right" : "fade-left"} data-aos-delay="1500" className="skill-cards">
              <img src="/python.svg" alt="node"/>
            <h3>Python</h3>
            </div>

          </div>
          <div className="skills-grid">
            {skills.map((skill) => (
              <article data-aos="fade-up" data-aos-delay="7000"  key={skill} className="glass-card hover-up">
                <h3 >{skill}</h3>
              </article>
            ))}
          </div>
      

        <section data-aos="fade-up" data-aos-delay="7000" id="projects" className="card-section">
          <div className="section-head">
            <p data-aos="fade-up">Latest Work</p>
            <span />
          </div>
          <h2>Featured Projects</h2>
          <div className="projects-grid">
            {projects.map((project , index) => (
              <article data-aos="flip-right" data-aos-delay={index * 1000}  key={project.title} className="project-card hover-up">
                <img src={project.image} alt={project.title} />
                <div className="project-body">
                  <span className="project-pill">{project.stack}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description || project.desc}</p>
                  <a href={project.link} target="_blank" rel="noreferrer">
                    View Project
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section data-aos="fade-up" id="contact" className="contact-section" >
        <div className="contact-wrap ">
          <div data-aos="fade-right" data-aos-delay="500" className="contact-copy">
                      <div className="section-head">
              <p>Contact</p>
              <span />
            </div>
            <h2>Let us discuss your next product</h2>
            <p>
              Share your requirement and timeline. I will reply quickly with a
              clear action plan.
            </p>
          
          <form data-aos="fade-right" data-aos-delay="500" className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={onInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Work Email"
              value={formData.email}
              onChange={onInputChange}
              required
            />
            <input
              type="text"
              name="company"
              placeholder="Company Name"
              value={formData.company}
              onChange={onInputChange}
            />
            <textarea
              name="message"
              placeholder="Tell me about the role or project..."
              value={formData.message}
              onChange={onInputChange}
              rows="5"
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
            {status.text && (
              <p className={`status ${status.type}`}>{status.text}</p>
            )}
          </form>
          </div>
        </div>
        <div className="chat" data-aos="fade-left" data-aos-delay="500">
          <img src="/chat.svg" alt="chat"/>
        </div>

          
        </section>

      </main>
            <div className={`footer-bottom ${darkMode ? "dark-theme" : "light-theme"}`}>
        <p>
          © {new Date().getFullYear()} Gurdeep Singh. All Rights Reserved.
        </p>

        <div className={`footer-links ${darkMode ? "dark-theme" : "light-theme"}`}>
          <a
            href="https://instagram.com/_gurdeep03_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <img src="/instagram.svg" alt="Instagram" />
          </a>

          <a
            href="https://www.linkedin.com/in/gurdeep-singh03/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <img src="/linkedin.svg" alt="LinkedIn" />
          </a>
        </div>
      </div>
    </div>

          
        </>
  );
};

export default Home;
