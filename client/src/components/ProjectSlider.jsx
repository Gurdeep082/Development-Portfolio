import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ProjectSlider = ({ images = [], title }) => {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;

  const next = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div className="project-slider">
      <img
        src={images[current]}
        alt={`${title}-${current}`}
        className="project-slider-image"
      />

      {images.length > 1 && (
        <>
          <button className="slider-btn prev" onClick={prev}>
            <FaChevronLeft />
          </button>

          <button className="slider-btn next" onClick={next}>
            <FaChevronRight />
          </button>

          <div className="slider-dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={index === current ? "active" : ""}
                onClick={() => setCurrent(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSlider;