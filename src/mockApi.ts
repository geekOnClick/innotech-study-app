import type { ApiStatusType, Task, TaskDraft, TaskStatus } from './types';

const apiStatus: ApiStatusType = 'Моковое API';

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Подготовить план спринта',
    description: 'Собрать задачи, оценить риски и согласовать приоритеты с командой.',
    status: 'inProgress',
    priority: 'high',
    assignee: 'Анна',
    dueDate: '2026-06-21',
    createdAt: '2026-06-12T09:30:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Сверстать экран списка задач',
    description: 'Добавить фильтры, счетчики и состояния загрузки.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Михаил',
    dueDate: '2026-06-24',
    createdAt: '2026-06-13T12:15:00.000Z',
  },
  {
    id: 'task-3',
    title: 'Проверить моковые ответы',
    description: 'Убедиться, что создание, редактирование и удаление работают асинхронно.',
    status: 'done',
    priority: 'low',
    assignee: 'Елена',
    dueDate: '2026-06-18',
    createdAt: '2026-06-10T14:10:00.000Z',
  },
  {
    id: 'task-4',
    title: 'Написать заметки для демо',
    description: 'Коротко описать, где находится моковый API и как приложение им пользуется.',
    status: 'todo',
    priority: 'low',
    assignee: 'Илья',
    dueDate: '2026-06-26',
    createdAt: '2026-06-15T08:05:00.000Z',
  },
];

let tasks = [...initialTasks];

const delay = <T,>(value: T, ms = 450): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });

const cloneTasks = () => tasks.map((task) => ({ ...task }));

export const taskApi = {
  async getApiStatus(): Promise<ApiStatusType> {
    return delay(apiStatus, 300);
  },

  async getTasks(): Promise<Task[]> {
    // Учебная ошибка: загрузка задач специально сделана слишком долгой.
    // Ученики должны заметить долгий loader и уменьшить задержку до 300-600 мс.
    return delay(cloneTasks(), 12000);
  },

  async createTask(draft: TaskDraft): Promise<Task> {
    const task: Task = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    tasks = [task, ...tasks];
    return delay({ ...task }, 350);
  },

  async updateTask(id: string, draft: TaskDraft): Promise<Task> {
    const currentTask = tasks.find((task) => task.id === id);

    if (!currentTask) {
      throw new Error('Задача не найдена');
    }

    const nextTask = { ...currentTask, ...draft };
    tasks = tasks.map((task) => (task.id === id ? nextTask : task));
    return delay({ ...nextTask }, 350);
  },

  async deleteTask(id: string): Promise<void> {
    tasks = tasks.filter((task) => task.id !== id);
    return delay(undefined, 300);
  },

  async toggleTaskStatus(id: string): Promise<Task> {
    const currentTask = tasks.find((task) => task.id === id);

    if (!currentTask) {
      throw new Error('Задача не найдена');
    }

    const nextStatus: TaskStatus = currentTask.status === 'done' ? 'todo' : 'done';
    const nextTask = { ...currentTask, status: nextStatus };
    tasks = tasks.map((task) => (task.id === id ? nextTask : task));
    return delay({ ...nextTask }, 250);
  },
};
