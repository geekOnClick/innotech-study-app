import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { taskApi } from './mockApi';
import type { ApiStatusType, Task, TaskDraft, TaskFilters, TaskPriority, TaskStatus } from './types';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  inProgress: 'В работе',
  done: 'Готово',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  dueDate: new Date().toISOString().slice(0, 10),
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    query: '',
    status: 'all',
    priority: 'all',
  });
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const apiStatus = localStorage.getItem('apiStatus');

  useEffect(() => {
    Promise.all([taskApi.getApiStatus(), taskApi.getTasks()])
      .then(([status, loadedTasks]) => {
        // Учебная задача: устанавливается некорректный ключ в local storage apiStatusss
        localStorage.setItem('apiStatusss', status);
        setTasks(loadedTasks);
      })
      .catch(() => setError('Не удалось загрузить моковые задачи'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        task.assignee.toLowerCase().includes(normalizedQuery);
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority =
        filters.priority === 'all' || task.priority === filters.priority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [filters, tasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      // Учебная ошибка: активные задачи считаются неправильно.
      // Сейчас сюда попадают только завершенные задачи, хотя должно быть status !== 'done'.
      active: tasks.filter((task) => task.status === 'done').length,
      done: tasks.filter((task) => task.status === 'done').length,
      high: tasks.filter((task) => task.priority === 'high').length,
    }),
    [tasks],
  );

  const isEditing = editingId !== null;

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim()) {
      setError('Введите название задачи');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingId) {
        const updatedTask = await taskApi.updateTask(editingId, draft);
        setTasks((currentTasks) =>
          currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        );
      } else {
        const createdTask = await taskApi.createTask(draft);
        setTasks((currentTasks) => [createdTask, ...currentTasks]);
      }

      resetForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось сохранить задачу',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate,
    });
  };

  const handleDelete = async (id: string) => {
    setPendingTaskId(id);
    setError('');

    try {
      await taskApi.deleteTask(id);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch {
      setError('Не удалось удалить задачу');
    } finally {
      setPendingTaskId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setPendingTaskId(id);
    setError('');

    try {
      const updatedTask = await taskApi.toggleTaskStatus(id);
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    } catch {
      setError('Не удалось обновить статус');
    } finally {
      setPendingTaskId(null);
    }
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Критически важное для компании приложение</p>
            <h1>Трекер задач</h1>
          </div>
          <div className="sync-indicator">
            <span />
            {apiStatus}
          </div>
        </header>

        <section className="stats-grid" aria-label="Сводка по задачам">
          <StatCard label="Всего" value={stats.total} />
          <StatCard label="Активные" value={stats.active} />
          <StatCard label="Готово" value={stats.done} />
          <StatCard label="Важные" value={stats.high} />
        </section>

        <section className="content-grid">
          <form className="task-form" onSubmit={handleSubmit}>
            <div className="section-title">
              <ClipboardList size={20} aria-hidden="true" />
              <h2>{isEditing ? 'Редактирование' : 'Новая задача'}</h2>
            </div>

            <label>
              Название
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Например, обновить форму"
              />
            </label>

            <label>
              Описание
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                placeholder="Что именно нужно сделать"
                rows={4}
              />
            </label>

            <div className="form-row">
              <label>
                Статус
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as TaskStatus })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Приоритет
                <select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft({ ...draft, priority: event.target.value as TaskPriority })
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Исполнитель
                <input
                  value={draft.assignee}
                  onChange={(event) =>
                    setDraft({ ...draft, assignee: event.target.value })
                  }
                  placeholder="Имя"
                />
              </label>

              <label>
                Срок
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) =>
                    setDraft({ ...draft, dueDate: event.target.value })
                  }
                />
              </label>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="form-actions">
              {isEditing && (
                <button type="button" className="secondary-button" onClick={resetForm}>
                  <X size={18} aria-hidden="true" />
                  Отмена
                </button>
              )}
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="spin" size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                {isEditing ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>

          <section className="task-board">
            <div className="board-toolbar">
              <label className="search-field">
                <Search size={18} aria-hidden="true" />
                <input
                  value={filters.query}
                  onChange={(event) =>
                    setFilters({ ...filters, query: event.target.value })
                  }
                  placeholder="Поиск по задачам"
                />
              </label>

              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    status: event.target.value as TaskFilters['status'],
                  })
                }
                aria-label="Фильтр по статусу"
              >
                <option value="all">Все статусы</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    priority: event.target.value as TaskFilters['priority'],
                  })
                }
                aria-label="Фильтр по приоритету"
              >
                <option value="all">Все приоритеты</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="empty-state">
                <Loader2 className="spin" size={28} aria-hidden="true" />
                Загрузка задач
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={30} aria-hidden="true" />
                Задачи не найдены
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-header">
                      <div>
                        <span className={`priority priority-${task.priority}`}>
                          {priorityLabels[task.priority]}
                        </span>
                        <h3>{task.title}</h3>
                      </div>
                      <span className={`status status-${task.status}`}>
                        {statusLabels[task.status]}
                      </span>
                    </div>

                    <p>{task.description || 'Описание не добавлено'}</p>

                    <div className="task-meta">
                      <span>{task.assignee || 'Без исполнителя'}</span>
                      <span>{formatDate(task.dueDate)}</span>
                    </div>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleToggle(task.id)}
                        disabled={pendingTaskId === task.id}
                        title="Переключить готовность"
                        aria-label="Переключить готовность"
                      >
                        {pendingTaskId === task.id ? (
                          <Loader2 className="spin" size={18} aria-hidden="true" />
                        ) : (
                          <Check size={18} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleEdit(task)}
                        title="Редактировать"
                        aria-label="Редактировать"
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => handleDelete(task.id)}
                        disabled={pendingTaskId === task.id}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(value));
}

export default App;
