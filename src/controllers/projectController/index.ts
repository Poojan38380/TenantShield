import { createProject } from './createProject.ts';
import { getProjects } from './getProjects.ts';
import { getProjectById } from './getProjectById.ts';
import { updateProject } from './updateProject.ts';
import { deleteProject } from './deleteProject.ts';

export const projectController = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
