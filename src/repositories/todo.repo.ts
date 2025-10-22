// import Todo from "../models/todo.model";
// import Repository from "./base.repo";

// class TodoRepo extends Repository {
//   constructor() {
//     super(Todo, "Todo");
//   }

//   public getTodosRepo = async ({
//     filter = {},
//     skip = 0,
//     limit = 0,
//     saveCache = false
//   }: {
//     filter?: Record<string, any>;
//     skip?: number;
//     limit?: number;
//     saveCache?: boolean;
//   }) => await this.find(filter, skip, limit, saveCache);

//   public getCountTodosRepo = async (filter: Record<string, any> = {}) =>
//     await this.countDocuments(filter);

//   public getTodoByIDRepo = async (id: string, saveCache: boolean = false) =>
//     await this.findById(id, saveCache);

//   public addTodoRepo = async (object: Record<string, any> = {}) =>
//     await this.create(object);

//   public updateTodoRepo = async (
//     id: string,
//     objectUpdate: Record<string, any> = {}
//   ) => await this.findByIdAndUpdate(id, objectUpdate);

//   public deleteTodoRepo = async (id: string) =>
//     await this.findByIdAndDelete(id);
// }

// export default TodoRepo;
