import Link from 'next/link';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFinanceOverview } from '@/modules/finances/queries';
import { getNotes } from '@/modules/notes/queries';
import { getTasks } from '@/modules/tasks/queries';
import { getBookmarks } from '@/modules/bookmarks/queries';
import { getProfile } from '@/modules/profile/queries';
import { getNotifications } from '@/modules/notifications/weekly-report';
import { formatDate, formatMoney, getPriorityLabels } from '@/lib/format';
import { defaultLocale, isLocale, withLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { Bookmark, CheckSquare, FileText, NotebookText, Plus, Wallet } from 'lucide-react';

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = getDictionary(locale);

  const [{ user, profile }, finance, notes, tasks, bookmarks, notifications] = await Promise.all([
    getProfile(),
    getFinanceOverview(),
    getNotes(),
    getTasks(),
    getBookmarks(),
    getNotifications(locale),
  ]);

  const priorityLabels = getPriorityLabels(t);
  const { income, expense, balance, spentByCategory, dailyCashflow } = finance;
  const upcoming = tasks.filter((task) => task.status !== 'done').slice(0, 3);
  const budgetUsed = spentByCategory.reduce((sum, category) => sum + category.limit, 0);
  const budgetSpent = spentByCategory.reduce((sum, category) => sum + category.spent, 0);
  const budgetPercent = budgetUsed > 0 ? Math.min(100, Math.round((budgetSpent / budgetUsed) * 100)) : 0;

  return (
    <>
      <Topbar profile={profile} email={user?.email ?? ''} notifications={notifications} />
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title={t.dashboard.monthlyBalance} value={formatMoney(balance)} hint={`${t.common.incomeHint} ${formatMoney(income)}`} good={balance >= 0} />
        <Metric title={t.common.income} value={formatMoney(income)} hint={t.common.thisMonth} good />
        <Metric title={t.common.expense} value={formatMoney(expense)} hint={t.common.thisMonth} />
        <Metric title={t.dashboard.budget} value={`${budgetPercent}%`} hint={t.dashboard.budgetHint} />
      </section>
      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{t.dashboard.topCategories}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {spentByCategory.slice(0, 3).map((category) => (
              <div key={category.id}>
                <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="min-w-0 truncate">{category.name}</span><span className="shrink-0">{formatMoney(category.spent)} · {category.percent}%</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${category.percent}%` }} /></div>
              </div>
            ))}
            {spentByCategory.length === 0 ? <p className="text-sm text-muted-foreground">{t.dashboard.noExpenses}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.dashboard.upcomingTasks}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <CheckSquare size={18} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm">{task.title}</p><p className="text-xs text-muted-foreground">{formatDate(task.due_date, locale)}</p></div>
                <span className="rounded-lg border px-2 py-1 text-xs">{priorityLabels[task.priority]}</span>
              </div>
            ))}
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">{t.dashboard.noTasks}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.dashboard.recentNotes}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notes.slice(0, 3).map((note) => (
              <div key={note.id} className="flex gap-3 rounded-xl bg-muted/50 p-3">
                <NotebookText className="text-yellow-400" size={18} />
                <div className="min-w-0"><p className="truncate text-sm">{note.title}</p><p className="text-xs text-muted-foreground">{formatDate(note.updated_at, locale)}</p></div>
              </div>
            ))}
            {notes.length === 0 ? <p className="text-sm text-muted-foreground">{t.dashboard.noNotes}</p> : null}
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.dashboard.financeDynamics}</span>
              <span className="text-xs font-normal text-muted-foreground">14 {t.common.days}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-green-400" />{t.common.income}</span>
              <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-400" />{t.common.expense}</span>
            </div>
            {dailyCashflow.some((day) => day.income > 0 || day.expense > 0) ? (
              <div className="flex h-44 min-w-0 items-end gap-1 sm:gap-2">
                {dailyCashflow.slice(-14).map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.date}: +${formatMoney(day.income)} / -${formatMoney(day.expense)}`}>
                    <div className="flex h-36 w-full items-end justify-center gap-1">
                      <div
                        className="w-1/2 rounded-t-md bg-gradient-to-t from-green-700 to-green-300"
                        style={{ height: day.income > 0 ? `${Math.max(day.incomePercent, 8)}%` : '2px' }}
                      />
                      <div
                        className="w-1/2 rounded-t-md bg-gradient-to-t from-red-700 to-red-300"
                        style={{ height: day.expense > 0 ? `${Math.max(day.expensePercent, 8)}%` : '2px' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(day.date).getDate()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-44 place-items-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
                {t.dashboard.addDataHint}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.dashboard.recentBookmarks}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bookmarks.slice(0, 3).map((bookmark) => (
              <div className="flex items-center gap-3" key={bookmark.id}>
                <Bookmark size={18} />
                <div className="min-w-0"><p className="truncate text-sm">{bookmark.title}</p><p className="truncate text-xs text-muted-foreground">{bookmark.url}</p></div>
              </div>
            ))}
            {bookmarks.length === 0 ? <p className="text-sm text-muted-foreground">{t.dashboard.noBookmarks}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t.dashboard.quickActions}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Link className="block min-w-0" href={withLocale(locale, '/finances')}><Button className="w-full justify-start bg-green-600"><Plus className="shrink-0" size={16} /><span className="min-w-0 truncate">{t.dashboard.addExpense}</span></Button></Link>
            <Link className="block min-w-0" href={withLocale(locale, '/notes')}><Button className="w-full justify-start bg-yellow-600"><Plus className="shrink-0" size={16} /><span className="min-w-0 truncate">{t.dashboard.newNote}</span></Button></Link>
            <Link className="block min-w-0" href={withLocale(locale, '/tasks')}><Button className="w-full justify-start bg-blue-600"><Plus className="shrink-0" size={16} /><span className="min-w-0 truncate">{t.dashboard.newTask}</span></Button></Link>
            <Link className="block min-w-0" href={withLocale(locale, '/bookmarks')}><Button className="w-full justify-start"><Plus className="shrink-0" size={16} /><span className="min-w-0 truncate">{t.dashboard.newLink}</span></Button></Link>
            <Link className="block min-w-0" href={withLocale(locale, '/documents')}><Button className="w-full justify-start bg-slate-700"><FileText className="shrink-0" size={16} /><span className="min-w-0 truncate">{t.dashboard.document}</span></Button></Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Metric({ title, value, hint, good = false }: { title: string; value: string; hint: string; good?: boolean }) {
  return (
    <div className="metric min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{title}</span><Wallet size={16} /></div>
      <div className="break-words text-2xl font-bold sm:text-3xl">{value}</div>
      <p className={good ? 'text-sm text-green-400' : 'text-sm text-red-400'}>{hint}</p>
    </div>
  );
}
