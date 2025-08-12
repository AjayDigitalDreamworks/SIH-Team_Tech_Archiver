import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Admission from "../models/Admission.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload to Cloudinary
const uploadToCloudinary = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", public_id: fileName },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

/**
 * @route   POST /api/admissions
 * @desc    Create new admission
 */
router.post("/", upload.array("documents"), async (req, res) => {
    try {
        // Upload all files to Cloudinary
        const fileUploads = await Promise.all(
            req.files.map(file => uploadToCloudinary(file.buffer, file.originalname))
        );

        const admission = new Admission({
            ...req.body,
            emergencyCase: req.body.emergencyCase === "on" || req.body.emergencyCase === true,
            documents: fileUploads
        });

        await admission.save();
        res.status(201).json({ message: "Admission created successfully", admission });
    } catch (err) {
        console.error("Error creating admission:", err);
        res.status(500).json({ message: "Error creating admission", error: err.message });
    }
});

/**
 * @route   PUT /api/admissions/:id
 * @desc    Reschedule (Update) admission
 */
router.put("/:id", upload.array("documents"), async (req, res) => {
    try {
        let fileUploads = [];
        if (req.files.length > 0) {
            fileUploads = await Promise.all(
                req.files.map(file => uploadToCloudinary(file.buffer, file.originalname))
            );
        }

        const updatedAdmission = await Admission.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                documents: fileUploads.length > 0 ? fileUploads : undefined
            },
            { new: true }
        );

        if (!updatedAdmission) {
            return res.status(404).json({ message: "Admission not found" });
        }

        res.json({ message: "Admission updated successfully", updatedAdmission });
    } catch (err) {
        console.error("Error updating admission:", err);
        res.status(500).json({ message: "Error updating admission", error: err.message });
    }
});

/**
 * @route   DELETE /api/admissions/:id
 * @desc    Cancel admission
 */
router.delete("/:id", async (req, res) => {
    try {
        const deletedAdmission = await Admission.findByIdAndDelete(req.params.id);
        if (!deletedAdmission) {
            return res.status(404).json({ message: "Admission not found" });
        }
        res.json({ message: "Admission cancelled successfully" });
    } catch (err) {
        console.error("Error cancelling admission:", err);
        res.status(500).json({ message: "Error cancelling admission", error: err.message });
    }
});

export default router;
