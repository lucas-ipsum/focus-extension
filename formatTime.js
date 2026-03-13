export function formatTime(seconds, format = "full") {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const pad = (n) => n.toString().padStart(2, "0");

  switch (format) {
    case "seconds":
      return `${pad(secs)}`;

    case "minutes":
      return `${pad(minutes)}`;

    case "hours":
      return `${pad(hours)}`;

    case "hours-minutes":
      return `${pad(hours)}:${pad(minutes)}`;

    case "full":
    default:
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
}
