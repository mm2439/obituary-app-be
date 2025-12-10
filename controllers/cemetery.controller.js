const { Cemeteries } = require("../models/cemetery.model");

const path = require("path");
const sharp = require("sharp");
const httpStatus = require("http-status-codes").StatusCodes;
const { uploadBuffer, publicUrl, buildRemotePath } = require("../config/bunny");
const regionsAndCities = require("../utils/regionAndCities");

// Helper function to get region from city
// Uses case-insensitive comparison to handle any capitalization differences
const getRegionFromCity = (city) => {
    if (!city) return null;
    const normalizedCity = city.trim();
    for (const [region, cities] of Object.entries(regionsAndCities)) {
        // Case-insensitive comparison to handle capitalization differences
        const found = cities.find(c => c.trim().toLowerCase() === normalizedCity.toLowerCase());
        if (found) {
            return region;
        }
    }
    return null;
};

// Helper function to generate timestamped filename
const timestampName = (originalname) => {
    const now = Date.now();
    return `${now}-${originalname}`;
};

// Whitelist of allowed fields for cemetery creation/update
const ALLOWED_CEMETERY_FIELDS = ['name', 'address', 'city'];

// Extract and validate cemetery data from request body
const extractCemeteryData = (body) => {
    const cemeteryData = {};
    
    // Whitelist only allowed fields
    if (body.name !== undefined) {
        cemeteryData.name = String(body.name).trim();
    }
    if (body.address !== undefined) {
        cemeteryData.address = body.address ? String(body.address).trim() : null;
    }
    if (body.city !== undefined) {
        cemeteryData.city = String(body.city).trim();
    }
    
    return cemeteryData;
};

// Validate cemetery data before saving
const validateCemeteryData = (cemeteryData, isUpdate = false) => {
    const errors = [];
    
    if (!isUpdate || cemeteryData.name !== undefined) {
        if (!cemeteryData.name || cemeteryData.name.length === 0) {
            errors.push('Name is required');
        } else if (cemeteryData.name.length > 255) {
            errors.push('Name must not exceed 255 characters');
        }
    }
    
    if (cemeteryData.address !== undefined && cemeteryData.address && cemeteryData.address.length > 500) {
        errors.push('Address must not exceed 500 characters');
    }
    
    if (!isUpdate || cemeteryData.city !== undefined) {
        if (!cemeteryData.city || cemeteryData.city.length === 0) {
            errors.push('City is required');
        } else if (cemeteryData.city.length > 100) {
            errors.push('City must not exceed 100 characters');
        }
    }
    
    return errors;
};

const cemeteryController = {

    fetchCemeteries: async (req, res) => {
        try {
            // Oldest (first entered) cemeteries at the top for easier access to major sites
            const data = await Cemeteries.findAll({
                order: [['id', 'ASC']]
            });
            return res.status(httpStatus.OK).json({ message: `Cemeteries fetched Successfully`, data })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    createCemetery: async (req, res) => {
        try {
            // Extract and whitelist only allowed fields
            let cemeteryData = extractCemeteryData(req.body);
            
            // Validate the extracted data
            const validationErrors = validateCemeteryData(cemeteryData, false);
            if (validationErrors.length > 0) {
                return res.status(httpStatus.BAD_REQUEST).json({ 
                    error: validationErrors.join(', ') 
                });
            }
            
            // Derive region from city
            if (cemeteryData.city) {
                cemeteryData.region = getRegionFromCity(cemeteryData.city);
            }
            
            // Handle picture upload
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
                cemeteryData.pic = publicUrl(remotePath);
            }

            await Cemeteries.create(cemeteryData);
            return res.status(httpStatus.OK).json({ message: `Cemetery created Successfully` })
        } catch (error) {
            console.error("Error creating cemetery:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    editCemetery: async (req, res) => {
        try {
            const id = req.params.id;
            
            // Check if cemetery exists before updating
            const existingCemetery = await Cemeteries.findByPk(id);
            if (!existingCemetery) {
                return res.status(httpStatus.NOT_FOUND).json({ error: "Cemetery not found" });
            }

            // Extract and whitelist only allowed fields
            let cemeteryData = extractCemeteryData(req.body);
            
            // Validate the extracted data (for update, fields are optional)
            const validationErrors = validateCemeteryData(cemeteryData, true);
            if (validationErrors.length > 0) {
                return res.status(httpStatus.BAD_REQUEST).json({ 
                    error: validationErrors.join(', ') 
                });
            }
            
            // Derive region from city if city is being updated
            if (cemeteryData.city) {
                cemeteryData.region = getRegionFromCity(cemeteryData.city);
            }
            
            // Handle picture upload
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
                cemeteryData.pic = publicUrl(remotePath);
            }

            // Only update if there's data to update
            if (Object.keys(cemeteryData).length > 0) {
                const [affectedCount] = await Cemeteries.update(cemeteryData, {
                    where: { id }
                });
                
                if (affectedCount === 0) {
                    return res.status(httpStatus.NOT_FOUND).json({ error: "Cemetery not found" });
                }
            }
            
            return res.status(httpStatus.OK).json({ message: `Cemetery updated Successfully` })
        } catch (error) {
            console.error("Error updating cemetery:", error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },

    deleteCemetery: async (req, res) => {
        try {
            const id = req.params.id;
            
            // Check if cemetery exists before deleting
            const existingCemetery = await Cemeteries.findByPk(id);
            if (!existingCemetery) {
                return res.status(httpStatus.NOT_FOUND).json({ error: "Cemetery not found" });
            }
            
            const deletedCount = await Cemeteries.destroy({
                where: { id }
            });
            
            if (deletedCount === 0) {
                return res.status(httpStatus.NOT_FOUND).json({ error: "Cemetery not found" });
            }
            
            return res.status(httpStatus.OK).json({ message: `Cemetery deleted Successfully` })
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Prišlo je do napake" });
        }
    },
};

module.exports = cemeteryController;

