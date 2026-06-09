import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaFilePdf,
  FaFolderPlus,
  FaInbox,
} from "react-icons/fa";
import "./Admin.css";

const emptyProject = {
  title: "",
  description: "",
  stack: "",
  link: "",
  image: "",
};

const cacheProjects = (projects) => {
  window.localStorage.setItem("portfolioProjects", JSON.stringify(projects));
};

const readFile = (file, maxSizeMb) =>
  new Promise((resolve, reject) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      reject(new Error(`File must be smaller than ${maxSizeMb} MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

const Admin = () => {
  const [adminKey, setAdminKey] = useState(
    () => window.localStorage.getItem("portfolioAdminKey") || ""
  );
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [project, setProject] = useState(emptyProject);
  const [resumeFile, setResumeFile] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isBusy, setIsBusy] = useState(false);
  const isDashboardOpen = Boolean(dashboard);

  const adminConfig = { headers: { "x-admin-key": adminKey } };

  const showError = (error) => {
    setStatus({
      type: "error",
      text: error.response?.data?.message || error.message || "Something went wrong.",
    });
  };

  const loadDashboard = async () => {
    setIsBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await axios.get("https://portfolio-quwt.onrender.com/api/admin/dashboard", adminConfig);
      window.localStorage.setItem("portfolioAdminKey", adminKey);
      cacheProjects(response.data.projects);
      setDashboard(response.data);
    } catch (error) {
      showError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const onProjectChange = (event) => {
    const { name, value } = event.target;
    setProject((current) => ({ ...current, [name]: value }));
  };

  const onImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", text: "Please select an image file." });
      return;
    }

    try {
      const image = await readFile(file, 4);
      setProject((current) => ({ ...current, image }));
      setStatus({ type: "success", text: "Project image is ready." });
    } catch (error) {
      showError(error);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const response = await axios.post("https://portfolio-quwt.onrender.com/api/admin/projects", project, adminConfig);
      setDashboard((current) => {
        const projects = [response.data, ...current.projects];
        cacheProjects(projects);
        return { ...current, projects };
      });
      setProject(emptyProject);
      event.target.reset();
      setStatus({ type: "success", text: "Project published successfully." });
    } catch (error) {
      showError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!resumeFile) return;

    setIsBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const resume = await readFile(resumeFile, 6);
      await axios.put(
        "https://portfolio-quwt.onrender.com/api/admin/resume",
        { resume, resumeName: resumeFile.name },
        adminConfig
      );
      setDashboard((current) => ({
        ...current,
        settings: {
          ...current.settings,
          resume,
          resumeName: resumeFile.name,
        },
      }));
      setResumeFile(null);
      event.target.reset();
      setStatus({ type: "success", text: "Resume updated successfully." });
    } catch (error) {
      showError(error);
    } finally {
      setIsBusy(false);
    }
  };

  const removeItem = async (type, id) => {
    setIsBusy(true);
    setStatus({ type: "", text: "" });
    try {
      await axios.delete(`https://portfolio-quwt.onrender.com/api/admin/${type}/${id}`, adminConfig);
      setDashboard((current) => {
        const items = current[type].filter((item) => item._id !== id);
        if (type === "projects") cacheProjects(items);
        return { ...current, [type]: items };
      });
      setStatus({ type: "success", text: "Item deleted." });
    } catch (error) {
      showError(error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!isDashboardOpen || !adminKey) return undefined;

    const eventSource = new EventSource(
      `https://portfolio-quwt.onrender.com/api/admin/events?key=${encodeURIComponent(adminKey)}`
    );

    const addUniqueItem = (items, item) => {
      if (items.some((current) => current._id === item._id)) return items;
      return [item, ...items];
    };

    const onVisit = (event) => {
      const { visitCount } = JSON.parse(event.data);
      setDashboard((current) => ({
        ...current,
        settings: { ...current.settings, visitCount },
      }));
    };

    const onMessageCreated = (event) => {
      const message = JSON.parse(event.data);

      setDashboard((current) => ({
        ...current,
        messages: addUniqueItem(current.messages, message),
      }));

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("New Portfolio Message", {
          body: `${message.fullName} sent a message`,
          icon: "/icon-192.png",
        });
      }
    };

    const onMessageDeleted = (event) => {
      const { id } = JSON.parse(event.data);
      setDashboard((current) => ({
        ...current,
        messages: current.messages.filter((item) => item._id !== id),
      }));
    };

    const onProjectCreated = (event) => {
      const projectItem = JSON.parse(event.data);
      setDashboard((current) => {
        const projects = addUniqueItem(current.projects, projectItem);
        cacheProjects(projects);
        return { ...current, projects };
      });
    };

    const onProjectDeleted = (event) => {
      const { id } = JSON.parse(event.data);
      setDashboard((current) => {
        const projects = current.projects.filter((item) => item._id !== id);
        cacheProjects(projects);
        return { ...current, projects };
      });
    };

    const onResumeUpdated = (event) => {
      const { resumeName } = JSON.parse(event.data);
      setDashboard((current) => ({
        ...current,
        settings: { ...current.settings, resumeName },
      }));
    };

    eventSource.addEventListener("visit", onVisit);
    eventSource.addEventListener("message-created", onMessageCreated);
    eventSource.addEventListener("message-deleted", onMessageDeleted);
    eventSource.addEventListener("project-created", onProjectCreated);
    eventSource.addEventListener("project-deleted", onProjectDeleted);
    eventSource.addEventListener("resume-updated", onResumeUpdated);

    return () => eventSource.close();
  }, [adminKey, isDashboardOpen]);

  if (!dashboard) {
    return (
      <main className="admin-login">
        <section className="admin-login-card">
          <p className="admin-eyebrow">Portfolio Control Room</p>
          <h1>Admin Dashboard</h1>
          <p>Enter the private key configured as ADMIN_KEY on your server.</p>
          <div className="admin-password-field">
            <input
              type={showAdminKey ? "text" : "password"}
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Admin key"
              onKeyDown={(event) => event.key === "Enter" && loadDashboard()}
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowAdminKey((current) => !current)}
              aria-label={showAdminKey ? "Hide admin key" : "Show admin key"}
              aria-pressed={showAdminKey}
            >
              {showAdminKey ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button onClick={loadDashboard} disabled={!adminKey || isBusy}>
            {isBusy ? "Opening..." : "Open Dashboard"}
          </button>
          {status.text && <p className={`admin-status ${status.type}`}>{status.text}</p>}
          <a href="/"><FaArrowLeft /> Back to portfolio</a>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Portfolio Control Room</p>
          <h1>Admin Dashboard</h1>
        </div>
        <a href="/"><FaArrowLeft /> View portfolio</a>
      </header>

      <section className="admin-stats">
        <article><strong>{dashboard.projects.length}</strong><span>Projects</span></article>
        <article><strong>{dashboard.messages.length}</strong><span>Messages</span></article>
        <article><strong>{dashboard.settings.resume ? "Yes" : "No"}</strong><span>Custom resume</span></article>
        <article><strong>{dashboard.settings.visitCount || 0}</strong><span>Website visits</span></article>
      </section>

      {status.text && <p className={`admin-status ${status.type}`}>{status.text}</p>}

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-title"><FaFolderPlus /><h2>Add Project</h2></div>
          <form onSubmit={createProject} className="admin-form">
            <input name="title" value={project.title} onChange={onProjectChange} placeholder="Project title" required />
            <textarea name="description" value={project.description} onChange={onProjectChange} placeholder="Project description" rows="4" required />
            <input name="stack" value={project.stack} onChange={onProjectChange} placeholder="Stack, e.g. React | Node.js" />
            <input name="link" type="url" value={project.link} onChange={onProjectChange} placeholder="https://project-link.com" required />
            <label className="file-field">
              <span>Project image (max 4 MB)</span>
              <input type="file" accept="image/*" onChange={onImageChange} required={!project.image} />
            </label>
            {project.image && <img className="admin-preview" src={project.image} alt="Project preview" />}
            <button disabled={isBusy}>Publish Project</button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-title"><FaFilePdf /><h2>Update Resume</h2></div>
          <p className="admin-help">
            Current file: {dashboard.settings.resumeName || "Using public/cv.pdf"}
          </p>
          <form onSubmit={uploadResume} className="admin-form">
            <label className="file-field">
              <span>PDF resume (max 6 MB)</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setResumeFile(event.target.files[0] || null)}
                required
              />
            </label>
            <button disabled={!resumeFile || isBusy}>Upload Resume</button>
          </form>
        </section>
      </div>

      <section className="admin-panel admin-wide">
        <div className="admin-title"><FaFolderPlus /><h2>Published Projects</h2></div>
        <div className="admin-project-list">
          {dashboard.projects.length === 0 && <p className="admin-empty">No admin projects yet.</p>}
          {dashboard.projects.map((item) => (
            <article key={item._id} className="admin-project">
              <img src={item.image} alt="" />
              <div><h3>{item.title}</h3><a href={item.link} target="_blank" rel="noreferrer">Open project</a></div>
              <button onClick={() => removeItem("projects", item._id)} disabled={isBusy}>Delete</button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel admin-wide">
        <div className="admin-title"><FaInbox /><h2>Visitor Messages</h2></div>
        <div className="message-list">
          {dashboard.messages.length === 0 && <p className="admin-empty">No messages yet.</p>}
          {dashboard.messages.map((item) => (
            <article key={item._id} className="message-card">
              <div className="message-head">
                <div><h3>{item.fullName}</h3><a href={`mailto:${item.email}`}>{item.email}</a></div>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              {item.company && <p className="message-company">{item.company}</p>}
              <p>{item.message}</p>
              <button onClick={() => removeItem("messages", item._id)} disabled={isBusy}>Delete message</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Admin;
