const { Cemeteries } = require("../models/cemetery.model");

const path = require("path");
const sharp = require("sharp");
const httpStatus = require("http-status-codes").StatusCodes;
const { uploadBuffer, publicUrl, buildRemotePath } = require("../config/bunny");
const regionsAndCities = require("../utils/regionAndCities");

// Helper function to get region from city
const getRegionFromCity = (city) => {
    if (!city) return null;
    for (const [region, cities] of Object.entries(regionsAndCities)) {
        if (cities.includes(city)) {
            return region;
        }
    }
    return null;
};

const cemeteryController = {

    fetchCemeteries: async (req, res) => {
        try {
            const data = await Cemeteries.findAll({
                order: [['id', 'DESC']]
            });
            return res.status(httpStatus.OK).json({ message: `Cemeteries fetched Successfully`, data })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    createCemetery: async (req, res) => {
        try {
            let picUrl = null;
            let cemeteryData = { ...req.body };
            
            // Derive region from city
            if (cemeteryData.city) {
                cemeteryData.region = getRegionFromCity(cemeteryData.city);
            }

            const timestampName = (originalname) => {
                const now = Date.now();
                return `${now}-${originalname}`;
            };
            
            if (req.files?.pic) {
                const picFile = req.files.pic[0];
                const fileName = timestampName(
                    `${path.parse(picFile.originalname).name}.avif`
                );
                const remotePath = buildRemotePath(
                    "cemeteries",
                    String('admin'),
                    fileName
                );
                const optimizedBuffer = await sharp(picFile.buffer)
                    .toFormat("avif", { quality: 50 })
                    .toBuffer();
                await uploadBuffer(optimizedBuffer, remotePath, "image/avif");
                picUrl = publicUrl(remotePath);
                cemeteryData.pic = picUrl;
            }

            await Cemeteries.create(cemeteryData);
            return res.status(httpStatus.OK).json({ message: `Cemetery created Successfully` })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    editCemetery: async (req, res) => {
        try {
            const id = req.params.id;
            let picUrl = null;
            let cemeteryData = { ...req.body };
            
            // Derive region from city
            if (cemeteryData.city) {
                cemeteryData.region = getRegionFromCity(cemeteryData.city);
            }

            const timestampName = (originalname) => {
                const now = Date.now();
                return `${now}-${originalname}`;
            };
            
            if (req.files?.pic) {
                const picFile = req.files.pic[0];
                const fileName = timestampName(
                    `${path.parse(picFile.originalname).name}.avif`
                );
                const remotePath = buildRemotePath(
                    "cemeteries",
                    String('admin'),
                    fileName
                );
                const optimizedBuffer = await sharp(picFile.buffer)
                    .toFormat("avif", { quality: 50 })
                    .toBuffer();
                await uploadBuffer(optimizedBuffer, remotePath, "image/avif");
                picUrl = publicUrl(remotePath);
                cemeteryData.pic = picUrl;
            }

            await Cemeteries.update(cemeteryData, {
                where: { id }
            });
            return res.status(httpStatus.OK).json({ message: `Cemetery updated Successfully` })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    deleteCemetery: async (req, res) => {
        try {
            const id = req.params.id;
            await Cemeteries.destroy({
                where: { id }
            });
            return res.status(httpStatus.OK).json({ message: `Cemetery deleted Successfully` })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },
};

module.exports = cemeteryController;

