const [taskName = "task", reason = "implementation is scheduled for a later OpenSpec task"] =
  process.argv.slice(2);

console.log(`${taskName}: ${reason}.`);

