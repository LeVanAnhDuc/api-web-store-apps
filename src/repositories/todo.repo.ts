import Todo from '../models/todo.model';
import Repository from './base.repo';

class TodoRepo extends Repository {
  constructor() {
    super(Todo, 'Todo');
  }

  public getTodosRepo = async ({
    filter = {},
    skip = 0,
    limit = 0,
    saveCache = false
  }: {
    filter?: Record<string, any>;
    skip?: number;
    limit?: number;
    saveCache?: boolean;
  }) => {
    return await this.find(filter, skip, limit, saveCache);
  };

  public getCountTodosRepo = async (filter: Record<string, any> = {}) => {
    return await this.countDocuments(filter);
  };

  public getTodoByIDRepo = async (id: string, saveCache: boolean = false) => {
    return await this.findById(id, saveCache);
  };

  public addTodoRepo = async (object: Record<string, any> = {}) => {
    return await this.create(object);
  };

  public updateTodoRepo = async (
    id: string,
    objectUpdate: Record<string, any> = {}
  ) => {
    return await this.findByIdAndUpdate(id, objectUpdate);
  };

  public deleteTodoRepo = async (id: string) => {
    return await this.findByIdAndDelete(id);
  };
}

export default TodoRepo;
