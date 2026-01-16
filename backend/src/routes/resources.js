const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { authenticate } = require('../middleware/auth');
const Resource = require('../models/Resource');
const StudySession = require('../models/StudySession');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resources');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md|zip|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// GET /api/resources - Get all resources with filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      category, 
      type, 
      tags, 
      subject, 
      folder, 
      isFavorite, 
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    const query = { userId: req.user._id, isArchived: false };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (subject) query.subject = subject;
    if (folder) query.folder = folder;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Resource.countDocuments(query);
    
    res.json({
      success: true,
      data: resources,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/resources/stats - Get user resource statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Resource.getUserStats(req.user._id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get resource stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/resources/folders - Get all folders
router.get('/folders', authenticate, async (req, res) => {
  try {
    const folders = await Resource.distinct('folder', { 
      userId: req.user._id, 
      isArchived: false 
    });
    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// GET /api/resources/:id - Get single resource
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json({ success: true, data: resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// POST /api/resources - Create new resource
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      content,
      tags,
      subject,
      folder,
      thumbnail,
      metadata
    } = req.body;
    
    const resourceData = {
      userId: req.user._id,
      title,
      description,
      type,
      category: category || 'general',
      content: content || {},
      tags: tags || [],
      subject: subject || '',
      folder: folder || 'Unsorted',
      thumbnail: thumbnail || '',
      metadata: metadata || {}
    };
    
    const resource = new Resource(resourceData);
    await resource.save();
    
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// POST /api/resources/upload - Upload file resource
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const {
      title,
      description,
      category,
      tags,
      subject,
      folder
    } = req.body;
    
    const resourceData = {
      userId: req.user._id,
      title: title || req.file.originalname,
      description: description || '',
      type: 'file',
      category: category || 'general',
      content: {
        filePath: `/uploads/resources/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      subject: subject || '',
      folder: folder || 'Unsorted'
    };
    
    const resource = new Resource(resourceData);
    await resource.save();
    
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error('Upload resource error:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
  }
});

// PATCH /api/resources/:id - Update resource
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const allowedUpdates = [
      'title', 'description', 'type', 'category', 'content',
      'tags', 'subject', 'folder', 'isFavorite', 'isArchived',
      'thumbnail', 'metadata'
    ];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        resource[key] = req.body[key];
      }
    });
    
    await resource.save();
    
    res.json({ success: true, data: resource });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// POST /api/resources/:id/launch - Track resource launch/access
router.post('/:id/launch', authenticate, async (req, res) => {
  try {
    const { sessionId, duration } = req.body;
    
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    await resource.recordAccess(sessionId, duration);
    
    res.json({ 
      success: true, 
      data: { 
        url: resource.content.url || resource.content.filePath 
      } 
    });
  } catch (error) {
    console.error('Launch resource error:', error);
    res.status(500).json({ error: 'Failed to launch resource' });
  }
});

// POST /api/resources/:id/sync - Sync resource to cloud
router.post('/:id/sync', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const result = await resource.syncToCloud();
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Sync resource error:', error);
    res.status(500).json({ error: 'Failed to sync resource' });
  }
});

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Delete file if it exists
    if (resource.content && resource.content.filePath) {
      const filePath = path.join(__dirname, '../..', resource.content.filePath);
      await fs.remove(filePath).catch(err => console.error('File delete error:', err));
    }
    
    await resource.deleteOne();
    
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// POST /api/resources/bulk-delete - Bulk delete resources
router.post('/bulk-delete', authenticate, async (req, res) => {
  try {
    const { resourceIds } = req.body;
    
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ error: 'Invalid resource IDs' });
    }
    
    const resources = await Resource.find({
      _id: { $in: resourceIds },
      userId: req.user._id
    });
    
    // Delete files
    for (const resource of resources) {
      if (resource.content && resource.content.filePath) {
        const filePath = path.join(__dirname, '../..', resource.content.filePath);
        await fs.remove(filePath).catch(err => console.error('File delete error:', err));
      }
    }
    
    const result = await Resource.deleteMany({
      _id: { $in: resourceIds },
      userId: req.user._id
    });
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} resources deleted successfully` 
    });
  } catch (error) {
    console.error('Bulk delete resources error:', error);
    res.status(500).json({ error: 'Failed to delete resources' });
  }
});

module.exports = router;
