import { createClient } from '@/lib/supabase/server';
import type { Project, Task } from '@/types/database';

export async function getTasks(projectId?: string) {
  const supabase = await createClient();
  let query = supabase.from('tasks').select('*').neq('status', 'cancelled').order('due_date', { ascending: true, nullsFirst: false });
  if (projectId) query = query.eq('project_id', projectId);
  const { data } = await query;
  return (data ?? []) as Task[];
}

export async function getProjects() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from('projects').select('*').neq('status', 'archived').order('created_at', { ascending: false });
  const projectList = (projects ?? []) as Project[];
  const tasks = await getTasks();

  return projectList.map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const done = projectTasks.filter((t) => t.status === 'done').length;
    const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
    return { ...project, taskCount: projectTasks.length, progress };
  });
}
