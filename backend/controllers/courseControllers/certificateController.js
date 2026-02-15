import Certificate from "../../models/course/Certificate.js";
import Course from "../../models/course/Course.js";
import User from "../../models/user/CoreIdentity.js";
import Enroll from "../../models/course/Enroll.js";
import Progress from "../../models/course/Progress.js";
import Quiz from "../../models/course/Quiz.js";
import Lesson from "../../models/course/Lesson.js";
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
        
        // Calculate average score from all quiz attempts
        const allLessons = await Lesson.find({ course: courseId });
        const lessonIds = allLessons.map(lesson => lesson._id);
        const allQuizzes = await Quiz.find({ lesson: { $in: lessonIds } });
        const allQuizIds = allQuizzes.map(quiz => quiz._id);
        
        // Get all passing quiz attempts for this user and course
        const quizAttempts = await Progress.find({
            user: userId,
            course: courseId,
            quiz: { $in: allQuizIds },
            passed: true
        }).sort({ attemptedAt: -1 });
        
        // Calculate average score from quiz attempts
        let totalScore = 0;
        const quizScores = new Map();
        
        for (const attempt of quizAttempts) {
            const quizId = attempt.quiz.toString();
            if (!quizScores.has(quizId)) {
                quizScores.set(quizId, attempt.percentage);
                totalScore += attempt.percentage;
            }
        }
        
        const averageScore = quizScores.size > 0 ? Math.round(totalScore / quizScores.size) : 0;
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
        
        // Color scheme - Blue and Yellow theme with red seal
        const primaryColor = '#1E3A8A';    // Deep Blue
        const accentColor = '#EAB308';     // Yellow/Gold
        const textColor = '#1F2937';       // Dark gray for text
        const backgroundColor = '#FFFFFF'; // White background
        const redSealColor = '#DC2626';    // Red for seal
        
        // ============================
        // BACKGROUND & BORDER
        // ============================
        
        // White background
        doc.rect(0, 0, pageWidth, pageHeight)
           .fill(backgroundColor);
        
        // Outer border - Blue
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
           .lineWidth(10)
           .strokeColor(primaryColor)
           .stroke();
        
        // Inner border - Yellow
        doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
           .lineWidth(3)
           .strokeColor(accentColor)
           .stroke();
        
        // ============================
        // CERTIFICATE TITLE
        // ============================
        
        doc.fontSize(48)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('CERTIFICATE OF COMPLETION', 0, 80, {
               align: 'center',
               width: pageWidth
           });
        
        // Decorative line under title
        doc.moveTo(centerX - 180, 140)
           .lineTo(centerX + 180, 140)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // ============================
        // MAIN CONTENT
        // ============================
        
        doc.fontSize(16)
           .fillColor(textColor)
           .font('Helvetica')
           .text('This is to certify that', 0, 180, {
               align: 'center',
               width: pageWidth
           });
        
        // Student name - Large and prominent
        const userName = user.name || user.username || "Student";
        doc.fontSize(38)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(userName, 0, 220, {
               align: 'center',
               width: pageWidth
           });
        
        // Underline for name
        const nameWidth = doc.widthOfString(userName);
        const nameUnderlineY = 265;
        doc.moveTo(centerX - (nameWidth / 2) - 30, nameUnderlineY)
           .lineTo(centerX + (nameWidth / 2) + 30, nameUnderlineY)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // Achievement text
        doc.fontSize(16)
           .fillColor(textColor)
           .font('Helvetica')
           .text('has successfully completed the course', 0, 290, {
               align: 'center',
               width: pageWidth
           });
        
        // Course name - Prominent
        doc.fontSize(28)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(course.title.toUpperCase(), 60, 330, {
               align: 'center',
               width: pageWidth - 120
           });
        
        // ============================
        // SCORE AND DATE SECTION
        // ============================
        
        const detailsY = 400;
        
        // Score
        doc.fontSize(14)
           .fillColor(textColor)
           .font('Helvetica')
           .text(`Score: ${averageScore}%`, 0, detailsY, {
               align: 'center',
               width: pageWidth
           });
        
        // Completion Date
        doc.fontSize(14)
           .fillColor(textColor)
           .font('Helvetica')
           .text(`Completion Date: ${completionDate.toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
           })}`, 0, detailsY + 30, {
               align: 'center',
               width: pageWidth
           });
        
        // ============================
        // RED SEAL DESIGN
        // ============================
        
        const sealX = 120;
        const sealY = pageHeight - 100;
        const sealRadius = 45;
        
        // Outer circle - Red
        doc.circle(sealX, sealY, sealRadius)
           .lineWidth(4)
           .strokeColor(redSealColor)
           .fillColor('#FEE2E2')
           .fillAndStroke();
        
        // Middle circle
        doc.circle(sealX, sealY, sealRadius - 10)
           .lineWidth(2)
           .strokeColor(redSealColor)
           .stroke();
        
        // Inner circle
        doc.circle(sealX, sealY, sealRadius - 18)
           .lineWidth(1)
           .strokeColor(redSealColor)
           .stroke();
        
        // Seal star/ribbon design
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x1 = sealX + Math.cos(angle) * (sealRadius - 20);
            const y1 = sealY + Math.sin(angle) * (sealRadius - 20);
            const x2 = sealX + Math.cos(angle) * (sealRadius - 5);
            const y2 = sealY + Math.sin(angle) * (sealRadius - 5);
            
            doc.moveTo(x1, y1)
               .lineTo(x2, y2)
               .lineWidth(1.5)
               .strokeColor(redSealColor)
               .stroke();
        }
        
        // Seal text
        doc.fontSize(8)
           .fillColor(redSealColor)
           .font('Helvetica-Bold')
           .text('CERTIFIED', sealX - 25, sealY - 8, {
               width: 50,
               align: 'center'
           });
        
        // ============================
        // DECORATIVE ELEMENTS
        // ============================
        
        // Corner decorations
        const cornerSize = 30;
        const cornerOffset = 40;
        
        // Top-left corner
        doc.moveTo(cornerOffset, cornerOffset + cornerSize)
           .lineTo(cornerOffset, cornerOffset)
           .lineTo(cornerOffset + cornerSize, cornerOffset)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // Top-right corner
        doc.moveTo(pageWidth - cornerOffset - cornerSize, cornerOffset)
           .lineTo(pageWidth - cornerOffset, cornerOffset)
           .lineTo(pageWidth - cornerOffset, cornerOffset + cornerSize)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // Bottom-left corner (avoiding seal area)
        doc.moveTo(cornerOffset, pageHeight - cornerOffset - cornerSize)
           .lineTo(cornerOffset, pageHeight - cornerOffset)
           .lineTo(cornerOffset + cornerSize, pageHeight - cornerOffset)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
        // Bottom-right corner
        doc.moveTo(pageWidth - cornerOffset - cornerSize, pageHeight - cornerOffset)
           .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset)
           .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset - cornerSize)
           .lineWidth(2)
           .strokeColor(accentColor)
           .stroke();
        
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