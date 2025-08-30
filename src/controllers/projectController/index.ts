import { createProject } from './createProject.js';
import { getProjects } from './getProjects.js';
import { getProjectById } from './getProjectById.js';
import { updateProject } from './updateProject.js';
import { deleteProject } from './deleteProject.js';

export const projectController = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
