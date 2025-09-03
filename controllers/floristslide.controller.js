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
      const createdOrUpdatedSlides = [];

      for (let i = 0; i < slides.length; i++) {
        const { id, updated, title, description, image } = slides[i];
        const file = req.files.find(
          (f) => f.fieldname === `slides[${i}][image]`
        );

        // === Update existing slide ===
        if (id && updated) {
          await FloristSlide.update({ title, description }, { where: { id } });

          if (file) {
            const imagePath = path.join(
              "floristSlideUploads",
              String(id),
              `${path.parse(file.originalname).name}.avif`
            );

            const slideFolder = path.join(
              FLORIST_SLIDE_UPLOADS_PATH,
              String(id)
            );
            if (!fs.existsSync(slideFolder)) {
              fs.mkdirSync(slideFolder, { recursive: true });
            }

            await sharp(file.buffer)
              .resize(351, 351, { fit: "cover" })
              .toFormat("avif", { quality: 50 })
              .toFile(path.join(__dirname, "../", imagePath));

            await FloristSlide.update({ image: imagePath }, { where: { id } });
          } else if (typeof image === "string") {
            await FloristSlide.update({ image }, { where: { id } });
          }

          const updatedSlide = await FloristSlide.findByPk(id);
          if (updatedSlide) {
            createdOrUpdatedSlides.push(updatedSlide);
          }

          continue;
        }

        // === Skip unmodified existing slide ===
        if (id && !updated) {
          continue;
        }

        // === Create new slide ===
        const newSlide = await FloristSlide.create({
          companyId,
          title,
          description,
        });

        const slideFolder = path.join(
          FLORIST_SLIDE_UPLOADS_PATH,
          String(newSlide.id)
        );
        if (!fs.existsSync(slideFolder)) {
          fs.mkdirSync(slideFolder, { recursive: true });
        }

        if (file) {
          const imagePath = path.join(
            "floristSlideUploads",
            String(newSlide.id),
            `${path.parse(file.originalname).name}.avif`
          );

          await sharp(file.buffer)
            .resize(351, 351, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", imagePath));

          newSlide.image = imagePath;
          await newSlide.save();
        } else if (typeof image === "string") {
          newSlide.image = image;
          await newSlide.save();
        }

        createdOrUpdatedSlides.push(newSlide);
      }

      // ✅ Fetch all slides for the company
      const allSlides = await FloristSlide.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Slides processed successfully.",
        slides: allSlides, // send all slides
      });
    } catch (error) {
      console.error("Error processing slides:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitSlideController;
