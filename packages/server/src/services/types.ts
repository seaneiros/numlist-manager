export type TaskRecord<Type, Payload = any> = {
  type: Type;
  payload: Payload;
};

export interface IWorker<Task extends TaskRecord<string>> {
  add(task: Task): void;
  stop(): void;
}