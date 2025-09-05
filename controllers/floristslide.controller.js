const path = require("path");
const { FloristSlide } = require("../models/florist_slide.model");
const sharp = require("sharp");
const fs = require("fs");
const { uploadBuffer, publicUrl, buildRemotePath } = require("../config/bunny");
const timestampName = require("../helpers/sanitize").timestampName;

const florsitSlideController = {
  addFloristSlide: async (req, res) => {
    try {
      const { slides, companyId } = req.body;
      const createdOrUpdatedSlides = [];

      console.log("Received slides data:", slides);
      for (let i = 0; i < slides.length; i++) {
        const { id, updated, title, description, image } = slides[i];
        const file = req.files.find(
          (f) => f.fieldname === `slides[${i}][image]`
        );

        // === Update existing slide ===
        if (id && updated) {
          await FloristSlide.update({ title, description }, { where: { id } });

          if (file) {
            const avifBuffer = await sharp(file.buffer)
              .resize(195, 267, { fit: "cover" })
              .toFormat("avif", { quality: 50 })
              .toBuffer();

            const filename = timestampName(file.originalname || "slide.avif");
            const remotePath = buildRemotePath(
              "floristSlides",
              String(companyId),
              String(id),
              filename
            );

            await uploadBuffer(avifBuffer, remotePath, "image/avif");
            const imageUrl = publicUrl(remotePath);

            await FloristSlide.update({ image: imageUrl }, { where: { id } });
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

        if (file) {
          const avifBuffer = await sharp(file.buffer)
            .resize(351, 351, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toBuffer();

          const filename = timestampName(file.originalname || "slide.avif");
          const remotePath = buildRemotePath(
            "floristSlides",
            String(companyId),
            String(newSlide.id),
            filename
          );

          await uploadBuffer(avifBuffer, remotePath, "image/avif");
          const imageUrl = cdnUrl || storageUrl || publicUrl(remotePath);

          newSlide.image = imageUrl;
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
