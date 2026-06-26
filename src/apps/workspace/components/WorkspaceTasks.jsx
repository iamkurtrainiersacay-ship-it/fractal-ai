export default function WorkspaceTasks() {
  const tasks = [
    "Finalize Social Distribution module",
    "Connect Lead Generation module",
    "Build CRM integration layer",
    "Prepare executive demo"
  ];

  return (
    <section className="workspace-panel">
      <h2>Tasks</h2>

      <div className="workspace-list">
        {tasks.map((task) => (
          <div className="workspace-row" key={task}>
            <strong>{task}</strong>
            <span>Open</span>
          </div>
        ))}
      </div>
    </section>
  );
}
