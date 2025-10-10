const { Sponsors } = require("../models/sponsor.model");

const path = require("path");
const sharp = require("sharp");
const httpStatus = require("http-status-codes").StatusCodes;
const { uploadBuffer, publicUrl, buildRemotePath } = require("../config/bunny");

const sponsorsController = {

    fetchSponsors: async (req, res) => {
        try {
            const data = await Sponsors.findAll({
                order: [['id', 'DESC']]
            });
            return res.status(httpStatus.OK).json({ message: `Sponsors fetched Successfully`, data })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    createSponsor: async (req, res) => {
        try {
            let logoUrl = null;
            let sponsorData = { ...req.body };
            console.log(sponsorData);
            sponsorData.startDate = new Date(sponsorData.startDate).toLocaleDateString('en-CA');
            sponsorData.endDate = new Date(sponsorData.endDate).toLocaleDateString('en-CA');
            sponsorData.status = 'active';
            const timestampName = (originalname) => {
                const now = Date.now();
                return `${now}-${originalname}`;
            };
            if (req.files?.logo) {
                const logoFile = req.files.logo[0];
                const fileName = timestampName(
                    `${path.parse(logoFile.originalname).name}.avif`
                );
                const remotePath = buildRemotePath(
                    "sponsors",
                    String('admin'),
                    fileName
                );
                const optimizedBuffer = await sharp(logoFile.buffer)
                    .toFormat("avif", { quality: 50 })
                    .toBuffer();
                await uploadBuffer(optimizedBuffer, remotePath, "image/avif");
                logoUrl = publicUrl(remotePath);
                sponsorData.logo = logoUrl;
            }

            await Sponsors.create(sponsorData);
            return res.status(httpStatus.OK).json({ message: `Sponsors created Successfully` })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    editSponsor: async (req, res) => {
        try {
            const id = req.params.id;
            let logoUrl = null;
            let sponsorData = { ...req.body };
            sponsorData.startDate = new Date(sponsorData.startDate);
            sponsorData.endDate = new Date(sponsorData.endDate);
            console.log('>>>>>>> cities', sponsorData.cities);
            console.log('>>>>>>> regions', sponsorData.regions);
            sponsorData.status = 'active';
            const timestampName = (originalname) => {
                const now = Date.now();
                return `${now}-${originalname}`;
            };
            console.log('>>>>>>>>> req.req.files?.logo', req.files?.logo);
            if (req.files?.logo) {
                console.log('>>>>>>>>> req.req.files?.logo inner');
                const logoFile = req.files.logo[0];
                const fileName = timestampName(
                    `${path.parse(logoFile.originalname).name}.avif`
                );
                const remotePath = buildRemotePath(
                    "sponsors",
                    String('admin'),
                    fileName
                );
                const optimizedBuffer = await sharp(logoFile.buffer)
                    .toFormat("avif", { quality: 50 })
                    .toBuffer();
                await uploadBuffer(optimizedBuffer, remotePath, "image/avif");
                logoUrl = publicUrl(remotePath);
                sponsorData.logo = logoUrl;
            }

            await Sponsors.update(sponsorData, {
                where: { id }
            });
            return res.status(httpStatus.OK).json({ message: `Sponsors created Successfully` })
        } catch (error) {
            console.log('>>>>>>> error', error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    deleteSponsor: async (req, res) => {
        try {
            const id = req.params.id;
            await Sponsors.destroy({
                where: { id }
            });
            return res.status(httpStatus.OK).json({ message: `Sponsors created Successfully` })
        } catch (error) {
            console.log('>>>>>> error', error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },
};

module.exports = sponsorsController;
