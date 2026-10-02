export class TaskQueue<Task> {
  private readonly tasks: Task[] = [];

  append(task: Task) {
    this.tasks.push(task);
  }

  take(amount?: number): Task[] {
    if (amount == null) {
      return this.tasks.splice(0, this.tasks.length);
    }

    return this.tasks.splice(0, amount);
  }

  clear() {
    this.tasks.length = 0;
  }
}