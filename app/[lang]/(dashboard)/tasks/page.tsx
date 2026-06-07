import { Card } from '@/components/ui/card';
import { ProjectForm } from '@/components/tasks/project-form';
import { TaskForm } from '@/components/tasks/task-form';
import { TasksBoard } from '@/components/tasks/tasks-board';
import { getTasks, getProjects } from '@/modules/tasks/queries';
import { formatDate } from '@/lib/format';
import { getPageLocale } from '@/i18n/page';

export default async function TasksPage({ params }: { params: Promise<{ lang: string }> }) {
  const [{ dictionary: dict, locale }, tasks, projects] = await Promise.all([
    getPageLocale(params),
    getTasks(),
    getProjects(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.tasks.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.tasks.subtitle}</p>
      </div>
      <ProjectForm />
      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="min-w-0 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="min-w-0 truncate font-semibold">{project.title}</h2>
              <span className="text-sm text-muted-foreground">{project.progress}%</span>
            </div>
            <p className="break-words text-sm text-muted-foreground">{project.description ?? dict.tasks.noDescription}</p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${project.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {dict.tasks.tasksCount.replace('{count}', String(project.taskCount))} · {dict.tasks.until} {formatDate(project.target_date, locale)}
            </p>
          </Card>
        ))}
        {projects.length === 0 ? <p className="text-sm text-muted-foreground">{dict.tasks.createFirstPlan}</p> : null}
      </div>
      <div className="mt-5">
        <TaskForm projects={projects} />
      </div>
      <div className="mt-5">
        <TasksBoard tasks={tasks} />
      </div>
    </>
  );
}