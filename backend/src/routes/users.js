const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', auth, adminAuth, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        createdAt: true,
        // Exclude password
      }
    });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Create new user (Admin only)
router.post('/create', auth, adminAuth, async (req, res, next) => {
  try {
    const { username, password, role, email } = req.body;
    
    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ 
        error: 'Username, password, and role are required' 
      });
    }
    
    // Validate role
    if (!['admin', 'manager', 'viewer', 'user'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be admin, manager, viewer, or user' 
      });
    }
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        email
      },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        createdAt: true
      }
    });
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser 
    });
  } catch (error) {
    next(error);
  }
});

// Update user (Admin only)
router.put('/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role, email } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(email && { email })
      },
      select: {
        id: true,
        username: true,
        role: true,
        email: true
      }
    });
    
    res.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    next(error);
  }
});

// Reset user password (Admin only)
router.put('/:id/reset-password', auth, adminAuth, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Change own password (Any authenticated user)
router.put('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account' 
      });
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
