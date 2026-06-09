import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaGithub, FaLinkedin, FaDownload, FaRocket } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import "./Home.css";

const skills = [
  "JavaScript",
  "React.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "REST APIs",
  "Tailwind CSS",
  "Bootstrap",
  "Git",
  "GitHub",
  "JWT Authentication",
  "Mongoose",
  "Responsive Web Design",
  "MongoDB Atlas",
  "Postman",
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
  const stars = Array.from({ length: 36 });
  const streaks = Array.from({ length: 8 });

  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const [projectsResponse, settingsResponse] = await Promise.all([
          axios.get("/api/projects"),
          axios.get("/api/settings"),
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
    axios.post("/api/visits").catch(() => {
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
      const response = await axios.post("/api/contact", formData);
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

  return (
    <div className="page">
      <div className="space-grid" />
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="starfield">
        {stars.map((_, index) => (
          <span key={`star-${index}`} className="star" />
        ))}
      </div>
      <div className="streak-layer">
        {streaks.map((_, index) => (
          <span key={`streak-${index}`} className="streak" />
        ))}
      </div>

      <header className="navbar">
        <div className="brand">Gurdeep Singh</div>
        <button
          className="menu-btn"
          onClick={() => setIsNavOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {isNavOpen ? <FiX /> : <FiMenu />}
        </button>
        <nav className={`nav-links ${isNavOpen ? "open" : ""}`}>
          <a href="#home" onClick={() => setIsNavOpen(false)}>
            Home
          </a>
          <a href="#skills" onClick={() => setIsNavOpen(false)}>
            Skills
          </a>
          <a href="#projects" onClick={() => setIsNavOpen(false)}>
            Projects
          </a>
          <a href="#contact" onClick={() => setIsNavOpen(false)}>
            Contact
          </a>
        </nav>
      </header>

      <main>
        <section id="home" className="hero reveal">
          <div className="hero-layout">
            <div className="hero-main">
              <p className="tagline">MERN Stack Developer</p>
              <h1>Building high-performance web products for modern teams.</h1>
              <p className="intro">
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
                <article key={item.label} className="hero-panel-item">
                  <p>{item.label}</p>
                  <h3>{item.value}</h3>
                </article>
              ))}
            </aside>
          </div>
        </section>

        <section id="skills" className="card-section reveal">
          <div className="section-head">
            <p>Tech Arsenal</p>
            <span />
          </div>
          <h2>Core Stack</h2>
          <div className="skills-grid">
            {skills.map((skill) => (
              <article key={skill} className="glass-card hover-up">
                <h3>{skill}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className="card-section reveal">
          <div className="section-head">
            <p>Latest Work</p>
            <span />
          </div>
          <h2>Featured Projects</h2>
          <div className="projects-grid">
            {projects.map((project) => (
              <article key={project.title} className="project-card hover-up">
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

        <section id="contact" className="contact-wrap reveal">
          <div className="contact-copy">
            <div className="section-head">
              <p>Contact</p>
              <span />
            </div>
            <h2>Let us discuss your next product</h2>
            <p>
              Share your requirement and timeline. I will reply quickly with a
              clear action plan.
            </p>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
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
        </section>
      </main>
    </div>
  );
};

export default Home;
