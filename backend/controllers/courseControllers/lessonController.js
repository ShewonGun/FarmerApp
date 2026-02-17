import Course from "../../models/course/Course.js";
import Lesson from "../../models/course/Lesson.js";
import mongoose from "mongoose";

// Helper function to extract YouTube video ID and generate thumbnail
const extractYoutubeThumbnail = (url) => {
    if (!url) return null;
    
    // Extract video ID from various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtube\.com\/embed\/)([^?]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/v\/)([^?]+)/
    ];
    
    let videoId = null;
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            videoId = match[1];
            break;
        }
    }
    
    // Return high quality thumbnail URL (always available for all videos)
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

//Add lesson to a course
export const addLesson = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, content, assetUrl, youtubeUrl } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: "Title and content are required" });
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        
        // Auto-generate thumbnail from YouTube URL
        const thumbnailUrl = extractYoutubeThumbnail(youtubeUrl);
        
        const lesson = new Lesson({
            course: courseId,
            title,
            content,
            assetUrl,
            youtubeUrl,
            thumbnailUrl
        });
        await lesson.save();
        
        course.noOfLessons += 1;
        await course.save();
        
        res.status(201).json({ success: true, lesson });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get lessons for a course
export const getLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: "Invalid course ID" });
        }
        
        const lessons = await Lesson.find({ course: courseId }).sort({ createdAt: 1 });
        res.status(200).json({ success: true, lessons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single lesson by ID
export const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID" });
        }
        
        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        res.status(200).json({ success: true, lesson });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 

// Update a lesson
export const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, assetUrl, youtubeUrl } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID" });
        }
        
        // Build update data object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (assetUrl !== undefined) updateData.assetUrl = assetUrl;
        if (youtubeUrl !== undefined) {
            updateData.youtubeUrl = youtubeUrl;
            // Auto-generate thumbnail if YouTube URL is provided
            if (youtubeUrl) {
                updateData.thumbnailUrl = extractYoutubeThumbnail(youtubeUrl);
            } else {
                updateData.thumbnailUrl = null;
            }
        }
        
        const lesson = await Lesson.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        res.status(200).json({ success: true, lesson });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID" });
        }
        
        const lesson = await Lesson.findByIdAndDelete(id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }
        // Decrement the lesson count in the course
        const course = await Course.findByIdAndUpdate(lesson.course, { $inc: { noOfLessons: -1 } });
        if (!course) {
            console.error(`Course ${lesson.course} not found when deleting lesson ${id}`);
        }
        res.status(200).json({ success: true, message: "Lesson deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Test endpoint for YouTube thumbnail extraction
{/*export const testYoutubeThumbnail = async (req, res) => {
    try {
        const { youtubeUrl } = req.body;
        
        if (!youtubeUrl) {
            return res.status(400).json({ 
                success: false, 
                message: "YouTube URL is required" 
            });
        }
        
        const thumbnailUrl = extractYoutubeThumbnail(youtubeUrl);
        
        if (!thumbnailUrl) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid YouTube URL format" 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            data: {
                youtubeUrl,
                thumbnailUrl,
                thumbnailQualities: {
                    maxres: thumbnailUrl.replace('hqdefault', 'maxresdefault'),
                    hq: thumbnailUrl,
                    mq: thumbnailUrl.replace('hqdefault', 'mqdefault'),
                    sd: thumbnailUrl.replace('hqdefault', 'sddefault')
                }
            },
            message: "Thumbnail extracted successfully" 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; */}
