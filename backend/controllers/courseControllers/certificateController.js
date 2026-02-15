import Certificate from "../../models/course/Certificate.js";
import Course from "../../models/course/Course.js";
import User from "../../models/user/CoreIdentity.js";
import Enroll from "../../models/course/Enroll.js";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import cloudinary from "../../config/cloudinary.js";
import { Readable } from "stream";

// Generate Professional Certificate
export const generateCertificate = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        
        // Check if user is enrolled
        const enrollment = await Enroll.findOne({ user: userId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "User is not enrolled in this course" });
        }
        
        // Check if course is completed
        if (!enrollment.completedAt) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot generate certificate. You must complete all lessons and pass all quizzes first. Use the mark course as completed endpoint.",
                progress: enrollment.progress,
                completedLessons: enrollment.completedLessons.length,
                completedQuizzes: enrollment.completedQuizzes.length
            });
        }
        
        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
        if (existingCertificate) {
            return res.status(200).json({ 
                success: true, 
                message: "Certificate already exists",
                certificate: existingCertificate 
            });
        }
        
        // Generate certificate data
        const averageScore = enrollment.averageScore || 0;
        const completionDate = enrollment.completedAt;
        const year = completionDate.getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certificateNumber = `CERT-${year}-${random}`;
        
        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });
        
        // Collect PDF chunks in memory
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        
        // Create promise for PDF completion
        const pdfPromise = new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
        });
        
        // Page dimensions
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const centerX = pageWidth / 2;
        
        // Color scheme - Professional blue and gold
        const primaryColor = '#1a237e';    // Deep blue
        const accentColor = '#ffd700';     // Gold
        const textColor = '#2c3e50';       // Dark gray
        const lightGray = '#ecf0f1';
        
        // ============================
        // BACKGROUND & BORDER
        // ============================
        
        // Light background
        doc.rect(0, 0, pageWidth, pageHeight)
           .fill(lightGray);
        
        // Outer border - Gold
        doc.rect(25, 25, pageWidth - 50, pageHeight - 50)
           .lineWidth(8)
           .strokeColor(accentColor)
           .stroke();
        
        // Inner border - Blue
        doc.rect(35, 35, pageWidth - 70, pageHeight - 70)
           .lineWidth(2)
           .strokeColor(primaryColor)
           .stroke();
        
        // Decorative corner elements
        const cornerSize = 40;
        const cornerOffset = 45;
        
        // Top-left corner
        doc.moveTo(cornerOffset, cornerOffset + cornerSize)
           .lineTo(cornerOffset, cornerOffset)
           .lineTo(cornerOffset + cornerSize, cornerOffset)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // Top-right corner
        doc.moveTo(pageWidth - cornerOffset - cornerSize, cornerOffset)
           .lineTo(pageWidth - cornerOffset, cornerOffset)
           .lineTo(pageWidth - cornerOffset, cornerOffset + cornerSize)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // Bottom-left corner
        doc.moveTo(cornerOffset, pageHeight - cornerOffset - cornerSize)
           .lineTo(cornerOffset, pageHeight - cornerOffset)
           .lineTo(cornerOffset + cornerSize, pageHeight - cornerOffset)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // Bottom-right corner
        doc.moveTo(pageWidth - cornerOffset - cornerSize, pageHeight - cornerOffset)
           .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset)
           .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset - cornerSize)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        
        // Organization/Platform name
        doc.fontSize(14)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('LEARNING MANAGEMENT SYSTEM', 0, 65, {
               align: 'center',
               width: pageWidth
           });
        
        // Certificate title
        doc.fontSize(52)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('CERTIFICATE', 0, 105, {
               align: 'center',
               width: pageWidth
           });
        
        doc.fontSize(24)
           .fillColor(accentColor)
           .font('Helvetica-Bold')
           .text('OF COMPLETION', 0, 165, {
               align: 'center',
               width: pageWidth
           });
        
        // Decorative line under title
        doc.moveTo(centerX - 120, 200)
           .lineTo(centerX + 120, 200)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // MAIN CONTENT
        
        doc.fontSize(14)
           .fillColor(textColor)
           .font('Helvetica')
           .text('This is proudly presented to', 0, 230, {
               align: 'center',
               width: pageWidth
           });
        
        // Student name - Large and prominent
        const userName = user.name || user.username || "Student";
        doc.fontSize(36)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(userName, 0, 265, {
               align: 'center',
               width: pageWidth
           });
        
        // Underline for name
        const nameWidth = doc.widthOfString(userName);
        const nameUnderlineY = 308;
        doc.moveTo(centerX - (nameWidth / 2) - 20, nameUnderlineY)
           .lineTo(centerX + (nameWidth / 2) + 20, nameUnderlineY)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // Achievement text
        doc.fontSize(14)
           .fillColor(textColor)
           .font('Helvetica')
           .text('for successfully completing the course', 0, 330, {
               align: 'center',
               width: pageWidth
           });
        
        // Course name - Prominent
        doc.fontSize(26)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(course.title, 60, 365, {
               align: 'center',
               width: pageWidth - 120
           });
        
        // DETAILS SECTION        
        const detailsY = 425;
        const leftColumnX = 150;
        const rightColumnX = pageWidth - 250;
        
        // Left column - Score
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica')
           .text('SCORE', leftColumnX, detailsY, {
               width: 200,
               align: 'center'
           });
        
        doc.fontSize(20)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(`${averageScore}%`, leftColumnX, detailsY + 20, {
               width: 200,
               align: 'center'
           });
        
        // Right column - Date
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica')
           .text('COMPLETION DATE', rightColumnX - 50, detailsY, {
               width: 200,
               align: 'center'
           });
        
        doc.fontSize(16)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(completionDate.toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
           }), rightColumnX - 50, detailsY + 20, {
               width: 200,
               align: 'center'
           });
        
        // SIGNATURE SECTION
        
        const signatureY = pageHeight - 130;
        const signatureLeftX = 180;
        const signatureRightX = pageWidth - 280;
        
        // Left signature line
        doc.moveTo(signatureLeftX, signatureY)
           .lineTo(signatureLeftX + 150, signatureY)
           .lineWidth(1)
           .strokeColor(textColor)
           .stroke();
        
        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text('Director', signatureLeftX, signatureY + 8, {
               width: 150,
               align: 'center'
           });
        
        doc.fontSize(9)
           .font('Helvetica')
           .text('Learning Management System', signatureLeftX, signatureY + 24, {
               width: 150,
               align: 'center'
           });
        
        // Right signature line
        doc.moveTo(signatureRightX, signatureY)
           .lineTo(signatureRightX + 150, signatureY)
           .lineWidth(1)
           .strokeColor(textColor)
           .stroke();
        
        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text('Course Instructor', signatureRightX, signatureY + 8, {
               width: 150,
               align: 'center'
           });
        
        doc.fontSize(9)
           .font('Helvetica')
           .text(course.instructor || 'Instructor Name', signatureRightX, signatureY + 24, {
               width: 150,
               align: 'center'
           });
   
        // FOOTER        
        doc.fontSize(9)
           .fillColor('#7f8c8d')
           .font('Helvetica')
           .text(`Certificate ID: ${certificateNumber}`, 0, pageHeight - 55, {
               align: 'center',
               width: pageWidth
           });
        
        // Decorative seal/badge (optional - simple circle)
        const sealX = centerX;
        const sealY = pageHeight - 100;
        const sealRadius = 35;
        
        // Outer circle - Gold
        doc.circle(sealX, sealY, sealRadius)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // Inner circle - Blue
        doc.circle(sealX, sealY, sealRadius - 8)
           .lineWidth(2)
           .strokeColor(primaryColor)
           .stroke();
        
        // Seal text
        doc.fontSize(9)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('VERIFIED', sealX - 30, sealY - 20, {
               width: 60,
               align: 'center'
           });
        
        doc.fontSize(7)
           .fillColor(primaryColor)
           .font('Helvetica')
           .text(year.toString(), sealX - 30, sealY - 5, {
               width: 60,
               align: 'center'
           });
        
        // Finalize PDF
        doc.end();
        
        // Wait for PDF buffer
        const pdfBuffer = await pdfPromise;
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("Generated PDF is empty");
        }
        
        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'certificates',
                    resource_type: 'raw',
                    public_id: certificateNumber,
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            
            const bufferStream = new Readable();
            bufferStream.push(pdfBuffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
        
        // Save certificate to database
        const certificate = new Certificate({
            user: userId,
            course: courseId,
            certificateNumber,
            certificateUrl: uploadResult.secure_url,
            issueDate: new Date(),
            completionDate,
            averageScore
        });
        
        await certificate.save();
        
        return res.status(201).json({
            success: true,
            message: "Certificate generated successfully",
            certificate
        });
        
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message
        });
    }
};

// Get certificate by user and course
export const getCertificate = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid user or course ID" });
        }
        
        const certificate = await Certificate.findOne({ user: userId, course: courseId })
            .populate('user', 'name username email')
            .populate('course', 'title');
        
        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found" });
        }
        
        return res.status(200).json({
            success: true,
            certificate
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get all certificates for a user
export const getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        
        const certificates = await Certificate.find({ user: userId })
            .populate('course', 'title description')
            .sort({ issueDate: -1 });
        
        return res.status(200).json({
            success: true,
            count: certificates.length,
            certificates
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Verify certificate by certificate number
export const verifyCertificate = async (req, res) => {
    try {
        const { certificateNumber } = req.params;
        
        const certificate = await Certificate.findOne({ certificateNumber })
            .populate('user', 'name username')
            .populate('course', 'title');
        
        if (!certificate) {
            return res.status(404).json({ 
                success: false, 
                message: "Certificate not found",
                isValid: false
            });
        }
        
        return res.status(200).json({
            success: true,
            isValid: true,
            certificate: {
                certificateNumber: certificate.certificateNumber,
                studentName: certificate.user.name || certificate.user.username,
                courseName: certificate.course.title,
                issueDate: certificate.issueDate,
                completionDate: certificate.completionDate,
                averageScore: certificate.averageScore
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};