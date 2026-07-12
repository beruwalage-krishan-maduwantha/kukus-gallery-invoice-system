const Role = require('../models/Role');
const User = require('../models/User');

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort('name');
    const counts = await User.aggregate([
      { $match: { jobRole: { $ne: null } } },
      { $group: { _id: '$jobRole', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });
    res.json(roles.map(r => ({ ...r.toObject(), usersCount: countMap[r._id.toString()] || 0 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Role name is required' });
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: 'Select at least one section' });
    }
    const role = await Role.create({ name: name.trim(), permissions });
    res.status(201).json(role);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A role with this name already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (name?.trim()) role.name = name.trim();
    if (Array.isArray(permissions)) {
      if (permissions.length === 0) return res.status(400).json({ message: 'Select at least one section' });
      role.permissions = permissions;
    }
    await role.save();
    res.json(role);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A role with this name already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const inUse = await User.countDocuments({ jobRole: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ message: `Cannot delete: ${inUse} user(s) still have this role. Reassign them first.` });
    }
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
