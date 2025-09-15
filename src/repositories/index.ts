import TodoRepo from "./todo.repo";
import UserResetPasswordTokenRepo from "./passwordResetToken.repo";

const todoRepo = new TodoRepo();
const userResetPasswordTokenRepo = new UserResetPasswordTokenRepo();

export { todoRepo, userResetPasswordTokenRepo };
