const path = require("path");
const { FloristSlide } = require("../models/florist_slide.model");
const FLORIST_SLIDE_UPLOADS_PATH = path.join(__dirname, "../cemetryUploads");

const florsitSlideController = {
  addFloristSlide: async (req, res) => {
    try {
      const slidesData = JSON.parse(req.body.slides);
      const createdSlides = [];

      for (let i = 0; i < slidesData.length; i++) {
        const { companyId, title, description } = slidesData[i];

        const newSlide = await FloristSlide.create({
          companyId,
          title,
          description,
        });

        const floristSlideFolder = path.join(
          FLORIST_SLIDE_UPLOADS_PATH,
          newSlide.id
        );

        if (!fs.existsSync(floristSlideFolder)) {
          fs.mkdirSync(floristSlideFolder, { recursive: true });
        }

        let picturePath = null;

        if (req.files?.pictures && req.files.pictures[i]) {
          const pictureFile = req.files.pictures[i];

          const optimizedPicturePath = path.join(
            "floristSlideUploads",
            String(newSlide.id),
            `${path.parse(pictureFile.originalname).name}.avif`
          );

          await sharp(pictureFile.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", optimizedPicturePath));

          picturePath = optimizedPicturePath;
          newSlide.image = picturePath;
          await newSlide.save();
        }

        createdSlides.push(newSlide);
      }

      return res.status(201).json({
        message: "Slides created successfully.",
        slides: createdSlides,
      });
    } catch (error) {
      console.error("Error creating Slides:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitSlideController;
