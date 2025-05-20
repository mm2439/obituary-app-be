const path = require("path");
const { FloristSlide } = require("../models/florist_slide.model");
const FLORIST_SLIDE_UPLOADS_PATH = path.join(
  __dirname,
  "../floristSlideUploads"
);
const sharp = require("sharp");
const fs = require("fs");
const florsitSlideController = {
  addFloristSlide: async (req, res) => {
    try {
      const { slides, companyId } = req.body;
      const createdSlides = [];
      for (let i = 0; i < slides.length; i++) {
        const { title, description } = slides[i];

        const newSlide = await FloristSlide.create({
          companyId,
          title,
          description,
        });

        const slidesFolder = path.join(
          FLORIST_SLIDE_UPLOADS_PATH,
          String(newSlide.id)
        );
        if (!fs.existsSync(slidesFolder)) {
          fs.mkdirSync(slidesFolder, { recursive: true });
        }

        const file = req.files.find(
          (f) => f.fieldname === `slides[${i}][image]`
        );

        if (file) {
          const imagePath = path.join(
            "floristSlideUploads",
            String(newSlide.id),
            `${path.parse(file.originalname).name}.avif`
          );

          await sharp(file.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", imagePath));

          newSlide.image = imagePath;
          await newSlide.save();
        }

        createdSlides.push(newSlide);
      }

      return res.status(201).json({
        message: "Slides created successfully.",
        slides: createdSlides,
      });
    } catch (error) {
      console.error("Error creating Slide:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitSlideController;
