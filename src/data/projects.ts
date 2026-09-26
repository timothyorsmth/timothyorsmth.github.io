/* Shared project metadata. Asset paths in JSON are relative to public/, without a leading slash. */
import projectList from './projects_list.json';

export interface Project {
  id: string;
  title: string;
  image: string;
  tags: string[];
  markdown: string;
}

export const projects: Project[] = projectList;
// Respect Vite's base path when the portfolio is deployed in a GitHub Pages subdirectory.
export const projectAssetUrl = (path: string) => import.meta.env.BASE_URL + path;
export const projectViewUrl = (id: string) => '?page=project&project=' + encodeURIComponent(id);
